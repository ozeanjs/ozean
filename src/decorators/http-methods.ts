import { getMetadataArgsStorage } from '../metadata/storage';

function createHttpMethodDecorator(method: string): (path?: string) => MethodDecorator {
  return (path: string = ''): MethodDecorator =>
    (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void => {
      getMetadataArgsStorage().routes.push({
        target: target.constructor,
        handlerName: propertyKey as string,
        method: method.toUpperCase(),
        path,
      });
    };
}
export const Get = createHttpMethodDecorator('GET');
export const Post = createHttpMethodDecorator('POST');
export const Put = createHttpMethodDecorator('PUT');
export const Delete = createHttpMethodDecorator('DELETE');
export const Patch = createHttpMethodDecorator('PATCH');
