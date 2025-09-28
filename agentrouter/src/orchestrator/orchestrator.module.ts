import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { AgentModule } from '../agent/agent.module';
import { ClassificationModule } from '../classification/classification.module';

@Module({
  imports: [AgentModule, ClassificationModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}