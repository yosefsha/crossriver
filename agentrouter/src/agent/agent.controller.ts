import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { ChatMessageDto, StartSessionDto, AgentResponseDto } from './dto/agent.dto';

@ApiTags('Bedrock Agents')
@ApiBearerAuth()
@Controller()
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Get()
  @ApiOperation({ summary: 'List all available Bedrock agents' })
  @ApiResponse({ status: 200, description: 'List of agents retrieved successfully' })
  async getAllAgents() {
    try {
      return await this.agentService.getAllAgents();
    } catch (error) {
      this.logger.error('Failed to get agents:', error);
      throw new HttpException(
        'Failed to retrieve agents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':agentId')
  @ApiOperation({ summary: 'Get agent details by ID' })
  @ApiParam({ name: 'agentId', description: 'The agent ID' })
  @ApiResponse({ status: 200, description: 'Agent details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgent(@Param('agentId') agentId: string) {
    try {
      return await this.agentService.getAgentById(agentId);
    } catch (error) {
      this.logger.error(`Failed to get agent ${agentId}:`, error);
      throw new HttpException(
        'Failed to retrieve agent details',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post(':agentId/:agentAliasId/start-session')
  @ApiOperation({ summary: 'Start a new conversation session with an agent' })
  @ApiParam({ name: 'agentId', description: 'The agent ID' })
  @ApiParam({ name: 'agentAliasId', description: 'The agent alias ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Session started successfully',
    type: AgentResponseDto 
  })
  async startSession(
    @Param('agentId') agentId: string,
    @Param('agentAliasId') agentAliasId: string,
    @Body() startSessionDto: StartSessionDto,
  ) {
    try {
      return await this.agentService.startNewSession(
        agentId,
        agentAliasId,
        startSessionDto.initialMessage,
      );
    } catch (error) {
      this.logger.error(`Failed to start session with agent ${agentId}:`, error);
      throw new HttpException(
        'Failed to start conversation session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':agentId/:agentAliasId/chat')
  @ApiOperation({ summary: 'Send a message to an agent' })
  @ApiParam({ name: 'agentId', description: 'The agent ID' })
  @ApiParam({ name: 'agentAliasId', description: 'The agent alias ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Message sent successfully',
    type: AgentResponseDto 
  })
  async chatWithAgent(
    @Param('agentId') agentId: string,
    @Param('agentAliasId') agentAliasId: string,
    @Body() chatMessageDto: ChatMessageDto,
  ) {
    try {
      if (chatMessageDto.sessionId) {
        return await this.agentService.continueConversation(
          agentId,
          agentAliasId,
          chatMessageDto.sessionId,
          chatMessageDto.message,
        );
      } else {
        return await this.agentService.chatWithAgent(
          agentId,
          agentAliasId,
          chatMessageDto.message,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to chat with agent ${agentId}:`, error);
      throw new HttpException(
        'Failed to send message to agent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}