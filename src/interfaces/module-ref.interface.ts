export interface ModuleMetadata {
  imports?: Function[];
  controllers?: Function[];
  providers?: Function[];
  exports?: Function[];
  global?: boolean;
}

export interface IModuleRef {
  readonly token: Function;
  readonly isGlobal: boolean;
  readonly metadata: ModuleMetadata;
  readonly imports: Set<IModuleRef>;
  readonly providers: Map<Function, { token: Function; scope: 'singleton' | 'transient' }>;
  readonly exports: Set<Function>;

  isProviderExported(providerToken: Function): boolean;
  hasProvider(providerToken: Function): boolean;
}
