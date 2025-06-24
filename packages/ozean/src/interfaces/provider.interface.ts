export type ProviderToken = string | symbol | Function;

export interface TypeProvider extends Function {
  new (...args: any[]): any;
}

export interface ClassProvider {
  provide: ProviderToken;
  useClass: TypeProvider;
}

export interface ValueProvider {
  provide: ProviderToken;
  useValue: any;
}

export interface FactoryProvider {
  provide: ProviderToken;
  useFactory: (...args: any[]) => any;
  inject?: ProviderToken[];
}

export type Provider = TypeProvider | ClassProvider | ValueProvider | FactoryProvider;
