import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}