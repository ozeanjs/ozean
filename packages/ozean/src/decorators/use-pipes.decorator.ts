import type { PipeTransform } from '../interfaces/pipe.interface';

export const PIPES_METADATA_KEY = 'custom:pipes';

export function UsePipes(...pipes: (new (...args: any[]) => PipeTransform)[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existingPipes = Reflect.getOwnMetadata(PIPES_METADATA_KEY, target, propertyKey) || [];
    Reflect.defineMetadata(PIPES_METADATA_KEY, [...existingPipes, ...pipes], target, propertyKey);
  };
}
