import { IModuleRef, ModuleMetadata } from 'interfaces/module-ref.interface';

export class ModuleRef implements IModuleRef {
  public readonly metadata: ModuleMetadata;
  public readonly imports = new Set<IModuleRef>();
  public readonly providers = new Map<
    Function,
    { token: Function; scope: 'singleton' | 'transient' }
  >();
  public readonly exports = new Set<Function>();

  constructor(public readonly token: Function) {
    const meta = Reflect.getMetadata('custom:module', this.token) as ModuleMetadata | undefined;
    if (!meta) {
      throw new Error(`Module ${this.token.name} is missing @Module() decorator or metadata.`);
    }
    this.metadata = meta;

    if (meta.providers) {
      for (const providerToken of meta.providers) {
        if (typeof providerToken === 'function') {
          const scope = Reflect.getMetadata('custom:scope', providerToken) || 'singleton';
          this.providers.set(providerToken, { token: providerToken, scope });
        }
      }
    }

    if (meta.exports) {
      for (const exportedToken of meta.exports) {
        if (typeof exportedToken === 'function' && this.providers.has(exportedToken)) {
          this.exports.add(exportedToken);
        } else if (typeof exportedToken === 'function') {
          console.warn(
            `Module ${this.token.name} attempts to export '${exportedToken.name}' which is not in its 'providers' list. Re-exporting from imported modules is not supported.`
          );
        }
      }
    }
  }

  addImport(importedModuleRef: IModuleRef): void {
    this.imports.add(importedModuleRef);
  }

  isProviderExported(providerToken: Function): boolean {
    return this.exports.has(providerToken);
  }

  hasProvider(providerToken: Function): boolean {
    return this.providers.has(providerToken);
  }
}
