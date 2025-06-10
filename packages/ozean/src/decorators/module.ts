import type { ModuleMetadata } from '../interfaces/module-ref.interface';

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('custom:module', metadata, target);
  };
}
