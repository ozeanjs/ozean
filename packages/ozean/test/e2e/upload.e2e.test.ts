import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'bun';
import 'reflect-metadata';

import {
  App,
  Module,
  Controller,
  Post,
  Injectable,
  UseInterceptors,
  UploadedFile,
  FileInterceptor,
} from '../../src';

@Controller('/upload')
class UploadController {
  @Post('/file')
  @UseInterceptors(FileInterceptor('myFile'))
  uploadSingleFile(@UploadedFile() file: File) {
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded or field name is incorrect.' }),
        { status: 400 }
      );
    }

    return {
      message: 'File uploaded successfully!',
      filename: file.name,
      size: file.size,
    };
  }
}

@Module({
  controllers: [UploadController],
  providers: [],
})
class UploadTestModule {}

describe('File Upload (E2E)', () => {
  let app: App;
  let server: Server;

  beforeAll(() => {
    app = new App(UploadTestModule);
    server = app.listen(0);
  });

  afterAll(() => {
    server.stop(true);
  });

  test('POST /upload/file - should successfully upload a file', async () => {
    const formData = new FormData();
    const fileContent = 'This is the content of the test file.';
    const file = new Blob([fileContent], { type: 'text/plain' });

    formData.append('myFile', file, 'test-document.txt');

    const response = await fetch(new URL('/upload/file', server.url), {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('File uploaded successfully!');
    expect(body.filename).toBe('test-document.txt');
    expect(body.size).toBe(fileContent.length);
  });

  test('POST /upload/file - should return 400 if field name is incorrect', async () => {
    const formData = new FormData();
    const file = new Blob(['some content'], { type: 'text/plain' });

    formData.append('wrongFieldName', file, 'test.txt');

    const response = await fetch(new URL('/upload/file', server.url), {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('No file uploaded');
  });

  test('POST /upload/file - should return 400 if no file is sent', async () => {
    const formData = new FormData();

    const response = await fetch(new URL('/upload/file', server.url), {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('No file uploaded');
  });
});
