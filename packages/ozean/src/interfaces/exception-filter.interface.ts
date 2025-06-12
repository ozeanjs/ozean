export interface ArgumentsHost {
  getRequest<T = any>(): T;
}

export interface ExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): Response | Promise<Response>;
}
