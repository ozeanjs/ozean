import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'bun';
import 'reflect-metadata';

import {
  App,
  Module,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Injectable,
  UseGuards,
  type CanActivate,
  type ExecutionContext,
  Reflector,
  UsePipes,
  ValidationPipe,
  type PipeTransform,
  type ArgumentMetadata,
  UseFilters,
  type ExceptionFilter,
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  type Middleware,
  type NextFunction,
} from '../../src';

import { IsString, IsInt, Min, Max } from 'class-validator';

class CreateItemDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

class OrderNotFoundException extends HttpException {
  constructor(orderId: number) {
    super(`Order with ID ${orderId} was not found.`, HttpStatus.NOT_FOUND);
  }
}

@Catch(OrderNotFoundException)
@Injectable()
class OrderNotFoundFilter implements ExceptionFilter {
  catch(exception: OrderNotFoundException, host: ArgumentsHost) {
    return new Response(
      JSON.stringify({
        error: 'Custom Order Error',
        message: (exception as HttpException).message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: HttpStatus.NOT_FOUND,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

@Injectable()
class LoggerMiddleware implements Middleware {
  async use(req: Request, next: NextFunction) {
    return await next();
  }
}

declare global {
  namespace Express {
    interface Request {
      state: { user?: any };
    }
  }
}

@Injectable()
class AuthMiddleware implements Middleware {
  async use(req: Request, next: NextFunction) {
    const token = req.headers.get('x-auth-token');
    if (token === 'admin-token') {
      (req as any).state = { user: { id: 1, roles: ['admin'] } };
    } else if (token === 'user-token') {
      (req as any).state = { user: { id: 2, roles: ['user'] } };
    }
    return await next();
  }
}

export const Roles = Reflector.createDecorator<string[]>();

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.get<string[]>(Roles, context.getHandler());
    if (!requiredRoles) return true;
    const user = context.getRequest().state?.user;
    return requiredRoles.some((role: any) => user?.roles?.includes(role));
  }
}

@Injectable()
class AppService {
  getApp() {
    return 'Hello E2E World (App)!';
  }
  getHello() {
    return 'Hello E2E World!';
  }
  getItem(id: string) {
    return { id: parseInt(id), name: `Item ${id}` };
  }
  createItem(item: CreateItemDto) {
    return { id: 99, ...item };
  }
}

@Controller('/app')
@UseGuards(RolesGuard)
@UseFilters(OrderNotFoundFilter)
class TestAppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getApp() {
    return this.appService.getApp();
  }

  @Get('/hello')
  getHello() {
    return this.appService.getHello();
  }

  @Get('/item/:id')
  getItem(@Param('id') id: string) {
    return this.appService.getItem(id);
  }

  @Post('/item')
  @UsePipes(ValidationPipe)
  createItem(@Body() item: CreateItemDto) {
    return this.appService.createItem(item);
  }

  @Get('/admin')
  @Roles(['admin'])
  getAdminResource() {
    return { message: 'Admin Content' };
  }

  @Get('/user')
  @Roles(['user'])
  getUserResource() {
    return { message: 'User Content' };
  }

  @Get('/order/:id')
  getOrder(@Param('id') id: string) {
    throw new OrderNotFoundException(parseInt(id));
  }

  @Get('/generic-error')
  getError() {
    throw new Error('Generic server error');
  }
}

@Module({
  controllers: [TestAppController],
  providers: [
    AppService,
    LoggerMiddleware,
    AuthMiddleware,
    RolesGuard,
    Reflector,
    ValidationPipe,
    OrderNotFoundFilter,
  ],
})
class TestAppModule {}

// =======================================================================
// Test Suite
// =======================================================================
describe('App End-to-End (E2E) Test Suite', () => {
  let app: App;
  let server: Server;

  beforeAll(() => {
    app = new App(TestAppModule);
    app.use(AuthMiddleware);
    server = app.listen(0);
  });

  afterAll(() => {
    server.stop(true);
  });

  // --- Basic Routing Tests ---
  describe('Basic Routing', () => {
    test('GET /app/hello - should return 200 with text', async () => {
      const response = await fetch(new URL('/app/hello', server.url));
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Hello E2E World!');
    });

    test('GET /app/hello/ - should return 404', async () => {
      const response = await fetch(new URL('/app/hello/', server.url));
      expect(response.status).toBe(404);
    });

    test('GET /app - should return 200 with text', async () => {
      const response = await fetch(new URL('/app', server.url));
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Hello E2E World (App)!');
    });

    test('GET /app/ - should return 404', async () => {
      const response = await fetch(new URL('/app/', server.url));
      expect(response.status).toBe(404);
    });

    test('GET /app/item/:id - should handle path parameters', async () => {
      const response = await fetch(new URL('/app/item/123', server.url));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: 123, name: 'Item 123' });
    });

    test('GET /non-existent-route - should return 404', async () => {
      const response = await fetch(new URL('/non-existent', server.url));
      expect(response.status).toBe(404);
    });
  });

  // --- Pipe and Validation Tests ---
  describe('Pipes and Validation', () => {
    test('POST /app/item - should return 200 with valid data', async () => {
      const validData = { name: 'Test Item', quantity: 50 };
      const response = await fetch(new URL('/app/item', server.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: 99, ...validData });
    });

    test('POST /app/item - should return 400 with invalid data (quantity too high)', async () => {
      const invalidData = { name: 'Test Item', quantity: 200 };
      const response = await fetch(new URL('/app/item', server.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });
      expect(response.status).toBe(400);
    });
  });

  // --- Guards and Authorization Tests ---
  describe('Guards and Authorization', () => {
    test('GET /app/admin - should return 403 Forbidden for non-admin user', async () => {
      const response = await fetch(new URL('/app/admin', server.url), {
        headers: { 'x-auth-token': 'user-token' },
      });
      expect(response.status).toBe(403);
    });

    test('GET /app/admin - should return 200 OK for admin user', async () => {
      const response = await fetch(new URL('/app/admin', server.url), {
        headers: { 'x-auth-token': 'admin-token' },
      });
      expect(response.status).toBe(200);
    });

    test('GET /app/user - should return 200 OK for user', async () => {
      const response = await fetch(new URL('/app/user', server.url), {
        headers: { 'x-auth-token': 'user-token' },
      });
      expect(response.status).toBe(200);
    });
  });
});
