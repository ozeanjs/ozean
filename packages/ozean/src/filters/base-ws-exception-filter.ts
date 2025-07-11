import type { ServerWebSocket } from 'bun';
import type { ArgumentsHost } from '../interfaces/exception-filter.interface';
import type { WsExceptionFilter } from '../interfaces/ws-exception-filter.interface';

export class BaseWsExceptionFilter implements WsExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const client = host.getRequest<ServerWebSocket<any>>();
    console.error('[BaseWsExceptionFilter] Caught unhandled WebSocket exception:', exception);

    const exceptionData = JSON.parse(exception.message);
    const message = {
      event: 'error',
      data: {
        error: exceptionData.error,
        message: exceptionData.message || 'An internal server error occurred.',
      },
    };

    client.send(JSON.stringify(message));
  }
}
