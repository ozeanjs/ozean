export interface RouteMetadataArgs {
  target: Function;
  handlerName: string;
  method: string;
  path: string;
}

export interface ControllerMeta {
  path: string;
}

export interface MetadataStorage {
  routes: RouteMetadataArgs[];
  controllers: Record<string, ControllerMeta>;
}

export function getMetadataArgsStorage(): MetadataStorage {
  const globalScope = globalThis as any;
  if (!globalScope.__metadataStorage) {
    globalScope.__metadataStorage = { routes: [], controllers: {} };
  }
  return globalScope.__metadataStorage;
}
