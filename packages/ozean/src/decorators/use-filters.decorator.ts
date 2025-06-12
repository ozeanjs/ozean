import type { ExceptionFilter as EF } from '../interfaces/exception-filter.interface';

export const FILTERS_METADATA_KEY = 'custom:filters';

export function UseFilters(
  ...filters: (new (...args: any[]) => EF)[]
): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol) => {
    const metaTarget = propertyKey ? target : target;
    Reflect.defineMetadata(FILTERS_METADATA_KEY, filters, metaTarget, propertyKey!);
  };
}
