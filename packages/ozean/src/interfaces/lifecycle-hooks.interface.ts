export interface OnModuleInit {
  onModuleInit(): void | Promise<void>;
}

export interface OnApplicationBootstrap {
  onApplicationBootstrap(): void | Promise<void>;
}

export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): void | Promise<void>;
}
