import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'agentrouter',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getDetailedHealth() {
    return {
      status: 'ok',
      service: 'agentrouter',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      aws: {
        region: process.env.AWS_REGION,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      },
    };
  }
}