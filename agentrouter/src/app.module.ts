import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { RootController } from './root.controller';
import { StatusController } from './status.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { ClassificationModule } from './classification/classification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AgentModule,
    OrchestratorModule,
    ClassificationModule,
  ],
  controllers: [AppController, RootController, StatusController, HealthController],
  providers: [AppService],
})
export class AppModule {}