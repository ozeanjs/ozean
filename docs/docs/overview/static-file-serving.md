# Static File Serving

OzeanJs has a built-in capability to serve static files like images, CSS, or client-side JavaScript directly. This allows you to create applications with both an API and various assets within a single project, without needing additional web server configuration.

### How It Works

When you configure OzeanJs to serve static files, every incoming request is checked **before** it enters the dynamic routing system (Controllers).

1. The framework checks if the request URL matches a registered `prefix` for static files.

2. If it matches, it attempts to find the corresponding file in the directory you specified.

3. **If the file is found**: The framework sends the file back to the user immediately, and the request is finished.

4. **If the file is not found**: The framework will **let the request fall through** to the dynamic routing system to check if an API route matches.

This process ensures that your static file configuration does not accidentally "block" or "intercept" API routes that might have a similar path.

## Usage

You can enable this feature by calling the `.useStaticAssets()` method on your `App` instance. You can call it multiple times to configure several static directories.

#### `app.useStaticAssets(directoryPath, options)`

- **`directoryPath`**: The absolute path to the folder where you store your static files.

- **`options.prefix`** (Optional): The URL prefix you want to use to access the files in that folder. If not specified, it defaults to `/`.

### Example Configuration

In your application's entry file (`main.ts`), you can configure it as follows:

```typescript
// src/main.ts
import { App, Module, Controller, Get } from 'ozean';
import 'reflect-metadata';
import path from 'path';

// --- Create a Controller for the API ---
@Controller('/api')
class ApiController {
  @Get('/status')
  getStatus() {
    return { status: 'API is running' };
  }
}

@Module({
  controllers: [ApiController],
})
class AppModule {}

// --- Bootstrap the application ---
const app = new App(AppModule);

// 1. Serve files from a "public" folder at the root URL (/)
// e.g., a request to /style.css will look for ./public/style.css
app.useStaticAssets(path.join(import.meta.dir, 'public'), { prefix: '/' });

// 2. Serve files from an "uploads" folder at the /media URL
// e.g., a request to /media/avatar.png will look for ./uploads/avatar.png
app.useStaticAssets(path.join(import.meta.dir, 'uploads'), { prefix: '/media' });

app.listen(3000);
```

**How to test:**

1. Create `public` and `uploads` folders in the same directory as `main.ts`.

2. Place a `style.css` file in `public` and an `avatar.png` file in `uploads`.

3. Run the application (`bun run src/main.ts`).

4. **Test Static Files**:

   - `curl http://localhost:3000/style.css` -> Should return the content of the CSS file.
   - `curl http://localhost:3000/media/avatar.png` -> Should return the image file.

5. **Test a non-existent static file (but path matches prefix)**:

   - `curl -i http://localhost:3000/non-existent.js` -> Will **not** receive a 404 from the static handler. It will fall through to the dynamic router, and since no API route `/non-existent.js` matches, it will receive a 404 from the dynamic router instead.

6. **Test API Route**:
   - `curl http://localhost:3000/api/status` -> Should return the JSON response `{"status":"API is running"}`.
