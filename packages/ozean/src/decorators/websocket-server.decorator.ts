export const WEBSOCKET_SERVER_METADATA = 'custom:ws_server';

export function WebSocketServer(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(WEBSOCKET_SERVER_METADATA, propertyKey, target.constructor);
  };
}
