# File Uploads

OzeanJs has a built-in feature that helps manage file uploads (sent as `multipart/form-data`) easily and systematically, using an Interceptor called **`FileInterceptor`**.

### How It Works

The `FileInterceptor` intercepts incoming requests, checks if they are `multipart/form-data`, then parses and extracts the file that matches the specified `fieldName`. It then attaches this file to the `Request` object, allowing you to easily access it in your Controller via the `@UploadedFile()` decorator.

## Using File Uploads

Here is an example of creating an endpoint for uploading a profile picture.

### 1. Creating a Controller for Uploads

We will use three main decorators: `@Controller`, `@UseInterceptors`, and `@UploadedFile`.

```typescript
// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  FileInterceptor, // <-- Import FileInterceptor from the library
} from 'ozean';
import path from 'path';

@Controller('/upload')
export class UploadController {
  @Post('/profile-picture')
  @UseInterceptors(FileInterceptor('avatar')) // 1. Use the Interceptor and specify the field name as 'avatar'
  uploadProfilePicture(@UploadedFile() file: File) {
    // 2. Use the decorator to receive the file

    // 3. Check if a file was sent
    if (!file) {
      // In the future, we could use a Pipe to handle this
      return { error: 'No file uploaded or field name is incorrect.' };
    }

    console.log(`Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // 4. (Example) Logic for saving the file to an 'uploads' folder
    // Bun.write(path.join(import.meta.dir, 'uploads', file.name), file);

    return {
      message: 'File uploaded successfully!',
      filename: file.name,
      sizeInBytes: file.size,
    };
  }
}
```

**Code Explanation:**

1.  **`@UseInterceptors(FileInterceptor('avatar'))`**: This tells OzeanJs to use the `FileInterceptor` for this route. The `FileInterceptor` will look for a file from a form field named `avatar`.
2.  **`@UploadedFile() file: File`**: This tells the framework to "inject the file that the `FileInterceptor` extracted into this `file` parameter." The type of the file will be the standard `File` object.
3.  **File Check**: Inside the method, you can check if the `file` received is valid.
4.  **Saving the File**: You can use `Bun.write()` to save the received `File` object directly to disk.

### 2. Registering in a Module

Finally, register the created `UploadController` in the `controllers` array of the relevant module.

```typescript
// src/upload/upload.module.ts
import { Module } from 'ozeanjs';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
  // It's not necessary to provide FileInterceptor here
  // because it's created and managed by @UseInterceptors.
  providers: [],
})
export class UploadModule {}
```

### 3. Testing with `curl`

You can test the created endpoint using `curl`:

```bash
# First, create a test.txt file
echo "hello ozeanjs" > test.txt

# Run curl, specifying the field name to match the one in FileInterceptor ('avatar')
curl -X POST -F "avatar=@test.txt" http://localhost:3000/upload/profile-picture
```

**Expected Result:**

```json
{ "message": "File uploaded successfully!", "filename": "test.txt", "sizeInBytes": 14 }
```
