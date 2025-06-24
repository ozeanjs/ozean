import type { IModuleRef } from 'interfaces/module-ref.interface';
import type { DynamicModule, ModuleMetadata } from 'interfaces/module.interface';
import type { Provider, ProviderToken, TypeProvider } from 'interfaces/provider.interface';

export class ModuleRef implements IModuleRef {
  public readonly token: Function;
  public readonly metadata: ModuleMetadata;
  public readonly isGlobal: boolean;
  public readonly imports = new Set<IModuleRef>();
  public readonly providers = new Map<ProviderToken, Provider>();
  public readonly exports = new Set<ProviderToken>();
  public readonly controllers: Function[] = [];

  constructor(
    moduleDefinition: Function | DynamicModule,
    private readonly globalProviders: Map<ProviderToken, Provider>
  ) {
    const isDynamic = !!(moduleDefinition as DynamicModule).module;
    this.token = isDynamic
      ? (moduleDefinition as DynamicModule).module
      : (moduleDefinition as Function);
    const metadataFromDecorator = Reflect.getMetadata('custom:module', this.token);
    this.metadata = isDynamic ? (moduleDefinition as DynamicModule) : metadataFromDecorator;

    if (!this.metadata) {
      throw new Error(`Module ${this.token.name} is missing @Module() decorator or metadata.`);
    }

    this.isGlobal = !!this.metadata.global;
    this.controllers = this.metadata.controllers || [];

    (this.metadata.providers || []).forEach((p) => this.addProvider(p as Provider));
    this.controllers.forEach((c) => this.addProvider(c as Provider));
    (this.metadata.exports || []).forEach((e) => this.exports.add(e));
  }

  private isTypeProvider(p: Provider): p is TypeProvider {
    return typeof p === 'function';
  }

  private getProviderToken(p: Provider): ProviderToken {
    return this.isTypeProvider(p) ? p : p.provide;
  }

  public addProvider(provider: Provider) {
    this.providers.set(this.getProviderToken(provider), provider);
  }

  addImport(importedModuleRef: IModuleRef): void {
    this.imports.add(importedModuleRef);
  }

  public findProvider(token: ProviderToken): Provider | undefined {
    if (this.providers.has(token)) return this.providers.get(token);
    for (const importedModule of this.imports) {
      if (importedModule.exports.has(token)) {
        const provider = importedModule.findProvider(token);
        if (provider) return provider;
      }
    }
    if (this.globalProviders.has(token)) return this.globalProviders.get(token);
    return undefined;
  }

  isProviderExported(providerToken: Function): boolean {
    return this.exports.has(providerToken);
  }

  hasProvider(providerToken: Function): boolean {
    return this.providers.has(providerToken);
  }
}
