import type { ModuleMetadata } from '../interfaces/module.interface';

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('custom:module', metadata, target);
  };
}
