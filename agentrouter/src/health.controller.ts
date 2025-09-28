import { Controller, Get } from '@nestjs/common';
import { OrchestratorService } from './orchestrator/orchestrator.service';

/**
 * Controller for health check endpoints
 */
@Controller('health')
export class HealthController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  /**
   * Basic health check endpoint
   * @returns Simple health status
   */
  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'agentrouter'
    };
  }

  /**
   * Detailed health check endpoint providing more information
   * about the service and its dependencies
   * @returns Detailed health status
   */
  @Get('detailed')
  async getDetailedHealth() {
    try {
      // Get status from orchestrator which includes agent availability info
      const orchestratorStatus = await this.orchestratorService.getStatus();
      
      // Check if all required services are available
      const allAgentsAvailable = orchestratorStatus.available_agents.length > 0;
      
      return {
        status: allAgentsAvailable ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'agentrouter',
        version: orchestratorStatus.version,
        uptime: {
          seconds: orchestratorStatus.uptime_seconds,
          formatted: this.formatUptime(orchestratorStatus.uptime_seconds)
        },
        orchestrator: {
          is_active: orchestratorStatus.is_active,
          available_agents: orchestratorStatus.available_agents.length,
          active_sessions: orchestratorStatus.active_sessions
        },
        memory_usage: this.getMemoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      console.error('Error getting detailed health info:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'agentrouter',
        error: error.message
      };
    }
  }

  /**
   * Format uptime in a human-readable format
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    return {
      rss: this.formatBytes(memoryUsage.rss),
      heapTotal: this.formatBytes(memoryUsage.heapTotal),
      heapUsed: this.formatBytes(memoryUsage.heapUsed),
      external: this.formatBytes(memoryUsage.external)
    };
  }

  /**
   * Format bytes to a human-readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}