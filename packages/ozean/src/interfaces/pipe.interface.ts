export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param';
  metatype?: new (...args: any[]) => any;
  data?: string;
}

export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}
