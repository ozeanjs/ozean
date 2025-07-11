export const GATEWAY_METADATA = 'custom:gateway';

export function WebSocketGateway(options?: any): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(GATEWAY_METADATA, options || {}, target);
  };
}
