export const MESSAGE_MAPPING_METADATA = 'custom:ws_message_mapping';

export function SubscribeMessage(event: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(MESSAGE_MAPPING_METADATA, { event }, descriptor.value);
  };
}
