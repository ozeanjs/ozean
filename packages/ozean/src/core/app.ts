import { resolve, createResolutionContext, type ResolutionContext } from './container';
import { matchRoute } from '../router';
import { ModuleRef } from './module-ref';
import type { IModuleRef } from '../interfaces/module-ref.interface';
import { MIDDLEWARE_METADATA_KEY } from '../decorators/use-middleware.decorator';
import { PIPES_METADATA_KEY } from '../decorators/use-pipes.decorator';
import type { Middleware, NextFunction } from '../interfaces/middleware.interface';
import type { ArgumentMetadata } from '../interfaces/pipe.interface';
import { BadRequestException, ForbiddenException } from '../exceptions/http-exception';
import type { ArgumentsHost, ExceptionFilter } from 'interfaces/exception-filter.interface';
import { BaseExceptionFilter } from 'filters/base-exception-filter';
import { CATCH_METADATA_KEY } from 'decorators/catch.decorator';
import { FILTERS_METADATA_KEY } from 'decorators/use-filters.decorator';
import type { CanActivate, ExecutionContext } from 'interfaces/can-activate.interface';
import { GUARDS_METADATA_KEY } from 'decorators/use-guards.decorator';
import type { RouteExecutionPlan } from 'interfaces/execution-plan.interface';
import { getMetadataArgsStorage } from 'metadata/storage';
import { HttpStatus } from 'common/http-status.enum';
import path from 'path';

export class App {
  private globalFilters: (new (...args: any[]) => ExceptionFilter)[] = [];
  private readonly baseExceptionFilter: BaseExceptionFilter;
  private moduleRefs = new Map<Function, IModuleRef>();
  private rootModuleRef!: IModuleRef;
  private globalMiddlewares: (new (...args: any[]) => Middleware)[] = [];
  private globalModuleRefs = new Set<IModuleRef>();
  private globalGuards: (new (...args: any[]) => CanActivate)[] = [];
  private routeCache = new Map<string, RouteExecutionPlan>();
  private staticAssetsConfigs: { path: string; prefix: string }[] = [];

  constructor(private rootModuleClass: Function) {
    this.baseExceptionFilter = new BaseExceptionFilter();
    console.log(`Initializing app with root module: ${this.rootModuleClass.name}`);
    this._compileModules();
    if (!this.rootModuleRef) {
      throw new Error('Root module could not be compiled.');
    }
    this._bootstrapInstances();
  }

  useStaticAssets(directoryPath: string, options: { prefix?: string } = {}): this {
    const prefix = options.prefix
      ? options.prefix.startsWith('/')
        ? options.prefix
        : '/' + options.prefix
      : '/';
    const config = {
      path: directoryPath,
      prefix: prefix === '/' ? '' : prefix, // If prefix is '/', treat it as root for matching
    };
    this.staticAssetsConfigs.push(config);
    console.log(`Serving static assets from "${directoryPath}" at URL prefix "${prefix}"`);
    return this;
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

  private _compileModules(): void {
    const compile = (moduleClass: Function): IModuleRef => {
      if (this.moduleRefs.has(moduleClass)) return this.moduleRefs.get(moduleClass)!;
      const moduleRef = new ModuleRef(moduleClass);
      this.moduleRefs.set(moduleClass, moduleRef);
      if (moduleRef.isGlobal) this.globalModuleRefs.add(moduleRef);
      if (moduleClass === this.rootModuleClass) this.rootModuleRef = moduleRef;
      if (moduleRef.metadata.imports) {
        for (const importedModuleClass of moduleRef.metadata.imports) {
          if (typeof importedModuleClass === 'function' && importedModuleClass.prototype) {
            moduleRef.addImport(compile(importedModuleClass));
          }
        }
      }
      return moduleRef;
    };
    compile(this.rootModuleClass);
  }

  private _bootstrapInstances(): void {
    for (const moduleRef of this.moduleRefs.values()) {
      const context = createResolutionContext(moduleRef, this.globalModuleRefs);
      if (moduleRef.metadata.providers)
        for (const ProviderClass of moduleRef.metadata.providers)
          if (typeof ProviderClass === 'function' && ProviderClass.prototype)
            resolve(ProviderClass as any, context);
      if (moduleRef.metadata.controllers)
        for (const ControllerClass of moduleRef.metadata.controllers)
          if (typeof ControllerClass === 'function' && ControllerClass.prototype)
            resolve(ControllerClass as any, context);
    }
  }

  private _buildRouteCache(): void {
    console.log('Building route cache...');
    const routeMetadata = getMetadataArgsStorage().routes;

    for (const route of routeMetadata) {
      const { target: controllerToken, handlerName, method, path: routePath } = route;
      const controllerPath =
        getMetadataArgsStorage().controllers[controllerToken as any]?.path || '/';
      const fullPath =
        (controllerPath === '/' ? '' : controllerPath) +
        (routePath.startsWith('/') ? '' : '/') +
        routePath;
      const cacheKey = `${method}:${fullPath}`; // e.g., "GET:/users/:id"

      const moduleRef = this.getModuleRefByController(controllerToken);
      if (!moduleRef) continue;

      const context = createResolutionContext(moduleRef, this.globalModuleRefs);

      // Pre-resolve middlewares, guards, pipes, filters
      const routeMiddlewares =
        Reflect.getMetadata(MIDDLEWARE_METADATA_KEY, controllerToken.prototype, handlerName) || [];
      const controllerMiddlewares =
        Reflect.getMetadata(MIDDLEWARE_METADATA_KEY, controllerToken) || [];
      const middlewareInstances = [
        ...this.globalMiddlewares,
        ...controllerMiddlewares,
        ...routeMiddlewares,
      ].map((m) => resolve(m, context) as Middleware);

      const routeGuards =
        Reflect.getMetadata(GUARDS_METADATA_KEY, controllerToken.prototype, handlerName) || [];
      const controllerGuards = Reflect.getMetadata(GUARDS_METADATA_KEY, controllerToken) || [];
      const guardInstances = [...this.globalGuards, ...controllerGuards, ...routeGuards].map(
        (g) => resolve(g, context) as CanActivate
      );

      const pipeClasses =
        Reflect.getMetadata(PIPES_METADATA_KEY, controllerToken.prototype, handlerName) || [];
      const pipeInstances = pipeClasses.map((p: any) => resolve(p, context));

      const routeFilters =
        Reflect.getMetadata(FILTERS_METADATA_KEY, controllerToken.prototype, handlerName) || [];
      const controllerFilters = Reflect.getMetadata(FILTERS_METADATA_KEY, controllerToken) || [];
      const filterInstances = [...this.globalFilters, ...controllerFilters, ...routeFilters].map(
        (f) => resolve(f, context) as ExceptionFilter
      );

      const paramMeta =
        Reflect.getMetadata('custom:param', controllerToken.prototype, handlerName) || [];
      const paramTypes =
        Reflect.getMetadata('design:paramtypes', controllerToken.prototype, handlerName) || [];

      this.routeCache.set(cacheKey, {
        controllerToken,
        handlerName,
        middlewareInstances,
        guardInstances,
        pipeInstances,
        filterInstances,
        paramMeta,
        paramTypes,
      });
    }
    console.log(`Route cache built with ${this.routeCache.size} entries.`);
  }

  private getModuleRefByController(controllerToken: Function): IModuleRef | undefined {
    for (const mRef of this.moduleRefs.values()) {
      if (mRef.metadata.controllers?.includes(controllerToken)) return mRef;
    }
    return undefined;
  }

  listen(port: number) {
    this._buildRouteCache();
    const staticConfigs = this.staticAssetsConfigs;

    const server = Bun.serve({
      port,
      fetch: async (req) => {
        let executionPlan: RouteExecutionPlan | undefined;
        let context: ResolutionContext | undefined;

        try {
          const url = new URL(req.url);
          const pathname = url.pathname;

          const matchingStaticConfig = staticConfigs
            .sort((a, b) => b.prefix.length - a.prefix.length) // Sort by prefix length to match most specific first
            .find((config) => pathname.startsWith(config.prefix));

          if (matchingStaticConfig) {
            const config = matchingStaticConfig;
            const relativePath = pathname.substring(config.prefix.length);
            const filePath = path.join(config.path, relativePath);

            const file = Bun.file(filePath);
            if (await file.exists()) return new Response(file);
          }

          const matched = matchRoute(req.method, pathname);
          if (!matched) return new Response('Not Found', { status: HttpStatus.NOT_FOUND });

          const cacheKey = `${req.method}:${matched.routePath}`; // router needs to return the matched path pattern
          executionPlan = this.routeCache.get(cacheKey);

          if (!executionPlan) {
            console.error(`Execution plan not found for key: ${cacheKey}`);
            return new Response(`Internal Server Error: Route handler not configured correctly.`, {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
            });
          }

          const moduleRef = this.getModuleRefByController(executionPlan.controllerToken);
          if (!moduleRef)
            return new Response(`Internal Server Error: Controller module not found.`, {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
            });

          context = createResolutionContext(moduleRef, this.globalModuleRefs);

          const finalHandler: NextFunction = async () => {
            const executionContext: ExecutionContext = {
              getClass: () => executionPlan!.controllerToken as new (...args: any[]) => any,
              getHandler: () =>
                (executionPlan!.controllerToken.prototype as any)[executionPlan!.handlerName],
              getRequest: <Request>() => req as Request,
            };

            for (const guard of executionPlan!.guardInstances) {
              if (!(await guard.canActivate(executionContext))) throw new ForbiddenException();
            }

            const instance = resolve(executionPlan!.controllerToken as any, context!);
            let body: any = {};
            if (req.method !== 'GET' && req.method !== 'HEAD')
              try {
                if (req.headers.get('content-type')?.includes('json')) body = await req.json();
              } catch (e) {
                throw new BadRequestException('Invalid body');
              }

            const args = new Array(executionPlan!.paramTypes.length);
            for (let i = 0; i < args.length; i++) {
              const meta = executionPlan!.paramMeta[i];
              let val: any;
              if (meta) {
                if (meta.type === 'query') val = Object.fromEntries(url.searchParams)[meta.key];
                else if (meta.type === 'param') val = matched.params[meta.key];
                else if (meta.type === 'body') val = meta.key ? body[meta.key] : body;
              }
              const argMeta: ArgumentMetadata = {
                type: meta?.type,
                metatype: executionPlan!.paramTypes[i],
                data: meta?.key,
              };
              for (const pipe of executionPlan!.pipeInstances)
                val = await pipe.transform(val, argMeta);
              args[i] = val;
            }
            const result = await (instance as any)[executionPlan!.handlerName].apply(
              instance,
              args
            );
            if (result instanceof Response) return result;
            if (typeof result === 'object' && result !== null) return Response.json(result);
            if (result === undefined || result === null)
              return new Response(null, { status: HttpStatus.NO_CONTENT });
            return new Response(String(result));
          };

          return await executionPlan.middlewareInstances
            .reverse()
            .reduce((next, middleware) => () => middleware.use(req, next), finalHandler)();
        } catch (error: any) {
          const host: ArgumentsHost = { getRequest: <Request>() => req as Request };
          if (executionPlan && context) {
            for (const filter of executionPlan.filterInstances) {
              const types = Reflect.getMetadata(CATCH_METADATA_KEY, filter.constructor) || [];
              if (types.length === 0 || types.some((t: any) => error instanceof t))
                return filter.catch(error, host);
            }
          }
          return this.baseExceptionFilter.catch(error, host);
        }
      },
      error: (e: Error) =>
        new Response('Server error', { status: HttpStatus.INTERNAL_SERVER_ERROR }),
    });

    console.log(`🌊 App is running on http://localhost:${port}`);

    return server;
  }
}
