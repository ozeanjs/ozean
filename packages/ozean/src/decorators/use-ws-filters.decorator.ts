import type { WsExceptionFilter } from '../interfaces/ws-exception-filter.interface';
export const WS_FILTERS_METADATA_KEY = 'custom:ws_filters';

export function UseWsFilters(
  ...filters: (new (...args: any[]) => WsExceptionFilter)[]
): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol) => {
    const metaTarget = propertyKey ? target : target;
    Reflect.defineMetadata(WS_FILTERS_METADATA_KEY, filters, metaTarget, propertyKey!);
  };
}
