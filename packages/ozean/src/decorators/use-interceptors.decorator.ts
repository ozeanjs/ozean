import type { Interceptor } from '../interfaces/interceptor.interface';

export const INTERCEPTORS_METADATA_KEY = 'custom:interceptors';

export function UseInterceptors(
  ...interceptors: (Function | (new (...args: any[]) => Interceptor))[]
): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol) => {
    const metaTarget = propertyKey ? target : target;
    Reflect.defineMetadata(INTERCEPTORS_METADATA_KEY, interceptors, metaTarget, propertyKey!);
  };
}
