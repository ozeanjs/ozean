import {
  App,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  Injectable,
  type Middleware,
  Module,
  type NextFunction,
  Reflector,
  UseGuards,
} from 'ozean';

import 'reflect-metadata';

// --- 1. Custom type for request state (place in a .d.ts file in a real project) ---
declare global {
  namespace Express {
    // Using Express namespace for compatibility
    interface Request {
      state: {
        user?: { id: number; roles: string[] };
      };
    }
  }
}

// --- 2. AuthMiddleware (Simulates authentication) ---
@Injectable()
export class AuthMiddleware implements Middleware {
  constructor(private reflector: Reflector) {}

  async use(req: Request, next: NextFunction): Promise<Response> {
    console.log(`[AuthMiddleware] ==> Simulating auth...`);
    const authHeader = req.headers.get('Authorization');
    console.log(authHeader);
    // In a real app, decode a JWT here
    if (authHeader) {
      (req as any).state = { user: { id: 1, roles: ['user'] } };
      // If a special token is provided, give admin role for testing
      if (authHeader === 'Bearer admin-token') {
        (req as any).state.user.roles.push('admin');
      }
      console.log((req as any).state);
    }
    return await next();
  }
}

// --- 3. Roles Decorator and Guard (Authorization Logic) ---
export const Roles = Reflector.createDecorator<string[]>();

@Injectable()
export class RolesGuard implements CanActivate {
  // 2. Inject the Reflector service instance
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log(this.reflector);
    // 3. Use the reflector service instance to get metadata, passing the decorator factory itself as the key
    const requiredRoles = this.reflector.get<string[]>(Roles, context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // If no roles are required, allow access
    }

    const request = context.getRequest<Request>();
    const user = (request as any).state?.user;

    console.log(`[RolesGuard] Required: ${requiredRoles}, User has: ${user?.roles}`);

    // 4. Perform authorization logic
    return requiredRoles.some((role: string) => user?.roles?.includes(role));
  }
}

// --- 4. Controller using the Guard ---
@Controller('/admin')
@UseGuards(RolesGuard) // Apply the guard to all routes in this controller
export class AdminController {
  @Get('/dashboard')
  @Roles(['admin']) // This route requires the 'admin' role
  getDashboard() {
    return { message: 'Welcome to the admin dashboard!' };
  }

  @Get('/profile')
  @Roles(['user', 'admin']) // This route requires 'user' OR 'admin' role
  getProfile() {
    return { message: 'This is your user profile in the admin section.' };
  }
}

// --- 5. Root Application Module ---
@Module({
  controllers: [AdminController],
  // Guards and Middlewares must be provided
  providers: [AuthMiddleware, RolesGuard, Reflector],
})
class AppModule {}

// --- 6. Start Application ---
const port = 3000;
const app = new App(AppModule);
app.use(AuthMiddleware); // Apply AuthMiddleware globally to attach user state
app.listen(port);
