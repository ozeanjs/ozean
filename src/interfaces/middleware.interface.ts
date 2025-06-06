export interface NextFunction {
  (): Promise<Response>;
}

export interface Middleware {
  use(req: Request, next: NextFunction): Promise<Response>;
}
