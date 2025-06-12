import { describe, test, expect, afterEach } from 'bun:test';
import 'reflect-metadata'; // Required for decorator tests
import { Catch, CATCH_METADATA_KEY } from '../../src/decorators/catch.decorator';

// --- Helper Classes for Testing ---
class CustomErrorA extends Error {}
class CustomErrorB extends Error {}

describe('@Catch() Decorator', () => {
  afterEach(() => {
    // Clean up metadata from test classes after each test
    Reflect.deleteMetadata(CATCH_METADATA_KEY, class {});
    Reflect.deleteMetadata(CATCH_METADATA_KEY, class {});
    Reflect.deleteMetadata(CATCH_METADATA_KEY, class {});
  });

  test('should set metadata with an empty array when no arguments are provided', () => {
    // Create a dummy class and apply the decorator
    @Catch()
    class TestFilter {}

    // Retrieve the metadata
    const caughtExceptions = Reflect.getMetadata(CATCH_METADATA_KEY, TestFilter);

    // Assert that the metadata is an empty array
    expect(caughtExceptions).toBeInstanceOf(Array);
    expect(caughtExceptions).toHaveLength(0);
  });

  test('should set metadata with a single exception type', () => {
    @Catch(CustomErrorA)
    class TestFilter {}

    const caughtExceptions = Reflect.getMetadata(CATCH_METADATA_KEY, TestFilter);

    // Assert that the metadata contains only CustomErrorA
    expect(caughtExceptions).toEqual([CustomErrorA]);
  });

  test('should set metadata with multiple exception types', () => {
    @Catch(CustomErrorA, CustomErrorB)
    class TestFilter {}

    const caughtExceptions = Reflect.getMetadata(CATCH_METADATA_KEY, TestFilter);

    // Assert that the metadata contains both CustomErrorA and CustomErrorB
    expect(caughtExceptions).toBeInstanceOf(Array);
    expect(caughtExceptions).toHaveLength(2);
    expect(caughtExceptions).toContain(CustomErrorA);
    expect(caughtExceptions).toContain(CustomErrorB);
  });

  test('should not have metadata if the decorator is not used', () => {
    class UnuseDecoratedFilter {}

    const caughtExceptions = Reflect.getMetadata(CATCH_METADATA_KEY, UnuseDecoratedFilter);

    // Assert that the metadata is undefined
    expect(caughtExceptions).toBeUndefined();
  });
});
