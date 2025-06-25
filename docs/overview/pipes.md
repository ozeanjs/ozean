# Pipes

In OzeanJs, a **Pipe** is a class that acts as a "tube" through which data flows before being sent to your Route Handler (a method in your Controller). A Pipe has two primary responsibilities:

1.  **Validation**: Checks if the incoming data meets the specified conditions. If not, it throws an exception to stop the process.
2.  **Transformation**: Converts incoming data into the desired format, such as converting the string "123" to the number `123`.

Pipes run after middleware but before the Route Handler is called, which is the ideal position for validating parameter data.

## Using Pipes

We use the `@UsePipes()` decorator to "attach" the desired Pipe to the Route Handler that needs data validation.

## `ValidationPipe`: The Automatic Validation Pipe

OzeanJs comes with a built-in `ValidationPipe`, a powerful pipe that works with the `class-validator` and `class-transformer` libraries to automatically validate and transform data from the request body according to a specified DTO (Data Transfer Object).

---

## Usage Example: Input Validation

Here is a complete example of using `ValidationPipe` to validate data for creating a new user.

### 1. Install Dependencies (for Users)

Users of the library will need to install these 2 additional libraries:

```bash
bun add class-validator class-transformer
```

### 2. Create a DTO (Data Transfer Object)

A DTO is a class that acts as a "blueprint," defining the shape and validation rules for your expected data.

```typescript
// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}
```

### 3. Register and Use `ValidationPipe` in a Controller

```typescript
// src/users/users.controller.ts
import { Controller, Post, Body, UsePipes, ValidationPipe } from 'ocean';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(ValidationPipe) // <-- Apply the ValidationPipe to this route
  createUser(@Body() userData: CreateUserDto) {
    // <-- Specify the Body's Type as the DTO
    // At this point, we can be sure that userData is a valid instance of CreateUserDto
    // and has been validated.
    return this.usersService.create(userData);
  }
}
```

### 4. Register the Pipe in a Module

Finally, don't forget to add `ValidationPipe` to the `providers` array of the relevant Module so the DI Container recognizes it.

```typescript
// src/users/users.module.ts
import { Module } from 'ocean';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ValidationPipe } from 'ocean'; // Import from Library

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    ValidationPipe, // <-- Add here
  ],
})
export class UsersModule {}
```

Once this is done:

- **If the client sends data that matches the DTO**: The request will proceed to the `createUser` method as normal.
- **If the client sends incorrect data**: The `ValidationPipe` will automatically throw a `BadRequestException`, and the framework will respond with an **HTTP Status 400 Bad Request** along with the error details.
