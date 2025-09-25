import { 
  Controller, 
  Post, 
  Get, 
  Delete,
  Body, 
  Param, 
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrchestratorService } from './services/orchestrator.service';
import { 
  StartOrchestratedSessionDto,
  OrchestrateQueryDto,
  OrchestratorResponseDto,
  OrchestratorStatusDto
} from './dto/orchestrator.dto';

/**
 * OrchestratorController - REST API endpoints for the multi-agent orchestrator
 * 
 * This controller provides the REST API interface for:
 * 1. Starting new orchestrated conversations
 * 2. Sending queries to the orchestrator
 * 3. Managing sessions and getting status
 * 4. Monitoring orchestrator health and performance
 */
@ApiTags('orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  /**
   * Start a new orchestrated conversation session
   */
  @Post('session/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Start new orchestrated session',
    description: 'Begins a new conversation with the orchestrator and returns the initial response with routing analysis'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Session started successfully',
    type: OrchestratorResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request parameters' 
  })
  async startSession(
    @Body() startSessionDto: StartOrchestratedSessionDto
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(`🚀 Starting new orchestrated session with message: "${startSessionDto.message}"`);

    try {
      if (!startSessionDto.message?.trim()) {
        throw new BadRequestException('Message cannot be empty');
      }

      const response = await this.orchestratorService.startOrchestratedSession(
        startSessionDto.message.trim()
      );

      this.logger.log(`✅ Session started successfully: ${response.session_id}`);
      return response;

    } catch (error) {
      this.logger.error(`Failed to start session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a query to the orchestrator within an existing session
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send query to orchestrator',
    description: 'Processes a user query through the intelligent routing system and returns specialist response'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Query processed successfully',
    type: OrchestratorResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request parameters' 
  })
  async orchestrateQuery(
    @Body() queryDto: OrchestrateQueryDto
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(`🎯 Processing orchestrated query for session: ${queryDto.sessionId}`);

    try {
      if (!queryDto.message?.trim()) {
        throw new BadRequestException('Message cannot be empty');
      }

      if (!queryDto.sessionId?.trim()) {
        throw new BadRequestException('Session ID is required');
      }

      const response = await this.orchestratorService.orchestrateQuery(
        queryDto.message.trim(),
        queryDto.sessionId.trim()
      );

      this.logger.log(`✅ Query processed: ${response.handling_agent} responded in ${response.processing_time_ms}ms`);
      return response;

    } catch (error) {
      this.logger.error(`Failed to process query: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get orchestrator status and available agents
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Get orchestrator status',
    description: 'Returns current status, available specialist agents, and system metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status retrieved successfully',
    type: OrchestratorStatusDto
  })
  getStatus(): OrchestratorStatusDto {
    this.logger.log('📊 Getting orchestrator status');

    try {
      const status = this.orchestratorService.getOrchestratorStatus();

      return {
        is_active: status.isActive,
        available_agents: status.availableAgents.map(agent => ({
          agent_id: agent.id,
          name: agent.name,
          description: agent.description,
          domains: agent.domains,
          keywords: [], // Not exposed in status endpoint
          confidence_threshold: 0.7, // Default value
          is_active: true
        })),
        active_sessions: status.activeSessions,
        total_queries_processed: 0, // TODO: Add metrics tracking
        uptime_seconds: Math.floor(process.uptime()),
        version: status.version
      };

    } catch (error) {
      this.logger.error(`Failed to get status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get information about available specialist agents
   */
  @Get('agents')
  @ApiOperation({ 
    summary: 'Get available specialist agents',
    description: 'Returns detailed information about all specialist agents in the system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Agents retrieved successfully'
  })
  getAvailableAgents() {
    this.logger.log('👥 Getting available specialist agents');

    try {
      const status = this.orchestratorService.getOrchestratorStatus();
      return {
        agents: status.availableAgents,
        total_count: status.availableAgents.length,
        active_sessions: status.activeSessions
      };

    } catch (error) {
      this.logger.error(`Failed to get agents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get statistics for a specific session
   */
  @Get('session/:sessionId/stats')
  @ApiOperation({ 
    summary: 'Get session statistics',
    description: 'Returns detailed analytics for a specific conversation session'
  })
  @ApiParam({ 
    name: 'sessionId', 
    description: 'Session identifier' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session statistics retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  getSessionStats(@Param('sessionId') sessionId: string) {
    this.logger.log(`📈 Getting statistics for session: ${sessionId}`);

    try {
      const stats = this.orchestratorService.getSessionStats(sessionId);
      
      if (!stats) {
        throw new NotFoundException(`Session not found: ${sessionId}`);
      }

      return {
        session_id: sessionId,
        ...stats
      };

    } catch (error) {
      this.logger.error(`Failed to get session stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear a specific session
   */
  @Delete('session/:sessionId')
  @ApiOperation({ 
    summary: 'Clear session',
    description: 'Removes a session and all its conversation history'
  })
  @ApiParam({ 
    name: 'sessionId', 
    description: 'Session identifier to clear' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session cleared successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  clearSession(@Param('sessionId') sessionId: string) {
    this.logger.log(`🗑️ Clearing session: ${sessionId}`);

    try {
      const cleared = this.orchestratorService.clearSession(sessionId);
      
      if (!cleared) {
        throw new NotFoundException(`Session not found: ${sessionId}`);
      }

      return {
        success: true,
        message: `Session ${sessionId} cleared successfully`
      };

    } catch (error) {
      this.logger.error(`Failed to clear session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Simple health check endpoint for monitoring'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy' 
  })
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'orchestrator'
    };
  }
}