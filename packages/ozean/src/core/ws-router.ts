import type { ServerWebSocket } from 'bun';
import { MESSAGE_MAPPING_METADATA } from '../decorators/subscribe-message.decorator';
import { WS_PARAM_METADATA } from '../decorators/websocket-params.decorator';

export class WsRouter {
  private readonly messageHandlers = new Map<string, { instance: any; handlerName: string }>();

  public registerGateway(gatewayInstance: any) {
    for (const propertyKey of Object.getOwnPropertyNames(gatewayInstance.constructor.prototype)) {
      const method = gatewayInstance.constructor.prototype[propertyKey];

      if (typeof method !== 'function') {
        continue;
      }

      const metadata = Reflect.getMetadata(MESSAGE_MAPPING_METADATA, method);
      if (metadata) {
        this.messageHandlers.set(metadata.event, {
          instance: gatewayInstance,
          handlerName: propertyKey,
        });
      }
    }
  }

  public route(event: string, ws: ServerWebSocket<any>, data: any) {
    const handlerInfo = this.messageHandlers.get(event);
    if (handlerInfo) {
      const { instance, handlerName } = handlerInfo;
      const handler = instance[handlerName];

      const paramsMetadata = Reflect.getMetadata(WS_PARAM_METADATA, instance, handlerName) || [];
      const args = new Array(paramsMetadata.length);

      for (let i = 0; i < args.length; i++) {
        const meta = paramsMetadata[i];
        if (meta.type === 'socket') args[i] = ws;
        if (meta.type === 'body') args[i] = data;
      }

      handler.apply(instance, args);
    } else {
      console.warn(`[WsRouter] No handler found for event: ${event}`);
    }
  }

  public findHandler(event: string): { instance: any; handlerName: string } | undefined {
    return this.messageHandlers.get(event);
  }
}
