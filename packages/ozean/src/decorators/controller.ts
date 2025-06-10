import { getMetadataArgsStorage } from '../metadata/storage';

export function Controller(path: string): ClassDecorator {
  return (target) => {
    getMetadataArgsStorage().controllers[target as any] = { path };
  };
}
