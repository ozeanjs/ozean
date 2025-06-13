import { resolve, createResolutionContext } from './container';
import { matchRoute } from '../router';
import { ModuleRef } from './module-ref';
import type { IModuleRef } from '../interfaces/module-ref.interface';
import { MIDDLEWARE_METADATA_KEY } from '../decorators/use-middleware.decorator';
import { PIPES_METADATA_KEY } from '../decorators/use-pipes.decorator';
import type { Middleware, NextFunction } from '../interfaces/middleware.interface';
import type { PipeTransform, ArgumentMetadata } from '../interfaces/pipe.interface';
import { BadRequestException, ForbiddenException } from '../exceptions/http-exception';
import type { ArgumentsHost, ExceptionFilter } from 'interfaces/exception-filter.interface';
import { BaseExceptionFilter } from 'filters/base-exception-filter';
import { CATCH_METADATA_KEY } from 'decorators/catch.decorator';
import { FILTERS_METADATA_KEY } from 'decorators/use-filters.decorator';
import type { CanActivate, ExecutionContext } from 'interfaces/can-activate.interface';
import { GUARDS_METADATA_KEY } from 'decorators/use-guards.decorator';

export class App {
  private globalFilters: (new (...args: any[]) => ExceptionFilter)[] = [];
  private readonly baseExceptionFilter: BaseExceptionFilter;
  private moduleRefs = new Map<Function, IModuleRef>();
  private rootModuleRef!: IModuleRef;
  private globalMiddlewares: (new (...args: any[]) => Middleware)[] = [];
  private globalModuleRefs = new Set<IModuleRef>();
  private globalGuards: (new (...args: any[]) => CanActivate)[] = [];

  constructor(private rootModuleClass: Function) {
    this.baseExceptionFilter = new BaseExceptionFilter();
    console.log(`Initializing app with root module: ${this.rootModuleClass.name}`);
    this._compileModule(this.rootModuleClass);
    if (!this.rootModuleRef) {
      throw new Error('Root module could not be compiled.');
    }
    this._bootstrapInstances(this.rootModuleRef);
  }

  useGlobalGuards(...guards: (new (...args: any[]) => CanActivate)[]): this {
    this.globalGuards.push(...guards);
    return this;
  }

  useGlobalFilters(...filters: (new (...args: any[]) => ExceptionFilter)[]): this {
    this.globalFilters.push(...filters);
    return this;
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

    if (moduleRef.isGlobal) {
      this.globalModuleRefs.add(moduleRef);
    }

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

    const currentContext = createResolutionContext(moduleRef, this.globalModuleRefs);

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
    const globalModuleRefs = this.globalModuleRefs;
    const globalGuardClasses = this.globalGuards;

    Bun.serve({
      port,
      fetch: async (req) => {
        let matched: any;
        let controllerContext: any;
        let controllerClassToken: any;
        let handlerName: any;

        try {
          const url = new URL(req.url);
          matched = matchRoute(req.method, url.pathname);

          if (!matched) {
            return new Response('Not Found', { status: 404 });
          }

          const { params } = matched;
          handlerName = matched.handlerName;
          controllerClassToken = matched.controllerClassToken;

          const controllerModuleRef = getControllerModuleRef(controllerClassToken);
          if (!controllerModuleRef) {
            const errorMessage = `Internal Server Error: Controller module not found for controller ${controllerClassToken.name}`;
            console.error(errorMessage);
            return new Response(errorMessage, { status: 500 });
          }

          controllerContext = createResolutionContext(controllerModuleRef, globalModuleRefs);

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
            const handlerMethod = (controllerClassToken.prototype as any)[handlerName!];
            const executionContext: ExecutionContext = {
              getClass: () => controllerClassToken,
              getHandler: () => handlerMethod,
              getRequest: <Request>() => req as Request,
            };

            const controllerGuards =
              Reflect.getMetadata(GUARDS_METADATA_KEY, controllerClassToken) || [];
            const routeGuards =
              Reflect.getMetadata(
                GUARDS_METADATA_KEY,
                controllerClassToken.prototype,
                handlerName
              ) || [];
            const allGuardClasses = [...globalGuardClasses, ...controllerGuards, ...routeGuards];
            const guardInstances: CanActivate[] = allGuardClasses.map((g) =>
              resolve(g, controllerContext)
            );

            for (const guard of guardInstances) {
              const canActivate = await guard.canActivate(executionContext);
              if (!canActivate) {
                throw new ForbiddenException('Access denied by guard.');
              }
            }

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
                throw new BadRequestException(
                  'Invalid request body. Malformed JSON or other parsing error.'
                );
              }
            }

            const handler = (instance as any)[handlerName];

            const pipesOnMethod =
              Reflect.getMetadata(PIPES_METADATA_KEY, instance as object, handlerName) || [];
            const pipeInstances = pipesOnMethod.map((p: any) => resolve(p, controllerContext));

            const paramTypes =
              Reflect.getMetadata('design:paramtypes', instance as object, handlerName) || [];
            const paramMeta: any[] =
              Reflect.getMetadata('custom:param', instance as object, handlerName) || [];
            const args = new Array(handler.length);

            for (let i = 0; i < args.length; i++) {
              const meta = paramMeta[i];
              let value: any;

              if (meta) {
                if (meta.type === 'query')
                  value = Object.fromEntries(url.searchParams.entries())[meta.key];
                else if (meta.type === 'param') value = params[meta.key];
                else if (meta.type === 'body')
                  value = meta.key ? requestBody[meta.key] : requestBody;
              }

              const argumentMetadata: ArgumentMetadata = {
                type: meta?.type,
                metatype: paramTypes[i],
                data: meta?.key,
              };

              for (const pipe of pipeInstances as PipeTransform[]) {
                value = await pipe.transform(value, argumentMetadata);
              }
              args[i] = value;
            }

            const result = await handler.apply(instance, args);
            if (result instanceof Response) return result;
            if (typeof result === 'object' && result !== null) return Response.json(result);
            if (result === undefined || result === null) return new Response(null, { status: 204 });
            return new Response(String(result));
          };

          const chain = middlewareInstances
            .reverse()
            .reduce((next, middleware) => () => middleware.use(req, next), finalHandler);

          return await chain();
        } catch (error: any) {
          const host: ArgumentsHost = { getRequest: <Request>() => req as Request };
          let routeFilters: any[] = [];
          let controllerFilters: any[] = [];
          if (controllerClassToken && handlerName) {
            controllerFilters =
              Reflect.getMetadata(FILTERS_METADATA_KEY, controllerClassToken) || [];
            if (handlerName) {
              routeFilters =
                Reflect.getMetadata(
                  FILTERS_METADATA_KEY,
                  controllerClassToken.prototype,
                  handlerName
                ) || [];
            }
          }
          const allFilterClasses = [...this.globalFilters, ...controllerFilters, ...routeFilters];

          if (!controllerContext) {
            controllerContext = createResolutionContext(this.rootModuleRef, this.globalModuleRefs);
          }

          for (const FilterClass of allFilterClasses) {
            const exceptionTypesToCatch =
              Reflect.getMetadata(CATCH_METADATA_KEY, FilterClass) || [];
            const canCatch =
              exceptionTypesToCatch.length === 0 ||
              exceptionTypesToCatch.some((type: any) => error instanceof type);
            if (canCatch) {
              console.log(
                `Using specific filter for ${error.constructor.name}: ${FilterClass.name}`
              );
              const filterInstance = resolve(FilterClass, controllerContext);
              return (filterInstance as ExceptionFilter).catch(error, host);
            }
          }
          return this.baseExceptionFilter.catch(error, host);
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
