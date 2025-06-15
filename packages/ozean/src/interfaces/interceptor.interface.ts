import type { ExecutionContext } from './can-activate.interface';

/**
 * Represents the next handler in the interceptor chain.
 */
export interface CallHandler {
  handle(): Promise<any>;
}

/**
 * Interface for interceptors, which can intercept and modify requests/responses.
 */
export interface Interceptor {
  intercept(context: ExecutionContext, next: CallHandler): Promise<any>;
}
