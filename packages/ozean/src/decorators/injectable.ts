import type { ProviderToken } from '../interfaces/provider.interface';
export const INJECT_METADATA_KEY = 'custom:inject_token';

export function Injectable(options?: { scope?: 'singleton' | 'transient' }): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('custom:scope', options?.scope || 'singleton', target);
  };
}

export function Inject(token: ProviderToken): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjects = Reflect.getOwnMetadata(INJECT_METADATA_KEY, target, propertyKey!) || [];
    existingInjects[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjects, target, propertyKey!);
  };
}
