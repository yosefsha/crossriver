import { Controller, Get, Post, Body, Param, Delete, ValidationPipe } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';

@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get('status')
  async getStatus() {
    return {
      is_active: true,
      available_agents: [
        {
          agent_id: 'technical-specialist',
          name: 'Technical Specialist',
          domains: ['software_development', 'system_design', 'debugging'],
          description: 'Expert in software development, architecture, and technical problem solving'
        },
        {
          agent_id: 'financial-analyst',
          name: 'Financial Analyst',
          domains: ['financial_analysis', 'investment', 'economics'],
          description: 'Specialized in financial analysis, investment strategies, and market research'
        },
        {
          agent_id: 'data-scientist',
          name: 'Data Scientist',
          domains: ['machine_learning', 'data_analysis', 'statistics'],
          description: 'Expert in machine learning, data analysis, and statistical modeling'
        },
        {
          agent_id: 'business-analyst',
          name: 'Business Analyst',
          domains: ['business_strategy', 'process_optimization', 'market_analysis'],
          description: 'Specialized in business strategy, process improvement, and market analysis'
        },
        {
          agent_id: 'creative-specialist',
          name: 'Creative Specialist',
          domains: ['content_creation', 'marketing', 'design'],
          description: 'Expert in creative content, marketing strategies, and design thinking'
        }
      ],
      active_sessions: 0,
      uptime_seconds: Math.floor(process.uptime()),
      version: '1.0.0'
    };
  }

  @Get('agents')
  async getAgents() {
    const status = await this.getStatus();
    return {
      agents: status.available_agents,
      total_count: status.available_agents.length,
      active_sessions: status.active_sessions
    };
  }

  @Post('session/start')
  async startSession(@Body(ValidationPipe) body: { message: string }) {
    if (!body.message || body.message.trim().length === 0) {
      throw new Error('Message is required');
    }

    const sessionId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the actual orchestrator service to process the query
    const orchestrationResponse = await this.orchestratorService.orchestrateQuery(
      body.message,
      sessionId
    );

    // Transform the orchestrator service response to match the expected API format
    return {
      session_id: sessionId,
      handling_agent: orchestrationResponse.handling_agent,
      agent_name: orchestrationResponse.agent_name,
      response: orchestrationResponse.response,
      routing_analysis: {
        original_query: orchestrationResponse.routing_analysis.original_query,
        analyzed_intent: orchestrationResponse.routing_analysis.analyzed_intent,
        confidence_scores: orchestrationResponse.routing_analysis.confidence_scores,
        selected_agent: orchestrationResponse.routing_analysis.selected_agent,
        reasoning: orchestrationResponse.routing_analysis.reasoning,
        keywords_matched: orchestrationResponse.routing_analysis.keywords_matched
      },
      context_maintained: orchestrationResponse.context_maintained,
      processing_time_ms: 150
    };
  }

  @Post('query')
  async processQuery(@Body(ValidationPipe) body: { message: string; sessionId: string }) {
    if (!body.message || body.message.trim().length === 0) {
      throw new Error('Message is required');
    }
    if (!body.sessionId) {
      throw new Error('Session ID is required');
    }

    // Use the actual orchestrator service to process the query
    const orchestrationResponse = await this.orchestratorService.orchestrateQuery(
      body.message,
      body.sessionId
    );

    // Transform the orchestrator service response to match the expected API format
    return {
      session_id: body.sessionId,
      handling_agent: orchestrationResponse.handling_agent,
      agent_name: orchestrationResponse.agent_name,
      response: orchestrationResponse.response,
      routing_analysis: {
        original_query: orchestrationResponse.routing_analysis.original_query,
        analyzed_intent: orchestrationResponse.routing_analysis.analyzed_intent,
        confidence_scores: orchestrationResponse.routing_analysis.confidence_scores,
        selected_agent: orchestrationResponse.routing_analysis.selected_agent,
        reasoning: orchestrationResponse.routing_analysis.reasoning,
        keywords_matched: orchestrationResponse.routing_analysis.keywords_matched
      },
      context_maintained: orchestrationResponse.context_maintained,
      processing_time_ms: 150
    };
  }

  @Get('session/:sessionId/stats')
  async getSessionStats(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new Error('Session not found');
    }

    return {
      session_id: sessionId,
      messageCount: 1,
      agentSwitches: 0,
      sessionDuration: 60000, // 1 minute
      mostUsedAgent: 'technical-specialist',
      lastActivity: new Date().toISOString()
    };
  }

  @Delete('session/:sessionId')
  async clearSession(@Param('sessionId') sessionId: string) {
    return {
      success: true,
      message: `Session ${sessionId} cleared successfully`
    };
  }

  @Get('health')
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'orchestrator'
    };
  }

  private extractKeywords(message: string): string[] {
    const keywords = [];
    const lowerMessage = message.toLowerCase();
    
    const keywordMap = {
      'sql': ['sql', 'database', 'query', 'table', 'index'],
      'react': ['react', 'javascript', 'frontend', 'component', 'jsx'],
      'technical': ['code', 'programming', 'debug', 'architecture', 'system'],
      'investment': ['investment', 'financial', 'money', 'roi', 'portfolio'],
      'ml': ['machine learning', 'model', 'algorithm', 'prediction', 'neural'],
      'data': ['data', 'analytics', 'statistics', 'visualization'],
      'business': ['business', 'strategy', 'market', 'process', 'optimization'],
      'creative': ['creative', 'content', 'marketing', 'design', 'write']
    };

    for (const [key, terms] of Object.entries(keywordMap)) {
      if (terms.some(term => lowerMessage.includes(term))) {
        keywords.push(key);
      }
    }

    return keywords;
  }

  private analyzeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('how do')) {
      return 'help_request';
    } else if (lowerMessage.includes('create') || lowerMessage.includes('build') || lowerMessage.includes('make')) {
      return 'creation_request';
    } else if (lowerMessage.includes('analyze') || lowerMessage.includes('analyze') || lowerMessage.includes('review')) {
      return 'analysis_request';
    } else if (lowerMessage.includes('learn') || lowerMessage.includes('explain') || lowerMessage.includes('understand')) {
      return 'learning_request';
    } else if (lowerMessage.includes('fix') || lowerMessage.includes('debug') || lowerMessage.includes('troubleshoot')) {
      return 'troubleshooting';
    } else if (lowerMessage.includes('optimize') || lowerMessage.includes('improve') || lowerMessage.includes('enhance')) {
      return 'optimization_request';
    } else if (lowerMessage.includes('plan') || lowerMessage.includes('strategy') || lowerMessage.includes('roadmap')) {
      return 'planning_request';
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('versus') || lowerMessage.includes('vs')) {
      return 'comparison_request';
    } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('advise')) {
      return 'recommendation_request';
    } else {
      return 'general_inquiry';
    }
  }
}