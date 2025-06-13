import { Injectable } from '../decorators/injectable';

type DecoratorFactory<T> = (data: T) => MethodDecorator & ClassDecorator;

export interface DecoratorFactoryWithKey<T> extends DecoratorFactory<T> {
  KEY: symbol;
}

@Injectable()
export class Reflector {
  public get<TResult = any, TKey = any>(
    metadataKeyOrDecorator: string | symbol | DecoratorFactoryWithKey<TKey>,
    target: Function
  ): TResult | undefined {
    if (!metadataKeyOrDecorator) {
      throw new Error(
        'Reflector.get received an undefined key or decorator factory. This is often caused by a circular dependency. Check your imports.'
      );
    }

    const metadataKey =
      typeof metadataKeyOrDecorator === 'function'
        ? (metadataKeyOrDecorator as DecoratorFactoryWithKey<TKey>).KEY
        : metadataKeyOrDecorator;

    if (!metadataKey) {
      throw new Error(
        `Could not extract metadata KEY from decorator factory. Ensure you are using a decorator created with Reflector.createDecorator().`
      );
    }

    return Reflect.getMetadata(metadataKey, target);
  }

  public static createDecorator<TData = any>(): DecoratorFactoryWithKey<TData> {
    const METADATA_KEY = Symbol('OZEAN_DECORATOR_KEY');

    const decoratorFactory: any = (data: TData) => {
      return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
        const decoratorTarget = descriptor ? descriptor.value : target;
        Reflect.defineMetadata(METADATA_KEY, data, decoratorTarget);
      };
    };

    Object.defineProperty(decoratorFactory, 'KEY', {
      value: METADATA_KEY,
      configurable: false,
      writable: false,
      enumerable: false,
    });

    return decoratorFactory as DecoratorFactoryWithKey<TData>;
  }
}
