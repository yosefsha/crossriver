import { Module } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [AgentModule],
  providers: [ClassificationService],
  exports: [ClassificationService],
})
export class ClassificationModule {}