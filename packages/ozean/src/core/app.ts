import FindMyWay from 'find-my-way';
import { resolve, createResolutionContext, type ResolutionContext } from './container';
import { ModuleRef } from './module-ref';
import type { IModuleRef } from '../interfaces/module-ref.interface';
import { MIDDLEWARE_METADATA_KEY } from '../decorators/use-middleware.decorator';
import { PIPES_METADATA_KEY } from '../decorators/use-pipes.decorator';
import type { Middleware, NextFunction } from '../interfaces/middleware.interface';
import type { ArgumentMetadata } from '../interfaces/pipe.interface';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '../exceptions/http-exception';
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
import type { CallHandler, Interceptor } from 'interfaces/interceptor.interface';
import { INTERCEPTORS_METADATA_KEY } from 'decorators/use-interceptors.decorator';
import type { DynamicModule } from 'interfaces/module.interface';
import type { Provider, ProviderToken, TypeProvider } from 'interfaces/provider.interface';
import { WsRouter } from './ws-router';
import { GATEWAY_METADATA } from '../decorators/websocket-gateway.decorator';
import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '../interfaces/websocket-gateway.interface';
import { WEBSOCKET_SERVER_METADATA } from '../decorators/websocket-server.decorator';
import { BaseWsExceptionFilter } from '../filters/base-ws-exception-filter';
import type { WsExceptionFilter } from '../interfaces/ws-exception-filter.interface';
import { WS_PARAM_METADATA } from 'decorators/websocket-params.decorator';
import { WS_FILTERS_METADATA_KEY } from 'decorators/use-ws-filters.decorator';

function isDynamicModule(m: any): m is DynamicModule {
  return !!(m as DynamicModule).module;
}

function getModuleToken(m: Function | DynamicModule): Function {
  return isDynamicModule(m) ? m.module : m;
}

function isTypeProvider(p: Provider): p is TypeProvider {
  return typeof p === 'function';
}

function getProviderToken(p: Provider): ProviderToken {
  return isTypeProvider(p) ? p : p.provide;
}

export class App {
  private globalFilters: (new (...args: any[]) => ExceptionFilter)[] = [];
  private readonly baseExceptionFilter: BaseExceptionFilter;
  private globalWsFilters: (new (...args: any[]) => WsExceptionFilter)[] = [];
  private readonly baseWsExceptionFilter: BaseWsExceptionFilter;
  private readonly moduleContainer = new Map<Function, ModuleRef>();
  private readonly globalProviders = new Map<ProviderToken, Provider>();
  private globalMiddlewares: (new (...args: any[]) => Middleware)[] = [];
  private globalModuleRefs = new Set<IModuleRef>();
  private globalGuards: (new (...args: any[]) => CanActivate)[] = [];
  private routeCache = new Map<string, RouteExecutionPlan>();
  private staticAssetsConfigs: { path: string; prefix: string }[] = [];
  private globalInterceptors: (Function | (new (...args: any[]) => Interceptor))[] = [];
  private router: FindMyWay.Instance<FindMyWay.HTTPVersion.V1>;
  private resolvedInstances: any[] = [];
  private readonly wsRouter = new WsRouter();
  private gatewayInstances: any[] = [];

  constructor(private rootModuleClass: Function) {
    this.baseExceptionFilter = new BaseExceptionFilter();
    this.baseWsExceptionFilter = new BaseWsExceptionFilter();

    this.router = FindMyWay({
      // ignoreTrailingSlash: true,
      defaultRoute: (req, res) => {
        throw new NotAcceptableException();
      },
    });

    console.log(`Initializing app with root module: ${this.rootModuleClass.name}`);
    this._scanModules();
    this._bootstrap();
  }

  useGlobalInterceptors(
    ...interceptors: (Function | (new (...args: any[]) => Interceptor))[]
  ): this {
    this.globalInterceptors.push(...interceptors);
    return this;
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

  public useGlobalWsFilters(...filters: (new (...args: any[]) => WsExceptionFilter)[]): this {
    this.globalWsFilters.push(...filters);
    return this;
  }

  use(...middlewares: (new (...args: any[]) => Middleware)[]): this {
    this.globalMiddlewares.push(...middlewares);
    return this;
  }

  private _scanModules() {
    const modulesToProcess: (Function | DynamicModule)[] = [this.rootModuleClass];
    const processedTokens = new Set<Function>();

    while (modulesToProcess.length > 0) {
      const moduleDef = modulesToProcess.shift()!;
      const token = getModuleToken(moduleDef);

      if (processedTokens.has(token)) continue;
      processedTokens.add(token);

      const moduleRef = new ModuleRef(moduleDef, this.globalProviders);
      this.moduleContainer.set(token, moduleRef);

      if (moduleRef.isGlobal) {
        moduleRef.providers.forEach((provider, providerToken) => {
          this.globalProviders.set(providerToken, provider);
        });
      }

      (moduleRef.metadata.imports || []).forEach((importedModuleDef) => {
        modulesToProcess.push(importedModuleDef);
      });
    }

    // Link modules after all have been scanned
    this.moduleContainer.forEach((moduleRef, token) => {
      (moduleRef.metadata.imports || []).forEach((importedModuleDef) => {
        const importedModuleToken = getModuleToken(importedModuleDef);
        const importedModuleRef = this.moduleContainer.get(importedModuleToken);
        if (importedModuleRef) {
          moduleRef.addImport(importedModuleRef);
        }
      });
    });
  }

  private _bootstrap(): void {
    this.moduleContainer.forEach((moduleRef) => {
      const context = createResolutionContext(moduleRef, this.globalModuleRefs);
      moduleRef.providers.forEach((provider) => {
        this.resolvedInstances.push(resolve(getProviderToken(provider), context));
        if (Reflect.getMetadata(GATEWAY_METADATA, provider)) {
          this.gatewayInstances.push(resolve(getProviderToken(provider), context));
          this.wsRouter.registerGateway(resolve(getProviderToken(provider), context));
        }
      });
    });
    this._callOnModuleInit();
  }

  private async _callOnModuleInit(): Promise<void> {
    for (const instance of this.resolvedInstances) {
      if (typeof instance.onModuleInit === 'function') {
        await instance.onModuleInit();
      }
    }
  }

  private async _callOnApplicationBootstrap(): Promise<void> {
    for (const instance of this.resolvedInstances) {
      if (typeof instance.onApplicationBootstrap === 'function') {
        await instance.onApplicationBootstrap();
      }
    }
  }

  private async _callOnApplicationShutdown(signal?: string): Promise<void> {
    console.log(`\n[OzeanJs] Shutting down application (signal: ${signal})...`);
    for (const instance of [...this.resolvedInstances].reverse()) {
      if (typeof instance.onApplicationShutdown === 'function') {
        await instance.onApplicationShutdown(signal);
      }
    }
    console.log('[OzeanJs] Application has been shut down gracefully.');
  }

  public enableShutdownHooks(signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']): void {
    console.log('[OzeanJs] Shutdown hooks enabled.');
    signals.forEach((signal) => {
      process.on(signal, async () => {
        await this._callOnApplicationShutdown(signal);
        process.exit(0);
      });
    });
  }

  private joinUrlPaths(...parts: string[]): string {
    const joined = parts
      .map((part) => part.trim().replace(/^\/|\/$/g, ''))
      .filter(Boolean)
      .join('/');
    return `/${joined}${parts[parts.length - 1]?.match(/\/$/g) ? '/' : ''}`;
  }

  private _initializeRouter(): void {
    if ((this.router as any).routes.length > 0) return;

    console.log('Initializing routes with find-my-way...');
    const routeMetadata = getMetadataArgsStorage().routes;

    for (const route of routeMetadata) {
      const { target: controllerToken, handlerName, method, path: routePath } = route;
      const controllerPath =
        getMetadataArgsStorage().controllers[controllerToken as any]?.path || '/';
      const fullPath = this.joinUrlPaths(controllerPath, routePath);

      const moduleRef = this.getModuleRefByController(controllerToken);
      if (!moduleRef) continue;

      const context = createResolutionContext(moduleRef, this.globalModuleRefs);

      const routeInterceptors =
        Reflect.getMetadata(INTERCEPTORS_METADATA_KEY, controllerToken.prototype, handlerName) ||
        [];
      const controllerInterceptors =
        Reflect.getMetadata(INTERCEPTORS_METADATA_KEY, controllerToken) || [];
      const interceptorClasses = [
        ...this.globalInterceptors,
        ...controllerInterceptors,
        ...routeInterceptors,
      ];
      const interceptorInstances = interceptorClasses.map((Interceptor) => {
        const InterceptorClass =
          typeof Interceptor === 'function' && Interceptor.prototype
            ? Interceptor
            : (Interceptor as Function)();
        return resolve(InterceptorClass as ProviderToken, context, {
          bypassAccessibilityCheck: true,
        }) as Interceptor;
      });

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

      const executionPlan: RouteExecutionPlan = {
        controllerToken,
        handlerName,
        middlewareInstances,
        guardInstances,
        pipeInstances,
        filterInstances,
        interceptorInstances,
        paramMeta,
        paramTypes,
      };

      this.router.on(method as any, fullPath, (req, res, params, store) => store, executionPlan);
    }
    console.log(`Route cache built with ${this.routeCache.size} entries.`);
  }

  private getModuleRefByController(controllerToken: Function): IModuleRef | undefined {
    for (const mRef of this.moduleContainer.values()) {
      if (mRef.metadata.controllers?.includes(controllerToken)) return mRef;
    }
    return undefined;
  }

  private getModuleRefByProvider(providerToken: Function): ModuleRef | undefined {
    for (const mRef of this.moduleContainer.values()) {
      if (mRef.providers.has(providerToken)) {
        return mRef;
      }
    }
    return undefined;
  }

  listen(port: number) {
    this._initializeRouter();
    this._callOnApplicationBootstrap();
    const staticConfigs = this.staticAssetsConfigs;

    const server = Bun.serve({
      port,
      fetch: async (req, server) => {
        if (server.upgrade(req)) {
          return;
        }
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

          const found = this.router.find(req.method as any, pathname);
          if (!found) {
            throw new NotFoundException();
          }

          executionPlan = found.store as RouteExecutionPlan;
          const matched = { params: found.params };

          if (!executionPlan) {
            console.error(`Execution plan not found for route: ${pathname}`);
            throw new InternalServerErrorException(
              'Internal Server Error: Route handler not configured correctly.'
            );
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

            const handlerWithPipes = async () => {
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
                  if (meta.type === 'req') {
                    val = req;
                  } else if (meta.type === 'file') {
                    val = (req as any).file;
                  } else if (meta.type === 'query') {
                    val = Object.fromEntries(url.searchParams)[meta.key];
                  } else if (meta.type === 'param') {
                    val = matched.params[meta.key];
                  } else if (meta.type === 'body') {
                    val = meta.key ? body[meta.key] : body;
                  }
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

            // Build the interceptor chain
            const interceptorInstances = executionPlan!.interceptorInstances;
            const interceptorChain: CallHandler = interceptorInstances
              .slice()
              .reverse()
              .reduce(
                (next: any, interceptor: any) => ({
                  handle: () => interceptor.intercept(executionContext, next),
                }),
                { handle: handlerWithPipes }
              );

            return await interceptorChain.handle();
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
      websocket: {
        open: async (ws) => {
          for (const instance of this.gatewayInstances) {
            if (typeof (instance as OnGatewayConnection).handleConnection === 'function') {
              await (instance as OnGatewayConnection).handleConnection(
                ws,
                (ws.data as any)?.request as Request
              );
            }
          }
        },
        message: async (ws, message) => {
          let gatewayInstance: any;
          let handlerName: string | symbol = '';
          let moduleRef: ModuleRef | undefined;

          try {
            const parsed = JSON.parse(message.toString());
            if (!parsed.event) return;

            const handlerInfo = this.wsRouter.findHandler(parsed.event);
            if (!handlerInfo) return;

            ({ instance: gatewayInstance, handlerName } = handlerInfo);

            const handler = gatewayInstance[handlerName];
            const paramsMetadata =
              Reflect.getMetadata(WS_PARAM_METADATA, gatewayInstance, handlerName) || [];
            const args = new Array(paramsMetadata.length);
            for (let i = 0; i < args.length; i++) {
              const meta = paramsMetadata[i];
              if (meta.type === 'socket') args[i] = ws;
              if (meta.type === 'body') args[i] = parsed.data;
            }

            const result = await handler.apply(gatewayInstance, args);
            if (result) ws.send(JSON.stringify(result));
          } catch (error: any) {
            const host: ArgumentsHost = { getRequest: () => ws as any }; // Adapt host for WS

            if (gatewayInstance && handlerName) {
              moduleRef = this.getModuleRefByProvider(gatewayInstance.constructor);
            }

            if (moduleRef) {
              const context = createResolutionContext(moduleRef, this.globalModuleRefs);
              const routeFilters =
                Reflect.getMetadata(WS_FILTERS_METADATA_KEY, gatewayInstance, handlerName) || [];
              const gatewayFilters =
                Reflect.getMetadata(WS_FILTERS_METADATA_KEY, gatewayInstance.constructor) || [];
              const allFilterClasses = [
                ...this.globalWsFilters,
                ...gatewayFilters,
                ...routeFilters,
              ];

              for (const FilterClass of allFilterClasses) {
                const exceptionTypesToCatch =
                  Reflect.getMetadata(CATCH_METADATA_KEY, FilterClass) || [];
                const canCatch =
                  exceptionTypesToCatch.length === 0 ||
                  exceptionTypesToCatch.some((type: any) => error instanceof type);
                if (canCatch) {
                  const filterInstance: WsExceptionFilter = resolve(FilterClass, context);
                  // The filter itself will handle sending the error message.
                  filterInstance.catch(error, host);
                  return; // Stop further processing
                }
              }
            }

            // Fallback to the base WebSocket exception filter
            this.baseWsExceptionFilter.catch(error, host);
          }
        },
        close: async (ws, code, reason) => {
          for (const instance of this.gatewayInstances) {
            if (typeof (instance as OnGatewayDisconnect).handleDisconnect === 'function') {
              await (instance as OnGatewayDisconnect).handleDisconnect(ws);
            }
          }
        },
      },
      error: (e: Error) =>
        new Response('Server error', { status: HttpStatus.INTERNAL_SERVER_ERROR }),
    });

    for (const instance of this.gatewayInstances) {
      const serverPropKey = Reflect.getMetadata(WEBSOCKET_SERVER_METADATA, instance.constructor);
      if (serverPropKey) {
        instance[serverPropKey] = server;
      }
      if (typeof (instance as OnGatewayInit).afterInit === 'function') {
        (instance as OnGatewayInit).afterInit(server);
      }
    }

    console.log(`🌊 App is running on http://localhost:${port}`);

    return server;
  }
}
