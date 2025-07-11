import type { ArgumentsHost } from './exception-filter.interface';

export interface WsExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): void;
}
