import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { BedrockService } from './bedrock.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, BedrockService],
  exports: [AgentService, BedrockService],
})
export class AgentModule {}