import {
  App,
  Module,
  Controller,
  Get,
  Injectable,
  HttpException,
  BadRequestException,
  UseFilters,
  type ExceptionFilter,
  type ArgumentsHost,
  Catch,
  HttpStatus,
} from 'ozean';

import 'reflect-metadata';

// --- Custom Exception ---
class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}

// --- Custom Exception Filter ---
@Catch(ForbiddenException)
@Injectable()
class ForbiddenExceptionFilter implements ExceptionFilter<ForbiddenException> {
  catch(exception: ForbiddenException, host: ArgumentsHost): Response {
    const request = host.getRequest<Request>();
    console.log(
      `[ForbiddenExceptionFilter] Custom filter caught a ForbiddenException for path: ${request.url}`
    );
    return new Response(
      JSON.stringify({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Access is denied by our custom Forbidden filter.',
        timestamp: new Date().toISOString(),
        path: request.url,
      }),
      {
        status: HttpStatus.FORBIDDEN,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// --- Controller ---
@Controller('/test')
@UseFilters(ForbiddenExceptionFilter)
class TestController {
  @Get('/forbidden')
  getForbiddenResource() {
    throw new ForbiddenException();
  }

  @Get('/bad-request')
  getBadRequest() {
    throw new BadRequestException('This is a bad request.');
  }

  @Get('/not-found')
  getNotFound() {
    throw new HttpException('This is a not found.', HttpStatus.NOT_FOUND);
  }
}

// --- Root Application Module ---
@Module({
  controllers: [TestController],
  providers: [ForbiddenExceptionFilter],
})
class AppModule {}

// --- Start Application ---
new App(AppModule).listen(3000);
