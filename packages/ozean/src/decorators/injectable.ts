export function Injectable(options?: { scope?: 'singleton' | 'transient' }): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('custom:scope', options?.scope || 'singleton', target);
  };
}
