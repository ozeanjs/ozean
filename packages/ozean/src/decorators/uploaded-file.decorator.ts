export function UploadedFile(): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (typeof propertyKey === 'undefined') {
      throw new Error(`@UploadedFile() can only be used on method parameters.`);
    }
    const existingParams = Reflect.getMetadata('custom:param', target, propertyKey) || [];
    existingParams[parameterIndex] = { type: 'file' }; // Special type for our argument resolver
    Reflect.defineMetadata('custom:param', existingParams, target, propertyKey);
  };
}
