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
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const bedrock_service_1 = require("./bedrock.service");
let AgentService = AgentService_1 = class AgentService {
    constructor(bedrockService) {
        this.bedrockService = bedrockService;
        this.logger = new common_1.Logger(AgentService_1.name);
    }
    async getAllAgents() {
        this.logger.log('Fetching all available agents');
        return await this.bedrockService.listAgents();
    }
    async getAgentById(agentId) {
        this.logger.log(`Fetching agent details for: ${agentId}`);
        return await this.bedrockService.getAgent(agentId);
    }
    async chatWithAgent(agentId, agentAliasId, message, sessionId) {
        this.logger.log(`Starting chat with agent ${agentId}`);
        if (!message || message.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        return await this.bedrockService.invokeAgent(agentId, agentAliasId, message, sessionId);
    }
    async startNewSession(agentId, agentAliasId, initialMessage) {
        this.logger.log(`Starting new session with agent ${agentId}`);
        const welcomeMessage = initialMessage || 'Hello, how can you help me today?';
        return await this.chatWithAgent(agentId, agentAliasId, welcomeMessage);
    }
    async continueConversation(agentId, agentAliasId, sessionId, message) {
        this.logger.log(`Continuing conversation in session ${sessionId}`);
        return await this.chatWithAgent(agentId, agentAliasId, message, sessionId);
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bedrock_service_1.BedrockService])
], AgentService);
//# sourceMappingURL=agent.service.js.map