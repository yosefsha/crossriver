import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './services/orchestrator.service';
import { QueryAnalysisService } from './services/query-analysis.service';
import { ConfidenceScoringService } from './services/confidence-scoring.service';
import { SessionManagementService } from './services/session-management.service';
import { BedrockService } from './services/bedrock.service';

/**
 * OrchestratorModule - Main module for the multi-agent orchestration system
 * 
 * This module provides:
 * 1. REST API endpoints for orchestrated conversations
 * 2. Modular services for query analysis, routing, and session management
 * 3. Integration with AWS Bedrock for specialist agent responses
 * 4. Runtime system prompt generation for authentic specialization
 */
@Module({
  controllers: [OrchestratorController],
  providers: [
    // Core orchestration service
    OrchestratorService,
    
    // Specialized analysis services
    QueryAnalysisService,
    ConfidenceScoringService,
    SessionManagementService,
    
    // External integration services
    BedrockService
  ],
  exports: [
    // Export main service for use in other modules
    OrchestratorService,
    SessionManagementService
  ]
})
export class OrchestratorModule {}