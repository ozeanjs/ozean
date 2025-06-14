import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'bun';
import fs from 'fs/promises';
import path from 'path';
import 'reflect-metadata';

import { App, Module, Controller, Get } from '../../src';

@Controller('/api')
class ApiController {
  @Get('/hello')
  getHello() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [ApiController],
})
class TestAppModule {}

describe('Static File Serving (E2E)', () => {
  let app: App;
  let server: Server;
  const staticDir = path.join(__dirname, 'temp_static');

  beforeAll(async () => {
    console.log('Setting up test static directories...');
    await fs.mkdir(path.join(staticDir, 'public'), { recursive: true });
    await fs.mkdir(path.join(staticDir, 'assets'), { recursive: true });
    await fs.writeFile(
      path.join(staticDir, 'public', 'index.html'),
      '<h1>Hello Static World!</h1>'
    );
    await fs.writeFile(path.join(staticDir, 'assets', 'styles.css'), 'body { color: blue; }');

    app = new App(TestAppModule);

    app.useStaticAssets(path.join(staticDir, 'public'), { prefix: '/' });
    app.useStaticAssets(path.join(staticDir, 'assets'), { prefix: '/static' });

    server = app.listen(0);
    console.log(`Test server running on ${server.url}`);
  });

  afterAll(async () => {
    console.log('Tearing down test static directories...');
    server.stop(true);

    await fs.rm(staticDir, { recursive: true, force: true });
  });

  test('GET /index.html - should serve file from the root static directory', async () => {
    const response = await fetch(new URL('/index.html', server.url));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(await response.text()).toBe('<h1>Hello Static World!</h1>');
  });

  test('GET /static/styles.css - should serve file from the prefixed static directory', async () => {
    const response = await fetch(new URL('/static/styles.css', server.url));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/css');
    expect(await response.text()).toBe('body { color: blue; }');
  });

  test('GET /non-existent-file.txt - should return 404 (matches static prefix but file not found)', async () => {
    const response = await fetch(new URL('/non-existent-file.txt', server.url));

    expect(response.status).toBe(404);
  });

  test('GET /static/image.jpg - should return 404 (matches static prefix but file not found)', async () => {
    const response = await fetch(new URL('/static/image.jpg', server.url));

    expect(response.status).toBe(404);
  });

  test('GET /api/hello - should still serve the dynamic API route', async () => {
    const response = await fetch(new URL('/api/hello', server.url));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
