import { describe, test, expect, beforeAll, afterAll, mock, beforeEach } from 'bun:test';
import type { Server, ServerWebSocket } from 'bun';
import 'reflect-metadata';

import {
  App,
  Module,
  Injectable,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  Catch,
  type WsExceptionFilter,
  type ArgumentsHost,
  UseWsFilters,
  BadRequestException,
  HttpException,
  type OnGatewayInit,
  WebSocketServer,
} from '../../src';

const afterInitSpy = mock((server: Server) => {});
const handleConnectionSpy = mock((client: ServerWebSocket<any>) => {});
const handleDisconnectSpy = mock((client: ServerWebSocket<any>) => {});

@Catch(BadRequestException)
@Injectable()
class WebSocketExceptionFilter implements WsExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const client = host.getRequest<ServerWebSocket<any>>();
    client.send(
      JSON.stringify({
        event: 'error',
        data: exception.response,
      })
    );
  }
}

@Injectable()
class DataService {
  getData(id: number) {
    return { id, data: `Data for ${id}` };
  }
}

@WebSocketGateway()
@UseWsFilters(WebSocketExceptionFilter)
@Injectable()
class TestGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly dataService: DataService) {}

  afterInit(server: Server) {
    afterInitSpy(server);
  }

  handleConnection(client: ServerWebSocket<any>) {
    handleConnectionSpy(client);
    client.subscribe('test_room');
    client.send(JSON.stringify({ event: 'connected', data: 'Welcome!' }));
  }

  handleDisconnect(client: ServerWebSocket<any>) {
    handleDisconnectSpy(client);
  }

  @SubscribeMessage('get-data')
  handleGetData(@MessageBody() body: { id: number }) {
    return { event: 'data-reply', data: this.dataService.getData(body.id) };
  }

  @SubscribeMessage('async-event')
  async handleAsyncEvent(@MessageBody() body: { delay: number }) {
    await new Promise((resolve) => setTimeout(resolve, body.delay));
    return { event: 'async-reply', data: `Waited for ${body.delay}ms` };
  }

  @SubscribeMessage('error-event')
  handleErrorEvent(@MessageBody() body: any) {
    if (!body || !body.isValid) {
      throw new BadRequestException('Invalid data received for error-event.');
    }
    return { event: 'should-not-happen' };
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(@MessageBody() data: any) {
    this.server.publish('test_room', JSON.stringify({ event: 'broadcast-event', data }));
  }
}

@Module({
  providers: [TestGateway, DataService, WebSocketExceptionFilter],
})
class TestWsModule {}

describe('WebSocket Gateway (E2E)', () => {
  let app: App;
  let server: Server;

  beforeAll(() => {
    afterInitSpy.mockClear();

    app = new App(TestWsModule);
    server = app.listen(0);
  });

  afterAll(() => {
    server.stop(true);
  });

  beforeEach(() => {
    handleConnectionSpy.mockClear();
    handleDisconnectSpy.mockClear();
  });

  const createClient = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(server.url.toString().replace('http', 'ws'));

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.event === 'connected') {
          resolve(ws);
        }
      };

      ws.onerror = (err) => reject(err);
    });
  };

  test('should inject and use services in a gateway handler', async () => {
    const client = await createClient();

    const replyPromise = new Promise((resolve) => {
      client.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.event === 'data-reply') resolve(msg.data);
      };
    });

    client.send(JSON.stringify({ event: 'get-data', data: { id: 123 } }));

    await expect(replyPromise).resolves.toEqual({ id: 123, data: 'Data for 123' });
    client.close();
  });

  test('should handle async handlers correctly', async () => {
    const client = await createClient();

    const replyPromise = new Promise((resolve) => {
      client.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.event === 'async-reply') resolve(msg.data);
      };
    });

    client.send(JSON.stringify({ event: 'async-event', data: { delay: 50 } }));

    await expect(replyPromise).resolves.toBe('Waited for 50ms');
    client.close();
  });

  test('should catch exceptions with an exception filter', async () => {
    const client = await createClient();

    const errorPromise = new Promise((resolve) => {
      client.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.event === 'error') resolve(msg.data);
      };
    });

    client.send(JSON.stringify({ event: 'error-event', data: { isValid: false } }));

    await expect(errorPromise).resolves.toEqual({
      error: 'Bad Request',
      statusCode: 400,
      message: 'Invalid data received for error-event.',
    });
    client.close();
  });

  test('Lifecycle Hooks: afterInit and handleConnection should be called on startup and connection', async () => {
    expect(afterInitSpy).toHaveBeenCalledTimes(1);
    expect(afterInitSpy).toHaveBeenCalledWith(server);

    expect(handleConnectionSpy).not.toHaveBeenCalled();

    const client = await createClient();

    expect(handleConnectionSpy).toHaveBeenCalledTimes(1);

    client.close();
  });

  test('Lifecycle Hooks: handleDisconnect should be called on close', async () => {
    const client = await createClient();

    const closePromise = new Promise<void>((resolve) => {
      client.onclose = () => resolve();
    });

    client.close();
    await closePromise;

    expect(handleDisconnectSpy).toHaveBeenCalled();
  });

  test('@WebSocketServer: should broadcast a message to all clients', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    const messagePromise1 = new Promise((res) =>
      client1.addEventListener('message', (e) => {
        const msg = JSON.parse(e.data.toString());
        if (msg.event === 'broadcast-event') res(msg.data);
      })
    );
    const messagePromise2 = new Promise((res) =>
      client2.addEventListener('message', (e) => {
        const msg = JSON.parse(e.data.toString());
        if (msg.event === 'broadcast-event') res(msg.data);
      })
    );

    // Client 1 sends a message to be broadcasted
    client1.send(JSON.stringify({ event: 'broadcast', data: 'This is for everyone!' }));

    const [result1, result2] = await Promise.all([messagePromise1, messagePromise2]);

    expect(result1).toBe('This is for everyone!');
    expect(result2).toBe('This is for everyone!');

    client1.close();
    client2.close();
  });
});
