import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'bun';
import 'reflect-metadata';

import {
  App,
  Module,
  Controller,
  Get,
  Injectable,
  Inject,
  type DynamicModule,
  type ProviderToken,
} from '../../src';

describe('Dynamic Modules Normal Case (E2E)', () => {
  // --- Config Feature (Global Dynamic Module) ---
  const CONFIG_OPTIONS_TOKEN: ProviderToken = 'CONFIG_OPTIONS';
  interface AppConfig {
    appName: string;
  }
  @Injectable()
  class ConfigService {
    constructor(@Inject(CONFIG_OPTIONS_TOKEN) private readonly options: AppConfig) {}
    getAppName(): string {
      return this.options.appName;
    }
  }
  @Module({})
  class ConfigModule {
    static forRoot(options: AppConfig): DynamicModule {
      return {
        global: true,
        module: ConfigModule,
        providers: [{ provide: CONFIG_OPTIONS_TOKEN, useValue: options }, ConfigService],
        exports: [ConfigService],
      };
    }
  }

  // --- Database Feature (NON-Global Dynamic Module with Factory) ---
  const DB_CONNECTION_TOKEN: ProviderToken = 'DATABASE_CONNECTION';
  @Injectable()
  class DatabaseService {
    public readonly connectionId = Math.random();
    constructor(@Inject(DB_CONNECTION_TOKEN) private connection: any) {}
    query(sql: string) {
      return `(ID: ${this.connectionId}) - Results for: ${sql}`;
    }
  }
  @Module({})
  class DatabaseModule {
    static forRoot(): DynamicModule {
      return {
        module: DatabaseModule,
        providers: [
          {
            provide: DB_CONNECTION_TOKEN,
            useFactory: (config: ConfigService) => {
              console.log(`Creating DB Connection for app: ${config.getAppName()}`);
              return { status: 'connected' };
            },
            inject: [ConfigService],
          },
          DatabaseService,
        ],
        exports: [DatabaseService],
      };
    }
  }

  @Injectable()
  class UsersService {
    constructor(private readonly dbService: DatabaseService) {}
    getUsers() {
      return `[Users] ${this.dbService.query('SELECT * FROM users')}`;
    }
  }
  @Controller('/users')
  class UsersController {
    constructor(private readonly usersService: UsersService) {}
    @Get() listUsers() {
      return this.usersService.getUsers();
    }
  }
  @Module({
    imports: [DatabaseModule],
    controllers: [UsersController],
    providers: [UsersService],
  })
  class UsersModule {}

  // --- Orders Feature Module ---
  @Injectable()
  class OrdersService {
    constructor(private readonly dbService: DatabaseService) {}
    getOrders() {
      return `[Orders] ${this.dbService.query('SELECT * FROM orders')}`;
    }
  }
  @Controller('/orders')
  class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}
    @Get() listOrders() {
      return this.ordersService.getOrders();
    }
  }
  @Module({
    imports: [DatabaseModule],
    controllers: [OrdersController],
    providers: [OrdersService],
  })
  class OrdersModule {}

  let app: App;
  let server: Server;

  beforeAll(() => {
    @Module({
      imports: [
        ConfigModule.forRoot({ appName: 'My E2E Test App' }),
        DatabaseModule.forRoot(),
        UsersModule,
        OrdersModule,
      ],
    })
    class TestAppModule {}

    app = new App(TestAppModule);
    server = app.listen(0);
  });

  afterAll(() => {
    server.stop(true);
  });

  // --- Test Cases ---
  test('should resolve global providers correctly', async () => {
    const response = await fetch(new URL('/users', server.url));
    expect(response.status).toBe(200);
  });

  test('should share the same instance of a provider from an imported dynamic module', async () => {
    const userRes = await fetch(new URL('/users', server.url));
    const orderRes = await fetch(new URL('/orders', server.url));

    const userBody = await userRes.text();
    const orderBody = await orderRes.text();

    const userIdMatch = userBody.match(/\(ID: (.*?)\)/);
    const orderIdMatch = orderBody.match(/\(ID: (.*?)\)/);

    const userId = userIdMatch ? userIdMatch[1]! : null;
    const orderId = orderIdMatch ? orderIdMatch[1]! : null;

    expect(userId).not.toBeNull();
    expect(orderId).not.toBeNull();
    expect(userId).toBe(orderId);
  });
});

describe('Dynamic Modules Spacial Case (E2E)', () => {
  test('should throw error if trying to resolve un-exported provider from dynamic module', async () => {
    // --- Config Feature (Global Dynamic Module) ---
    const CONFIG_OPTIONS_TOKEN: ProviderToken = 'CONFIG_OPTIONS';
    interface AppConfig {
      appName: string;
    }
    @Injectable()
    class ConfigService {
      constructor(@Inject(CONFIG_OPTIONS_TOKEN) private readonly options: AppConfig) {}
      getAppName(): string {
        return this.options.appName;
      }
    }
    @Module({})
    class ConfigModule {
      static forRoot(options: AppConfig): DynamicModule {
        return {
          global: true,
          module: ConfigModule,
          providers: [{ provide: CONFIG_OPTIONS_TOKEN, useValue: options }, ConfigService],
          exports: [ConfigService],
        };
      }
    }

    // --- Database Feature (NON-Global Dynamic Module with Factory) ---
    const DB_CONNECTION_TOKEN: ProviderToken = 'DATABASE_CONNECTION';
    @Injectable()
    class DatabaseService {
      public readonly connectionId = Math.random();
      constructor(@Inject(DB_CONNECTION_TOKEN) private connection: any) {}
      query(sql: string) {
        return `(ID: ${this.connectionId}) - Results for: ${sql}`;
      }
    }
    @Module({})
    class DatabaseModule {
      static forRoot(): DynamicModule {
        return {
          module: DatabaseModule,
          providers: [
            {
              provide: DB_CONNECTION_TOKEN,
              useFactory: (config: ConfigService) => {
                console.log(`Creating DB Connection for app: ${config.getAppName()}`);
                return { status: 'connected' };
              },
              inject: [ConfigService],
            },
            DatabaseService,
          ],
          exports: [DatabaseService],
        };
      }
    }

    @Injectable()
    class UsersService {
      constructor(private readonly dbService: DatabaseService) {}
      getUsers() {
        return `[Users] ${this.dbService.query('SELECT * FROM users')}`;
      }
    }
    @Controller('/users')
    class UsersController {
      constructor(private readonly usersService: UsersService) {}
      @Get() listUsers() {
        return this.usersService.getUsers();
      }
    }

    @Module({})
    class BadDatabaseModule {
      static forRoot(): DynamicModule {
        return {
          module: BadDatabaseModule,
          providers: [DatabaseService],
        };
      }
    }

    @Module({
      imports: [BadDatabaseModule.forRoot()],
      controllers: [UsersController],
      providers: [UsersService],
    })
    class FailingUsersModule {}

    @Module({ imports: [FailingUsersModule] })
    class FailingAppModule {}

    expect(() => {
      new App(FailingAppModule);
    }).toThrow();
  });
});
