import { resolve, createResolutionContext } from './container';
import { matchRoute } from '../router';
import { ModuleRef } from './module-ref';
import type { IModuleRef } from '../interfaces/module-ref.interface';
import { MIDDLEWARE_METADATA_KEY } from '../decorators/use-middleware.decorator';
import type { Middleware, NextFunction } from '../interfaces/middleware.interface';

export class App {
  private moduleRefs = new Map<Function, IModuleRef>();
  private rootModuleRef!: IModuleRef;
  private globalMiddlewares: (new (...args: any[]) => Middleware)[] = [];

  constructor(private rootModuleClass: Function) {
    console.log(`Initializing app with root module: ${this.rootModuleClass.name}`);
    this._compileModule(this.rootModuleClass);
    if (!this.rootModuleRef) {
      throw new Error('Root module could not be compiled.');
    }
    this._bootstrapInstances(this.rootModuleRef);
  }

  use(...middlewares: (new (...args: any[]) => Middleware)[]): this {
    this.globalMiddlewares.push(...middlewares);
    return this;
  }

  private _compileModule(moduleClass: Function): IModuleRef {
    if (this.moduleRefs.has(moduleClass)) {
      return this.moduleRefs.get(moduleClass)!;
    }

    const moduleRef = new ModuleRef(moduleClass);
    this.moduleRefs.set(moduleClass, moduleRef);

    if (moduleClass === (this as any).rootModuleClass) {
      (this as any).rootModuleRef = moduleRef;
    }

    if (moduleRef.metadata.imports) {
      for (const importedModuleClass of moduleRef.metadata.imports) {
        if (typeof importedModuleClass === 'function' && importedModuleClass.prototype) {
          const importedRef = this._compileModule(importedModuleClass);
          moduleRef.addImport(importedRef);
        } else {
          console.warn(
            `Warning: Invalid entry in 'imports' array of module ${moduleClass.name}. Entry is not a class constructor.`,
            importedModuleClass
          );
        }
      }
    }
    return moduleRef;
  }

  private _bootstrapInstances(moduleRef: IModuleRef, processed = new Set<IModuleRef>()): void {
    if (processed.has(moduleRef)) {
      return;
    }
    processed.add(moduleRef);

    for (const importedRef of moduleRef.imports) {
      this._bootstrapInstances(importedRef, processed);
    }

    const currentContext = createResolutionContext(moduleRef);

    if (moduleRef.metadata.providers) {
      for (const ProviderClass of moduleRef.metadata.providers) {
        if (typeof ProviderClass === 'function' && ProviderClass.prototype) {
          resolve(ProviderClass as any, currentContext);
        }
      }
    }
    if (moduleRef.metadata.controllers) {
      for (const ControllerClass of moduleRef.metadata.controllers) {
        if (typeof ControllerClass === 'function' && ControllerClass.prototype) {
          resolve(ControllerClass as any, currentContext);
        }
      }
    }
  }

  listen(port: number) {
    const getControllerModuleRef = (controllerClass: Function): IModuleRef | undefined => {
      for (const mRef of this.moduleRefs.values()) {
        if (mRef.metadata.controllers?.includes(controllerClass)) {
          return mRef;
        }
      }
      return undefined;
    };

    const globalMiddlewareClasses = this.globalMiddlewares;

    Bun.serve({
      port,
      fetch: async (req) => {
        try {
          const url = new URL(req.url);
          const matched = matchRoute(req.method, url.pathname);

          if (!matched) {
            return new Response('Not Found', { status: 404 });
          }

          const { handlerName, params, controllerClassToken } = matched;

          const controllerModuleRef = getControllerModuleRef(controllerClassToken);
          if (!controllerModuleRef) {
            const errorMessage = `Internal Server Error: Controller module not found for controller ${controllerClassToken.name}`;
            console.error(errorMessage);
            return new Response(errorMessage, { status: 500 });
          }

          const controllerContext = createResolutionContext(controllerModuleRef);

          const routeMiddlewares =
            Reflect.getMetadata(
              MIDDLEWARE_METADATA_KEY,
              controllerClassToken.prototype,
              handlerName
            ) || [];
          const controllerMiddlewares =
            Reflect.getMetadata(MIDDLEWARE_METADATA_KEY, controllerClassToken) || [];
          const allMiddlewareClasses = [
            ...globalMiddlewareClasses,
            ...controllerMiddlewares,
            ...routeMiddlewares,
          ];

          const middlewareInstances = allMiddlewareClasses.map(
            (mwClass) => resolve(mwClass, controllerContext) as Middleware
          );

          const finalHandler: NextFunction = async (): Promise<Response> => {
            const instance = resolve(controllerClassToken as any, controllerContext);

            let requestBody: any = {};
            if (
              req.method !== 'GET' &&
              req.method !== 'HEAD' &&
              req.headers.get('content-length') !== '0'
            ) {
              try {
                const contentType = req.headers.get('content-type');
                if (contentType?.includes('application/json')) requestBody = await req.json();
                else if (contentType?.includes('application/x-www-form-urlencoded'))
                  requestBody = Object.fromEntries(new URLSearchParams(await req.text()));
              } catch (e) {
                console.error('Failed to parse request body:', e);
                return new Response('Invalid request body', { status: 400 });
              }
            }

            const handler = (instance as any)[handlerName];
            const paramMeta: any[] =
              Reflect.getMetadata('custom:param', instance as object, handlerName) || [];
            const args = new Array(handler.length);
            for (let i = 0; i < args.length; i++) {
              const meta = paramMeta[i];
              if (meta) {
                if (meta.type === 'query')
                  args[i] = Object.fromEntries(url.searchParams.entries())[meta.key];
                else if (meta.type === 'param') args[i] = params[meta.key];
                else if (meta.type === 'body')
                  args[i] = meta.key ? requestBody[meta.key] : requestBody;
              } else args[i] = undefined;
            }

            try {
              const result = await handler.apply(instance, args);
              if (result instanceof Response) return result;
              if (typeof result === 'object' && result !== null) return Response.json(result);
              if (result === undefined || result === null)
                return new Response(null, { status: 204 });
              return new Response(String(result));
            } catch (handlerError: any) {
              console.error(
                `Error in handler ${controllerClassToken.name}.${handlerName}:`,
                handlerError
              );
              return new Response(
                JSON.stringify({ message: 'Internal Server Error', error: handlerError.message }),
                {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }
          };

          const chain = middlewareInstances
            .reverse()
            .reduce((next, middleware) => () => middleware.use(req, next), finalHandler);

          return await chain();
        } catch (serverError: any) {
          console.error('Unhandled error during fetch processing:', serverError);
          return new Response('Internal Server Error', { status: 500 });
        }
      },
      error: (error: Error) => {
        console.error('Bun server error:', error);
        return new Response('Server error', { status: 500 });
      },
    });
    console.log(`🌊 App is running on http://localhost:${port}`);
  }
}
