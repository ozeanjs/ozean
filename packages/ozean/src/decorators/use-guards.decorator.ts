import type { CanActivate } from '../interfaces/can-activate.interface';

export const GUARDS_METADATA_KEY = 'custom:guards';

export function UseGuards(
  ...guards: (new (...args: any[]) => CanActivate)[]
): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol) => {
    const metaTarget = propertyKey ? target : target;
    Reflect.defineMetadata(GUARDS_METADATA_KEY, guards, metaTarget, propertyKey!);
  };
}
