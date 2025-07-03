import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import type { Server } from 'bun';
import 'reflect-metadata';

import {
  App,
  Module,
  Controller,
  Get,
  Injectable,
  type Middleware,
  type NextFunction,
  UseMiddleware,
  Req,
} from '../../src';

const executionOrder: string[] = [];

@Injectable()
class GlobalMiddleware1 implements Middleware {
  async use(req: Request, next: NextFunction) {
    (req as any).state = { user: 'User A' };
    executionOrder.push('GlobalMiddleware1');
    return await next();
  }
}

@Injectable()
class GlobalMiddleware2 implements Middleware {
  async use(req: Request, next: NextFunction) {
    executionOrder.push('GlobalMiddleware2');
    return await next();
  }
}

@Injectable()
class ControllerMiddleware implements Middleware {
  async use(req: Request, next: NextFunction) {
    executionOrder.push('ControllerMiddleware');
    return await next();
  }
}

@Injectable()
class RouteMiddleware implements Middleware {
  async use(req: Request, next: NextFunction) {
    executionOrder.push('RouteMiddleware');
    return await next();
  }
}

@Injectable()
class ShortCircuitMiddleware implements Middleware {
  async use(req: Request, next: NextFunction) {
    return new Response('Request was short-circuited by middleware', { status: 200 });
  }
}

@Controller('/middleware-test')
@UseMiddleware(ControllerMiddleware)
class TestController {
  @Get('/all')
  @UseMiddleware(RouteMiddleware)
  getWithAllMiddlewares(@Req() req: Request) {
    executionOrder.push('Handler');
    return { success: true, userData: (req as any).state.user };
  }

  @Get('/no-route-mw')
  getWithNoRouteMiddleware() {
    executionOrder.push('Handler');
    return { success: true };
  }

  @Get('/short-circuit')
  @UseMiddleware(ShortCircuitMiddleware)
  getShortCircuited() {
    executionOrder.push('Handler');
    return { message: 'This should not be returned' };
  }
}

@Module({
  controllers: [TestController],
  providers: [
    GlobalMiddleware1,
    GlobalMiddleware2,
    ControllerMiddleware,
    RouteMiddleware,
    ShortCircuitMiddleware,
  ],
})
class TestAppModule {}

describe('Middlewares (E2E)', () => {
  let app: App;
  let server: Server;

  beforeAll(() => {
    app = new App(TestAppModule);

    app.use(GlobalMiddleware1, GlobalMiddleware2);

    server = app.listen(0);
  });

  afterAll(() => {
    server.stop(true);
  });

  beforeEach(() => {
    executionOrder.length = 0;
  });

  test('should execute global, controller, and route middlewares dsfdsfin correct order', async () => {
    const response = await fetch(new URL('/middleware-test/all', server.url));

    expect(response.status).toBe(200);

    expect((await response.json()).userData).toEqual('User A');
  });

  test('should execute global, controller, and route middlewares in correct order', async () => {
    const response = await fetch(new URL('/middleware-test/all', server.url));

    expect(response.status).toBe(200);

    expect(executionOrder).toEqual([
      'GlobalMiddleware1',
      'GlobalMiddleware2',
      'ControllerMiddleware',
      'RouteMiddleware',
      'Handler',
    ]);
  });

  test('should execute only global and controller middlewares when no route middleware is present', async () => {
    const response = await fetch(new URL('/middleware-test/no-route-mw', server.url));

    expect(response.status).toBe(200);

    expect(executionOrder).toEqual([
      'GlobalMiddleware1',
      'GlobalMiddleware2',
      'ControllerMiddleware',
      'Handler',
    ]);
  });

  test('should allow a middleware to short-circuit the request chain', async () => {
    const response = await fetch(new URL('/middleware-test/short-circuit', server.url));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Request was short-circuited by middleware');

    expect(executionOrder).not.toContain('Handler');
    expect(executionOrder).toEqual([
      'GlobalMiddleware1',
      'GlobalMiddleware2',
      'ControllerMiddleware',
    ]);
  });

  test('should not apply middlewares to a non-existent route', async () => {
    const response = await fetch(new URL('/not-found', server.url));

    expect(response.status).toBe(404);

    expect(executionOrder).toEqual([]);
  });
});
