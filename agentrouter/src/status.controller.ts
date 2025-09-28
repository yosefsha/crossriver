import { Controller, Get } from '@nestjs/common';
import { OrchestratorService } from './orchestrator/orchestrator.service';

@Controller('status')
export class StatusController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get()
  async getStatus() {
    try {
      // This will be available at /status directly (without the /agents prefix)
      const result = await this.orchestratorService.getStatus();
      console.log('Status endpoint called successfully');
      return {
        ...result,
        direct_access: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in status endpoint:', error);
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}