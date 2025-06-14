import 'reflect-metadata';

import { App, Module, Controller, Get, Injectable } from '../packages/ozean/src';

@Injectable()
class AppService {
  getHello() {
    return 'Hello world!';
  }
}

@Controller('/app')
class TestAppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello')
  getHello() {
    return this.appService.getHello();
  }
}

@Module({
  controllers: [TestAppController],
  providers: [AppService],
})
class TestAppModule {}

new App(TestAppModule).listen(3000);
