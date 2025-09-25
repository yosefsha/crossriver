"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorController = void 0;
const common_1 = require("@nestjs/common");
const orchestrator_service_1 = require("./orchestrator.service");
let OrchestratorController = class OrchestratorController {
    constructor(orchestratorService) {
        this.orchestratorService = orchestratorService;
    }
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
    async getAgents() {
        const status = await this.getStatus();
        return {
            agents: status.available_agents,
            total_count: status.available_agents.length,
            active_sessions: status.active_sessions
        };
    }
    async startSession(body) {
        if (!body.message || body.message.trim().length === 0) {
            throw new Error('Message is required');
        }
        const sessionId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const orchestrationResponse = await this.orchestratorService.orchestrateQuery(body.message, sessionId);
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
    async processQuery(body) {
        if (!body.message || body.message.trim().length === 0) {
            throw new Error('Message is required');
        }
        if (!body.sessionId) {
            throw new Error('Session ID is required');
        }
        const orchestrationResponse = await this.orchestratorService.orchestrateQuery(body.message, body.sessionId);
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
    async getSessionStats(sessionId) {
        if (!sessionId) {
            throw new Error('Session not found');
        }
        return {
            session_id: sessionId,
            messageCount: 1,
            agentSwitches: 0,
            sessionDuration: 60000,
            mostUsedAgent: 'technical-specialist',
            lastActivity: new Date().toISOString()
        };
    }
    async clearSession(sessionId) {
        return {
            success: true,
            message: `Session ${sessionId} cleared successfully`
        };
    }
    async getHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: 'orchestrator'
        };
    }
    extractKeywords(message) {
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
    analyzeIntent(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('how do')) {
            return 'help_request';
        }
        else if (lowerMessage.includes('create') || lowerMessage.includes('build') || lowerMessage.includes('make')) {
            return 'creation_request';
        }
        else if (lowerMessage.includes('analyze') || lowerMessage.includes('analyze') || lowerMessage.includes('review')) {
            return 'analysis_request';
        }
        else if (lowerMessage.includes('learn') || lowerMessage.includes('explain') || lowerMessage.includes('understand')) {
            return 'learning_request';
        }
        else if (lowerMessage.includes('fix') || lowerMessage.includes('debug') || lowerMessage.includes('troubleshoot')) {
            return 'troubleshooting';
        }
        else if (lowerMessage.includes('optimize') || lowerMessage.includes('improve') || lowerMessage.includes('enhance')) {
            return 'optimization_request';
        }
        else if (lowerMessage.includes('plan') || lowerMessage.includes('strategy') || lowerMessage.includes('roadmap')) {
            return 'planning_request';
        }
        else if (lowerMessage.includes('compare') || lowerMessage.includes('versus') || lowerMessage.includes('vs')) {
            return 'comparison_request';
        }
        else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('advise')) {
            return 'recommendation_request';
        }
        else {
            return 'general_inquiry';
        }
    }
};
exports.OrchestratorController = OrchestratorController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('agents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Post)('session/start'),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('query'),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "processQuery", null);
__decorate([
    (0, common_1.Get)('session/:sessionId/stats'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getSessionStats", null);
__decorate([
    (0, common_1.Delete)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "clearSession", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getHealth", null);
exports.OrchestratorController = OrchestratorController = __decorate([
    (0, common_1.Controller)('orchestrator'),
    __metadata("design:paramtypes", [orchestrator_service_1.OrchestratorService])
], OrchestratorController);
//# sourceMappingURL=orchestrator.controller.js.map