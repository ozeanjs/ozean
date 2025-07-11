export const WS_PARAM_METADATA = 'custom:ws_param';
function createWsParamDecorator(type: 'socket' | 'body'): ParameterDecorator {
  return (target: Object, propertyKey, parameterIndex) => {
    const existingParams = Reflect.getMetadata(WS_PARAM_METADATA, target, propertyKey!) || [];
    existingParams[parameterIndex] = { type };
    Reflect.defineMetadata(WS_PARAM_METADATA, existingParams, target, propertyKey!);
  };
}

export const ConnectedSocket = () => createWsParamDecorator('socket');

export const MessageBody = () => createWsParamDecorator('body');
