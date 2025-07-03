function createParameterDecorator(
  type: 'req' | 'query' | 'param' | 'body',
  key?: string
): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (typeof propertyKey === 'undefined') {
      throw new Error(
        `@${type.charAt(0).toUpperCase() + type.slice(1)}() decorator can only be used on method parameters.`
      );
    }
    const existingParams = Reflect.getMetadata('custom:param', target, propertyKey) || [];
    existingParams[parameterIndex] = { type, key };
    Reflect.defineMetadata('custom:param', existingParams, target, propertyKey);
  };
}
export const Req = () => createParameterDecorator('req');
export const Query = (key: string) => createParameterDecorator('query', key);
export const Param = (key: string) => createParameterDecorator('param', key);
export const Body = (key?: string) => createParameterDecorator('body', key);
