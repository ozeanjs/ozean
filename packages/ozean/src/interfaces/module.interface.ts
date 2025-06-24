import type { Provider, ProviderToken } from './provider.interface';

export interface ModuleMetadata {
  imports?: (Function | DynamicModule)[];
  controllers?: Function[];
  providers?: Provider[];
  exports?: ProviderToken[];
  global?: boolean;
}

export interface DynamicModule extends ModuleMetadata {
  module: Function;
}
