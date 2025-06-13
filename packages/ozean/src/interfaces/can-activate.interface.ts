export interface ExecutionContext {
  getClass<T = any>(): new (...args: any[]) => T;
  getHandler(): Function;
  getRequest<T = any>(): T;
}

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
