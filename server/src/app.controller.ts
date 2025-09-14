import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('foo')
  getFoo() {
    return {
      message: 'Hello from foo endpoint!',
      data: {
        id: 1,
        name: 'Foo Item',
        description: 'This is a simple foo endpoint response',
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get('bar')
  getBar() {
    return {
      message: 'Hello from bar endpoint!',
      data: {
        id: 2,
        name: 'Bar Item',
        description: 'This is a simple bar endpoint response',
        timestamp: new Date().toISOString()
      }
    };
  }
}
