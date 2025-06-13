import { describe, test, expect, beforeEach } from 'bun:test';
import 'reflect-metadata'; // Required for decorator tests
import { Reflector } from '../../src/core/reflector.service';
import type { DecoratorFactoryWithKey } from '../../src/core/reflector.service';

describe('Reflector Service', () => {
  let reflector: Reflector;

  beforeEach(() => {
    // Create a new instance of the Reflector service before each test
    reflector = new Reflector();
  });

  // Test suite for the static createDecorator method
  describe('Reflector.createDecorator()', () => {
    test('should return a function (the decorator factory)', () => {
      const MyDecorator = Reflector.createDecorator();
      expect(MyDecorator).toBeInstanceOf(Function);
    });

    test('the returned factory should return another function (the actual decorator)', () => {
      const MyDecorator = Reflector.createDecorator();
      const actualDecorator = MyDecorator({ some: 'data' });
      expect(actualDecorator).toBeInstanceOf(Function);
    });

    test('the decorator should attach metadata to a class', () => {
      const Roles = Reflector.createDecorator<string[]>();
      const rolesData = ['admin', 'user'];

      @Roles(rolesData)
      class TestClass {}

      const metadata = Reflect.getMetadata(Roles.KEY, TestClass);
      expect(metadata).toEqual(rolesData);
    });

    test('the decorator should attach metadata to a method', () => {
      const Roles = Reflector.createDecorator<string[]>();
      const rolesData = ['guest'];

      class TestClass {
        @Roles(rolesData)
        public get() {}
      }

      const metadata = Reflect.getMetadata(Roles.KEY, TestClass.prototype.get);
      expect(metadata).toEqual(rolesData);
    });

    test('should create a unique KEY symbol for each decorator', () => {
      const DecoratorA = Reflector.createDecorator();
      const DecoratorB = Reflector.createDecorator();

      expect(DecoratorA.KEY).not.toBeUndefined();
      expect(DecoratorB.KEY).not.toBeUndefined();
      expect(typeof DecoratorA.KEY).toBe('symbol');
      expect(DecoratorA.KEY).not.toBe(DecoratorB.KEY);
    });
  });

  // Test suite for the instance `get` method
  describe('reflector.get()', () => {
    const Roles = Reflector.createDecorator<string[]>();
    const Permissions = Reflector.createDecorator<string[]>();
    const METADATA_STRING_KEY = 'my-string-key';

    @Roles(['admin'])
    class TestController {
      @Permissions(['read', 'write'])
      get() {}
    }

    test('should retrieve metadata using a decorator factory key', () => {
      const roles = reflector.get<string[]>(Roles, TestController);
      const permissions = reflector.get<string[]>(Permissions, TestController.prototype.get);

      expect(roles).toEqual(['admin']);
      expect(permissions).toEqual(['read', 'write']);
    });

    test('should retrieve metadata using a string or symbol key', () => {
      Reflect.defineMetadata(METADATA_STRING_KEY, 'some-value', TestController);

      const metadata = reflector.get<string>(METADATA_STRING_KEY, TestController);
      expect(metadata).toBe('some-value');
    });

    test('should return undefined if no metadata is found', () => {
      const NoDataDecorator = Reflector.createDecorator();

      const metadata = reflector.get(NoDataDecorator, TestController);
      expect(metadata).toBeUndefined();
    });

    test('should throw a helpful error if the decorator factory is undefined', () => {
      const undefinedDecorator: any = undefined;
      // This simulates a circular dependency issue where the decorator is not yet initialized
      expect(() => reflector.get(undefinedDecorator, TestController)).toThrow(
        'Reflector.get received an undefined key or decorator factory. This is often caused by a circular dependency. Check your imports.'
      );
    });

    test('should throw an error if the decorator factory does not have a KEY', () => {
      const fakeDecoratorFactory: any = () => {}; // A function without the KEY property
      expect(() => reflector.get(fakeDecoratorFactory, TestController)).toThrow(
        'Could not extract metadata KEY from decorator factory. Ensure you are using a decorator created with Reflector.createDecorator().'
      );
    });
  });
});
