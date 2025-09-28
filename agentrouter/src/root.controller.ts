import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Root')
@Controller()
export class RootController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'Welcome message' })
  getRoot() {
    return {
      message: 'Agent Router API is running',
      documentation: '/docs',
      health: '/health',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Status check' })
  @ApiResponse({ status: 200, description: 'Service status' })
  getStatus() {
    return this.appService.getHealth();
  }
}