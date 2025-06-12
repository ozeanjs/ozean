import { describe, test, expect, afterEach } from 'bun:test';
import 'reflect-metadata'; // Required for decorator tests
import { UseFilters, FILTERS_METADATA_KEY } from '../../src/decorators/use-filters.decorator';
import type { ExceptionFilter } from '../../src/interfaces/exception-filter.interface';

// --- Helper Classes for Testing ---

// Dummy ExceptionFilter classes to use in tests
class FilterA implements ExceptionFilter {
  catch(exception: any, host: any) {
    return new Response();
  }
}
class FilterB implements ExceptionFilter {
  catch(exception: any, host: any) {
    return new Response();
  }
}

describe('@UseFilters() Decorator', () => {
  afterEach(() => {
    // Clean up metadata from test classes after each test to ensure isolation
    const classWithDeco = class {};
    const classWithMethodDeco = class {
      method() {}
    };
    Reflect.deleteMetadata(FILTERS_METADATA_KEY, classWithDeco);
    Reflect.deleteMetadata(FILTERS_METADATA_KEY, classWithMethodDeco);
    Reflect.deleteMetadata(FILTERS_METADATA_KEY, classWithMethodDeco.prototype, 'method');
  });

  // Test Case 1: Applying to a class
  describe('when used as a class decorator', () => {
    test('should attach a single filter to the class constructor', () => {
      @UseFilters(FilterA)
      class TestController {}

      const filters = Reflect.getMetadata(FILTERS_METADATA_KEY, TestController);

      expect(filters).toBeInstanceOf(Array);
      expect(filters).toHaveLength(1);
      expect(filters).toEqual([FilterA]);
    });

    test('should attach multiple filters to the class constructor', () => {
      @UseFilters(FilterA, FilterB)
      class TestController {}

      const filters = Reflect.getMetadata(FILTERS_METADATA_KEY, TestController);

      expect(filters).toBeInstanceOf(Array);
      expect(filters).toHaveLength(2);
      expect(filters).toEqual([FilterA, FilterB]);
    });
  });

  // Test Case 2: Applying to a method
  describe('when used as a method decorator', () => {
    test('should attach a single filter to the method', () => {
      class TestController {
        @UseFilters(FilterA)
        public get() {}
      }

      const filters = Reflect.getMetadata(FILTERS_METADATA_KEY, TestController.prototype, 'get');

      expect(filters).toBeInstanceOf(Array);
      expect(filters).toHaveLength(1);
      expect(filters).toEqual([FilterA]);
    });

    test('should attach multiple filters to the method', () => {
      class TestController {
        @UseFilters(FilterA, FilterB)
        public get() {}
      }

      const filters = Reflect.getMetadata(FILTERS_METADATA_KEY, TestController.prototype, 'get');

      expect(filters).toBeInstanceOf(Array);
      expect(filters).toHaveLength(2);
      expect(filters).toEqual([FilterA, FilterB]);
    });
  });

  // Test Case 3: Applying to both class and method
  test('should attach filters to both class and method without interference', () => {
    @UseFilters(FilterA)
    class TestController {
      @UseFilters(FilterB)
      public get() {}
    }

    const classFilters = Reflect.getMetadata(FILTERS_METADATA_KEY, TestController);
    const methodFilters = Reflect.getMetadata(
      FILTERS_METADATA_KEY,
      TestController.prototype,
      'get'
    );

    expect(classFilters).toEqual([FilterA]);
    expect(methodFilters).toEqual([FilterB]);
  });

  // Test Case 4: No decorator used
  test('should not have metadata if the decorator is not used', () => {
    class TestController {
      public get() {}
    }

    const classFilters = Reflect.getMetadata(FILTERS_METADATA_KEY, TestController);
    const methodFilters = Reflect.getMetadata(
      FILTERS_METADATA_KEY,
      TestController.prototype,
      'get'
    );

    expect(classFilters).toBeUndefined();
    expect(methodFilters).toBeUndefined();
  });
});
