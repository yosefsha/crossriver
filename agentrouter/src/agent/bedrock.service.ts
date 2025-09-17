import { Injectable, Logger } from '@nestjs/common';
import { BedrockAgentClient, ListAgentsCommand, GetAgentCommand } from '@aws-sdk/client-bedrock-agent';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BedrockService {
  private readonly logger = new Logger(BedrockService.name);
  private readonly agentClient: BedrockAgentClient;
  private readonly agentRuntimeClient: BedrockAgentRuntimeClient;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    
    // Initialize Bedrock Agent client
    this.agentClient = new BedrockAgentClient({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });

    // Initialize Bedrock Agent Runtime client
    this.agentRuntimeClient = new BedrockAgentRuntimeClient({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });

    this.logger.log(`Bedrock service initialized for region: ${region}`);
  }

  /**
   * List all available Bedrock agents
   */
  async listAgents() {
    try {
      const command = new ListAgentsCommand({});
      const response = await this.agentClient.send(command);
      
      // Log the actual response structure for debugging
      this.logger.log('Full response structure:', JSON.stringify(response, null, 2));
      this.logger.log('Agent summaries type:', typeof response.agentSummaries);
      this.logger.log('Agent summaries length:', response.agentSummaries?.length || 0);
      
      if (response.agentSummaries && response.agentSummaries.length > 0) {
        this.logger.log('First agent structure:', JSON.stringify(response.agentSummaries[0], null, 2));
      }
      
      return response.agentSummaries || [];
    } catch (error) {
      this.logger.error('Failed to list agents:', error);
      throw new Error(`Failed to list agents: ${error.message}`);
    }
  }

  /**
   * Get details of a specific agent
   */
  async getAgent(agentId: string) {
    try {
      const command = new GetAgentCommand({ agentId });
      const response = await this.agentClient.send(command);
      this.logger.log(`Retrieved agent details for: ${agentId}`);
      return response.agent;
    } catch (error) {
      this.logger.error(`Failed to get agent ${agentId}:`, error);
      throw new Error(`Failed to get agent: ${error.message}`);
    }
  }

  /**
   * Invoke a Bedrock agent with a prompt
   */
  async invokeAgent(agentId: string, agentAliasId: string, prompt: string, sessionId?: string) {
    try {
      const command = new InvokeAgentCommand({
        agentId,
        agentAliasId,
        sessionId: sessionId || this.generateSessionId(),
        inputText: prompt,
      });

      const response = await this.agentRuntimeClient.send(command);
      this.logger.log(`Agent ${agentId} invoked successfully`);
      
      // Process the streaming response
      const chunks = [];
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            const text = new TextDecoder().decode(chunk.chunk.bytes);
            chunks.push(text);
          }
        }
      }

      return {
        sessionId: response.sessionId,
        response: chunks.join(''),
        contentType: response.contentType,
      };
    } catch (error) {
      this.logger.error(`Failed to invoke agent ${agentId}:`, error);
      throw new Error(`Failed to invoke agent: ${error.message}`);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}