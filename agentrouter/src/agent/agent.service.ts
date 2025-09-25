import { Injectable, Logger } from '@nestjs/common';
import { BedrockService } from './bedrock.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly bedrockService: BedrockService) {}

  /**
   * Get all available agents
   */
  async getAllAgents() {
    this.logger.log('Fetching all available agents');
    return await this.bedrockService.listAgents();
  }

  /**
   * Get agent details by ID
   */
  async getAgentById(agentId: string) {
    this.logger.log(`Fetching agent details for: ${agentId}`);
    return await this.bedrockService.getAgent(agentId);
  }

  /**
   * Chat with an agent
   */
  async chatWithAgent(agentId: string, agentAliasId: string, message: string, sessionId?: string) {
    this.logger.log(`Starting chat with agent ${agentId}`);
    
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    return await this.bedrockService.invokeAgent(agentId, agentAliasId, message, sessionId);
  }

  /**
   * Start a new conversation session
   */
  async startNewSession(agentId: string, agentAliasId: string, initialMessage?: string) {
    this.logger.log(`Starting new session with agent ${agentId}`);
    
    const welcomeMessage = initialMessage || 'Hello, how can you help me today?';
    return await this.chatWithAgent(agentId, agentAliasId, welcomeMessage);
  }

  /**
   * Continue an existing conversation
   */
  async continueConversation(agentId: string, agentAliasId: string, sessionId: string, message: string) {
    this.logger.log(`Continuing conversation in session ${sessionId}`);
    return await this.chatWithAgent(agentId, agentAliasId, message, sessionId);
  }
}