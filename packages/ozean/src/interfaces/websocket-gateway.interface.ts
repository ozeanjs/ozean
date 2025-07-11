import type { Server, ServerWebSocket } from 'bun';

export interface OnGatewayInit {
  afterInit(server: Server): void;
}
export interface OnGatewayConnection {
  handleConnection(client: ServerWebSocket<any>, request: Request): void;
}
export interface OnGatewayDisconnect {
  handleDisconnect(client: ServerWebSocket<any>): void;
}
