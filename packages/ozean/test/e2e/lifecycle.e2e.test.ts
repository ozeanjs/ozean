import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import type { Server } from 'bun';
import 'reflect-metadata';

import {
  App,
  Module,
  Controller,
  Get,
  Injectable,
  type OnModuleInit,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '../../src';

const onModuleInitSpy = mock(() => {});
const onAppBootstrapSpy = mock(() => {});
const onAppShutdownSpy = mock(async (signal?: string) => {});

@Injectable()
class LifecycleService implements OnModuleInit, OnApplicationBootstrap, OnApplicationShutdown {
  public bootstrapTimestamp: number | null = null;
  public isShutdown = false;

  constructor() {
    console.log('[Test] LifecycleService constructor called.');
  }

  onModuleInit() {
    console.log('[Test] LifecycleService onModuleInit hook called.');
    onModuleInitSpy();
  }

  onApplicationBootstrap() {
    console.log('[Test] LifecycleService onApplicationBootstrap hook called.');
    this.bootstrapTimestamp = Date.now();
    onAppBootstrapSpy();
  }

  async onApplicationShutdown(signal?: string) {
    this.isShutdown = true;

    await onAppShutdownSpy(signal);
  }

  getBootstrapTime() {
    return this.bootstrapTimestamp;
  }

  getShutdownStatus() {
    return this.isShutdown;
  }
}

@Controller('/lifecycle')
class LifecycleController {
  constructor(private readonly service: LifecycleService) {}

  @Get('/bootstrap-time')
  getBootstrapTime() {
    return { bootstrap_timestamp: this.service.getBootstrapTime() };
  }

  @Get('/shutdown-status')
  getShutdownStatus() {
    return { is_shutdown: this.service.getShutdownStatus() };
  }
}

@Module({
  controllers: [LifecycleController],
  providers: [LifecycleService],
})
class TestLifecycleModule {}

describe('Lifecycle Hooks (E2E)', () => {
  let app: App;
  let server: Server;

  beforeEach(() => {
    onModuleInitSpy.mockClear();
    onAppBootstrapSpy.mockClear();
    onAppShutdownSpy.mockClear();

    app = new App(TestLifecycleModule);
    server = app.listen(0);
  });

  afterEach(() => {
    server.stop(true);
  });

  test('onModuleInit and onApplicationBootstrap should be called on startup', async () => {
    expect(onModuleInitSpy).toHaveBeenCalledTimes(1);
    expect(onAppBootstrapSpy).toHaveBeenCalledTimes(1);

    const response = await fetch(new URL('/lifecycle/bootstrap-time', server.url));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.bootstrap_timestamp).toBeGreaterThan(0);
  });

  test('onApplicationShutdown should be called when app.close() is invoked', async () => {
    expect(onAppShutdownSpy).not.toHaveBeenCalled();

    await (app as any)._callOnApplicationShutdown('test-signal');

    expect(onAppShutdownSpy).toHaveBeenCalledTimes(1);
    expect(onAppShutdownSpy).toHaveBeenCalledWith('test-signal');

    server.stop(true);

    await expect(fetch(new URL('/lifecycle/shutdown-status', server.url))).rejects.toThrow();
  });
});
