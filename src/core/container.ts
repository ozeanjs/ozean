import type { IModuleRef } from '../interfaces/module-ref.interface';

const SINGLETONS = new Map<Function, any>();

export interface ResolutionContext {
  requestingModuleRef: IModuleRef;
}

function canResolveProvider<T>(
  tokenToResolve: new (...args: any[]) => T,
  context: ResolutionContext
): boolean {
  const { requestingModuleRef } = context;

  if (requestingModuleRef.metadata.controllers?.includes(tokenToResolve)) {
    return true;
  }

  if (requestingModuleRef.hasProvider(tokenToResolve)) {
    return true;
  }

  for (const importedModuleRef of requestingModuleRef.imports) {
    if (
      importedModuleRef.hasProvider(tokenToResolve) &&
      importedModuleRef.isProviderExported(tokenToResolve)
    ) {
      return true;
    }
  }
  return false;
}

export function resolve<T>(Token: new (...args: any[]) => T, context: ResolutionContext): T {
  if (typeof Token !== 'function' || !Token.prototype) {
    const requestingModuleName = context.requestingModuleRef?.token?.name || 'UnknownModule';
    const errorMessage = `[DI Error in ${requestingModuleName}] Invalid token for resolution. Expected a constructor function.`;
    console.error(errorMessage, 'Received:', Token);
    throw new Error(errorMessage);
  }

  if (!canResolveProvider(Token, context)) {
    const requestingModuleName = context.requestingModuleRef.token.name;
    const tokenName = Token.name;
    const errorMessage = `[DI Error in ${requestingModuleName}] Provider, Controller, or Middleware '${tokenName}' is not accessible in the current module scope. Check if it's provided in the module, or if it's part of an imported module that exports it.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const scope = Reflect.getMetadata('custom:scope', Token) || 'singleton';

  if (scope === 'singleton' && SINGLETONS.has(Token)) {
    return SINGLETONS.get(Token);
  }

  const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', Token) || [];
  const deps = paramTypes.map((depToken, index) => {
    if (typeof depToken !== 'function' || !depToken.prototype) {
      const requestingModuleName = context.requestingModuleRef.token.name;
      const errorMessage = `[DI Error in ${requestingModuleName} for ${Token.name}] Cannot resolve dependency at index ${index}. Dependency is not a constructor: ${depToken?.name || depToken}`;
      console.warn(errorMessage, 'Received:', depToken);
      throw new Error(errorMessage);
    }
    return resolve(depToken as new (...args: any[]) => any, context);
  });

  let instance: T;
  try {
    instance = new Token(...deps);
  } catch (e: any) {
    const requestingModuleName = context.requestingModuleRef.token.name;
    const errorMessage = `[DI Error in ${requestingModuleName}] Failed to instantiate ${Token.name}: ${e.message}`;
    console.error(
      errorMessage,
      'with dependencies:',
      deps.map((d) => d?.constructor?.name || d)
    );
    throw new Error(errorMessage);
  }

  if (scope === 'singleton') {
    SINGLETONS.set(Token, instance);
  }
  return instance;
}

export function createResolutionContext(moduleRef: IModuleRef): ResolutionContext {
  return { requestingModuleRef: moduleRef };
}

export function _test_clearSingletons(): void {
  SINGLETONS.clear();
}
