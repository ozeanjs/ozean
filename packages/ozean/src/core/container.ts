import type {
  ClassProvider,
  FactoryProvider,
  Provider,
  ProviderToken,
  TypeProvider,
  ValueProvider,
} from 'interfaces/provider.interface';
import type { IModuleRef } from '../interfaces/module-ref.interface';
import { INJECT_METADATA_KEY } from 'decorators/injectable';

const SINGLETONS = new Map<ProviderToken, any>();

export interface ResolutionContext {
  requestingModuleRef: IModuleRef;
  globalModuleRefs: Set<IModuleRef>;
}

export interface ResolveOptions {
  bypassAccessibilityCheck?: boolean;
}

function isClassProvider(p: Provider): p is ClassProvider {
  return !!(p as ClassProvider).useClass;
}
function isValueProvider(p: Provider): p is ValueProvider {
  return (p as ValueProvider).useValue !== undefined;
}
function isFactoryProvider(p: Provider): p is FactoryProvider {
  return !!(p as FactoryProvider).useFactory;
}

export function resolve<T>(
  Token: ProviderToken,
  context: ResolutionContext,
  options: ResolveOptions = {}
): T {
  const provider = !options.bypassAccessibilityCheck
    ? context.requestingModuleRef.findProvider(Token)
    : (Token as TypeProvider);
  if (!provider)
    throw new Error(
      `[DI] Provider with token "${String(Token)}" not found in the scope of module "${context.requestingModuleRef.token.name}".`
    );
  if (isValueProvider(provider)) return provider.useValue as T;

  const scope = Reflect.getMetadata('custom:scope', provider) || 'singleton';

  if (scope === 'singleton' && SINGLETONS.has(Token)) {
    return SINGLETONS.get(Token);
  }

  let instance: T;
  try {
    if (isFactoryProvider(provider)) {
      const deps = (provider.inject || []).map((depToken) => resolve(depToken, context));
      instance = provider.useFactory(...deps);
    } else {
      const concreteType = isClassProvider(provider)
        ? provider.useClass
        : (provider as TypeProvider);
      const paramTypes: ProviderToken[] =
        Reflect.getMetadata('design:paramtypes', concreteType) || [];
      const injectedTokens: (ProviderToken | undefined)[] =
        Reflect.getMetadata(INJECT_METADATA_KEY, concreteType) || [];

      const constructorParamLength = concreteType.length;
      const deps = Array.from({ length: constructorParamLength }).map((_, index) => {
        // Prioritize the token from @Inject() decorator
        const tokenToResolve = injectedTokens[index] || paramTypes[index];
        if (!tokenToResolve) {
          throw new Error(
            `[DI] Cannot resolve dependency at index ${index} for ${concreteType.name}. Ensure it's a class or use @Inject() for non-class tokens.`
          );
        }
        return resolve(tokenToResolve, context);
      });

      instance = new concreteType(...deps);
    }
  } catch (e: any) {
    const requestingModuleName = context.requestingModuleRef.token.name;
    const errorMessage = `[DI Error in ${requestingModuleName}] Failed to instantiate ${String(Token)}: ${e.message}`;
    throw new Error(errorMessage);
  }

  const providerClass = (provider as ClassProvider).useClass || provider;
  const scopeProviderClass = Reflect.getMetadata('custom:scope', providerClass) || 'singleton';
  if (scopeProviderClass === 'singleton') SINGLETONS.set(Token, instance);
  return instance;
}

export function createResolutionContext(
  moduleRef: IModuleRef,
  globalModuleRefs: Set<IModuleRef>
): ResolutionContext {
  return {
    requestingModuleRef: moduleRef,
    globalModuleRefs: globalModuleRefs,
  };
}

export function _test_clearSingletons(): void {
  SINGLETONS.clear();
}
