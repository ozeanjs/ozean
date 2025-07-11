# WebSocket

OzeanJs has a built-in system for real-time communication via WebSockets, using an architecture called **Gateways**. This makes managing connections and events systematic and easy.

### What are Gateways?

A **Gateway** is a class that acts like a Controller but operates on WebSocket events instead of HTTP requests. It's a "gate" for bi-directional communication between the client and the server.

**Main responsibilities of a Gateway:**

- **Listen for messages** from clients via specified events.
- **Emit messages** back to clients (either specifically, broadcast, or to a room).
- **Manage Connection Lifecycle**: Such as when a client connects (`connection`) or disconnects (`disconnect`).

## Creating a Gateway

We create a Gateway by creating a class decorated with `@WebSocketGateway()` and should implement various Lifecycle Hooks to manage connections.

### 1. `@WebSocketGateway(options?: object)`

- **`@WebSocketGateway()`**: A class decorator to mark a class as a Gateway.
- **`options`** (Optional): In the future, it will be able to accept options like port or path (not yet implemented).

### 2. Lifecycle Hooks

These are Interfaces you can `implement` in your Gateway class, and OzeanJs will call these methods automatically.

- **`OnGatewayInit`**: Has an `afterInit(server: Server)` method, called after the Gateway is created and the Server is ready. Ideal for logging or initial setup.
- **`OnGatewayConnection`**: Has a `handleConnection(client: ServerWebSocket, request: Request)` method, called every time a new client connects.
- **`OnGatewayDisconnect`**: Has a `handleDisconnect(client: ServerWebSocket)` method, called every time a client disconnects.

### 3. Receiving and Sending Messages

We use various decorators to handle incoming messages.

- **`@SubscribeMessage('event_name')`**: A method decorator to bind a method to handle messages with a matching event name.
- **`@MessageBody()`**: A parameter decorator to extract the `data` (payload) sent with an event.
- **`@ConnectedSocket()`**: A parameter decorator to inject the `ServerWebSocket` instance of the client sending the message.
- **`@WebSocketServer()`**: A property decorator to inject the `Bun.Server` instance into the Gateway class, used for broadcasting or managing all clients.

## Usage Example: Complete `ChatGateway`

Here is an example of creating a Chat Gateway that demonstrates the use of all these features together.

```typescript
// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  Injectable,
} from 'ozeanjs';
import type { Server, ServerWebSocket } from 'bun';

@WebSocketGateway()
@Injectable()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server; // 1. Inject the server instance to use for broadcasting

  // --- Lifecycle Hooks ---

  afterInit(server: Server) {
    console.log(`[ChatGateway] Gateway initialized on port ${server.port}`);
  }

  handleConnection(client: ServerWebSocket<any>, request: Request) {
    console.log(`[ChatGateway] Client connected: ${client.remoteAddress}`);
    // Automatically subscribe every client to the "chat_room"
    client.subscribe('chat_room');
    // Send a welcome message back to the newly connected client
    client.send(JSON.stringify({ event: 'connection', data: 'Welcome to the OzeanJs Chat!' }));
  }

  handleDisconnect(client: ServerWebSocket<any>) {
    console.log(`[ChatGateway] Client disconnected: ${client.remoteAddress}`);
    // Optionally, notify everyone in the room that a user has left
    this.server.publish(
      'chat_room',
      JSON.stringify({
        event: 'user-left',
        data: `User ${client.remoteAddress} has left the chat.`,
      })
    );
  }

  // --- Message Handlers ---

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { text: string },
    @ConnectedSocket() client: ServerWebSocket<any>
  ): void {
    // A handler doesn't necessarily need to return a value
    console.log(`[ChatGateway] Received message: "${data.text}" from ${client.remoteAddress}`);

    const response = {
      event: 'message',
      data: {
        user: `User-${client.remoteAddress}`,
        text: data.text, // Echo the original message
      },
    };

    // Broadcast the message to everyone in the 'chat_room'
    this.server.publish('chat_room', JSON.stringify(response));
  }

  @SubscribeMessage('private-message')
  handlePrivateMessage(@MessageBody() data: any, @ConnectedSocket() client: ServerWebSocket<any>) {
    // A handler can return a value, and the framework will send it back only to the client who sent the message
    console.log(`[ChatGateway] Received private message:`, data);
    return { event: 'private-reply', data: `Your private message was received!` };
  }
}
```

### Registering a Gateway in a Module

Finally, remember that **a Gateway is also a type of Provider**, so you must register it in the `providers` array of the relevant Module.

```typescript
// src/chat/chat.module.ts
import { Module } from 'ozeanjs';
import { ChatGateway } from './chat.gateway';

@Module({
  providers: [ChatGateway],
})
export class ChatModule {}
```
