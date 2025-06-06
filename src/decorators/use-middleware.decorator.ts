import type { Middleware } from '../interfaces/middleware.interface';

export const MIDDLEWARE_METADATA_KEY = 'custom:middleware';

export function UseMiddleware(
  ...middlewares: (new (...args: any[]) => Middleware)[]
): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol) => {
    const metaTarget = propertyKey ? target : target;
    const existingMiddlewares =
      Reflect.getOwnMetadata(MIDDLEWARE_METADATA_KEY, metaTarget, propertyKey!) || [];
    Reflect.defineMetadata(
      MIDDLEWARE_METADATA_KEY,
      [...existingMiddlewares, ...middlewares],
      metaTarget,
      propertyKey!
    );
  };
}
