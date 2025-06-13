// test/decorators/use-guards.decorator.test.ts

import { describe, test, expect, afterEach } from 'bun:test';
import 'reflect-metadata'; // Required for decorator tests
import { UseGuards, GUARDS_METADATA_KEY } from '../../src/decorators/use-guards.decorator';
import type { CanActivate } from '../../src/interfaces/can-activate.interface';

// --- Helper Classes for Testing ---

// Dummy CanActivate classes to use as guards in tests
class GuardA implements CanActivate {
  canActivate(context: any): boolean {
    return true;
  }
}
class GuardB implements CanActivate {
  canActivate(context: any): boolean {
    return true;
  }
}

describe('@UseGuards() Decorator', () => {
  afterEach(() => {
    // Clean up metadata from test classes after each test to ensure isolation
    const classWithDeco = class {};
    const classWithMethodDeco = class {
      method() {}
    };
    Reflect.deleteMetadata(GUARDS_METADATA_KEY, classWithDeco);
    Reflect.deleteMetadata(GUARDS_METADATA_KEY, classWithMethodDeco);
    Reflect.deleteMetadata(GUARDS_METADATA_KEY, classWithMethodDeco.prototype, 'method');
  });

  // Test Case 1: Applying to a class
  describe('when used as a class decorator', () => {
    test('should attach a single guard to the class constructor', () => {
      @UseGuards(GuardA)
      class TestController {}

      const guards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController);

      expect(guards).toBeInstanceOf(Array);
      expect(guards).toHaveLength(1);
      expect(guards).toEqual([GuardA]);
    });

    test('should attach multiple guards to the class constructor', () => {
      @UseGuards(GuardA, GuardB)
      class TestController {}

      const guards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController);

      expect(guards).toBeInstanceOf(Array);
      expect(guards).toHaveLength(2);
      expect(guards).toEqual([GuardA, GuardB]);
    });
  });

  // Test Case 2: Applying to a method
  describe('when used as a method decorator', () => {
    test('should attach a single guard to the method', () => {
      class TestController {
        @UseGuards(GuardA)
        public get() {}
      }

      const guards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController.prototype, 'get');

      expect(guards).toBeInstanceOf(Array);
      expect(guards).toHaveLength(1);
      expect(guards).toEqual([GuardA]);
    });

    test('should attach multiple guards to the method', () => {
      class TestController {
        @UseGuards(GuardA, GuardB)
        public get() {}
      }

      const guards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController.prototype, 'get');

      expect(guards).toBeInstanceOf(Array);
      expect(guards).toHaveLength(2);
      expect(guards).toEqual([GuardA, GuardB]);
    });
  });

  // Test Case 3: Applying to both class and method
  test('should attach guards to both class and method without interference', () => {
    @UseGuards(GuardA)
    class TestController {
      @UseGuards(GuardB)
      public get() {}
    }

    const classGuards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController);
    const methodGuards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController.prototype, 'get');

    expect(classGuards).toEqual([GuardA]);
    expect(methodGuards).toEqual([GuardB]);
  });

  // Test Case 4: No decorator used
  test('should not have metadata if the decorator is not used', () => {
    class TestController {
      public get() {}
    }

    const classGuards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController);
    const methodGuards = Reflect.getMetadata(GUARDS_METADATA_KEY, TestController.prototype, 'get');

    expect(classGuards).toBeUndefined();
    expect(methodGuards).toBeUndefined();
  });
});
