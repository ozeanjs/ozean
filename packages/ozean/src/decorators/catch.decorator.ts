export const CATCH_METADATA_KEY = 'custom:catch_exceptions';

export function Catch(...exceptions: (new (...args: any[]) => any)[]): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(CATCH_METADATA_KEY, exceptions, target);
  };
}
