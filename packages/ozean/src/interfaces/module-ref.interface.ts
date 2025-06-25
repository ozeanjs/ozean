import type { ModuleMetadata } from './module.interface';
import type { Provider, ProviderToken } from './provider.interface';

export interface IModuleRef {
  readonly token: Function;
  readonly metadata: ModuleMetadata;
  readonly imports: Set<IModuleRef>;
  readonly providers: Map<ProviderToken, Provider>;
  readonly controllers: Function[];
  readonly exports: Set<ProviderToken>;
  readonly isGlobal: boolean;
  addImport(moduleRef: IModuleRef): void;
  addProvider(provider: Provider): void;
  findProvider(token: ProviderToken): Provider | undefined;
  isProviderExported(providerToken: Function): boolean;
  hasProvider(providerToken: Function): boolean;
}
