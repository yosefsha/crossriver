import { spawn, ChildProcess } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

export class TestEnvironment {
  private authService: ChildProcess | null = null;
  private serverApp: INestApplication | null = null;

  async setupAuthService(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Start auth service in background
      this.authService = spawn('npm', ['run', 'start:dev'], {
        cwd: '../../auth',
        stdio: 'pipe',
        env: {
          ...process.env,
          PORT: '3001',
          NODE_ENV: 'test'
        }
      });

      this.authService.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('listening on port 3001')) {
          resolve();
        }
      });

      this.authService.stderr?.on('data', (data) => {
        console.error('Auth service error:', data.toString());
      });

      this.authService.on('error', reject);

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Auth service failed to start within 30 seconds'));
      }, 30000);
    });
  }

  async setupServerApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.serverApp = moduleFixture.createNestApplication();
    await this.serverApp.init();
    return this.serverApp;
  }

  async cleanup(): Promise<void> {
    if (this.serverApp) {
      await this.serverApp.close();
    }
    
    if (this.authService) {
      this.authService.kill();
    }
  }
}
