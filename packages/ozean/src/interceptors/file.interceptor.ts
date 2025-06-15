import { Injectable } from '../decorators/injectable';
import { type Interceptor, type CallHandler } from '../interfaces/interceptor.interface';
import { BadRequestException } from '../exceptions/http-exception';
import type { ExecutionContext } from 'interfaces/can-activate.interface';

// This is a Factory Function that creates our Interceptor class
export function FileInterceptor(fieldName: string): new (...args: any[]) => Interceptor {
  // We create a new class inside the factory
  @Injectable()
  class MixinInterceptor implements Interceptor {
    constructor() {} // The mixin can have its own dependencies injected here

    async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
      const req = context.getRequest<Request>();

      const contentType = req.headers.get('content-type');
      if (!contentType || !contentType.includes('multipart/form-data')) {
        // Not a file upload request, so we just continue to the next handler
        return next.handle();
      }

      try {
        const formData = await req.formData();
        // Use the fieldName provided by the factory function
        const file = formData.get(fieldName);

        // Attach the file to the request object so the @UploadedFile() decorator can access it
        if (file instanceof File) {
          (req as any).file = file;
        }

        return next.handle();
      } catch (e) {
        throw new BadRequestException('Failed to parse multipart/form-data');
      }
    }
  }

  // Return the constructor of the class we just created
  return MixinInterceptor;
}
