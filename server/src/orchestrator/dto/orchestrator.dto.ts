import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartOrchestratedSessionDto {
  @ApiProperty({ description: 'Initial message to start the conversation' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Optional session configuration' })
  @IsOptional()
  @IsString()
  sessionConfig?: string;
}

export class OrchestrateQueryDto {
  @ApiProperty({ description: 'User message to be processed by the orchestrator' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Session ID for conversation continuity' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Force routing to specific agent' })
  @IsOptional()
  @IsString()
  forceAgent?: string;
}

export class QueryAnalysisDto {
  @ApiProperty({ description: 'Detected intent of the query' })
  @IsString()
  analyzed_intent: string;

  @ApiProperty({ description: 'Keywords extracted from the query' })
  @IsArray()
  @IsString({ each: true })
  keywords_matched: string[];

  @ApiProperty({ description: 'Identified domain/topic areas' })
  @IsArray()
  @IsString({ each: true })
  domain_indicators: string[];

  @ApiProperty({ description: 'Confidence scores for each specialist agent' })
  confidence_scores: Record<string, number>;

  @ApiProperty({ description: 'Selected agent based on analysis' })
  @IsString()
  selected_agent: string;

  @ApiProperty({ description: 'Reasoning for the routing decision' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Context influence on routing decision' })
  @IsNumber()
  context_influence: number;
}

export class AgentSpecializationDto {
  @ApiProperty({ description: 'Unique identifier for the specialist agent' })
  @IsString()
  agent_id: string;

  @ApiProperty({ description: 'Human-readable name of the specialist' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of agent capabilities' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Primary domains this agent handles' })
  @IsArray()
  @IsString({ each: true })
  domains: string[];

  @ApiProperty({ description: 'Keywords that trigger this agent' })
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({ description: 'Confidence threshold for routing' })
  @IsNumber()
  confidence_threshold: number;

  @ApiProperty({ description: 'Whether this agent is currently active' })
  @IsBoolean()
  is_active: boolean;
}

export class OrchestratorResponseDto {
  @ApiProperty({ description: 'Session identifier' })
  @IsString()
  session_id: string;

  @ApiProperty({ description: 'Response from the selected specialist agent' })
  @IsString()
  response: string;

  @ApiProperty({ description: 'ID of the agent that handled the request' })
  @IsString()
  handling_agent: string;

  @ApiProperty({ description: 'Name of the handling agent' })
  @IsString()
  agent_name: string;

  @ApiProperty({ description: 'Analysis of the routing decision' })
  @ValidateNested()
  @Type(() => QueryAnalysisDto)
  routing_analysis: QueryAnalysisDto;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  @IsNumber()
  processing_time_ms: number;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: Date;
}

export class OrchestratorStatusDto {
  @ApiProperty({ description: 'Whether the orchestrator is operational' })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ description: 'List of available specialist agents' })
  @ValidateNested({ each: true })
  @Type(() => AgentSpecializationDto)
  @IsArray()
  available_agents: AgentSpecializationDto[];

  @ApiProperty({ description: 'Number of active sessions' })
  @IsNumber()
  active_sessions: number;

  @ApiProperty({ description: 'Total queries processed' })
  @IsNumber()
  total_queries_processed: number;

  @ApiProperty({ description: 'System uptime in seconds' })
  @IsNumber()
  uptime_seconds: number;

  @ApiProperty({ description: 'Current version of the orchestrator' })
  @IsString()
  version: string;
}

export class ConversationContextDto {
  @ApiProperty({ description: 'Session identifier' })
  @IsString()
  session_id: string;

  @ApiProperty({ description: 'Current conversation topic' })
  @IsOptional()
  @IsString()
  current_topic?: string;

  @ApiProperty({ description: 'Previously used agents in this session' })
  @IsArray()
  @IsString({ each: true })
  agent_history: string[];

  @ApiProperty({ description: 'Number of messages in the conversation' })
  @IsNumber()
  message_count: number;

  @ApiProperty({ description: 'Session start time' })
  start_time: Date;

  @ApiProperty({ description: 'Last activity timestamp' })
  last_activity: Date;
}

export class RoutingDecisionDto {
  @ApiProperty({ description: 'The chosen specialist agent' })
  @IsString()
  selected_agent: string;

  @ApiProperty({ description: 'Confidence score for this decision' })
  @IsNumber()
  confidence_score: number;

  @ApiProperty({ description: 'Alternative agents considered' })
  alternatives: Array<{
    agent: string;
    score: number;
    reasoning: string;
  }>;

  @ApiProperty({ description: 'Factors that influenced the decision' })
  decision_factors: {
    keyword_match: number;
    domain_relevance: number;
    context_continuity: number;
    agent_availability: number;
  };

  @ApiProperty({ description: 'Explanation of why this agent was chosen' })
  @IsString()
  explanation: string;
}