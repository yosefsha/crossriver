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
var AgentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_service_1 = require("./agent.service");
const agent_dto_1 = require("./dto/agent.dto");
let AgentController = AgentController_1 = class AgentController {
    constructor(agentService) {
        this.agentService = agentService;
        this.logger = new common_1.Logger(AgentController_1.name);
    }
    async getAllAgents() {
        try {
            return await this.agentService.getAllAgents();
        }
        catch (error) {
            this.logger.error('Failed to get agents:', error);
            throw new common_1.HttpException('Failed to retrieve agents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgent(agentId) {
        try {
            return await this.agentService.getAgentById(agentId);
        }
        catch (error) {
            this.logger.error(`Failed to get agent ${agentId}:`, error);
            throw new common_1.HttpException('Failed to retrieve agent details', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async startSession(agentId, agentAliasId, startSessionDto) {
        try {
            return await this.agentService.startNewSession(agentId, agentAliasId, startSessionDto.initialMessage);
        }
        catch (error) {
            this.logger.error(`Failed to start session with agent ${agentId}:`, error);
            throw new common_1.HttpException('Failed to start conversation session', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async chatWithAgent(agentId, agentAliasId, chatMessageDto) {
        try {
            if (chatMessageDto.sessionId) {
                return await this.agentService.continueConversation(agentId, agentAliasId, chatMessageDto.sessionId, chatMessageDto.message);
            }
            else {
                return await this.agentService.chatWithAgent(agentId, agentAliasId, chatMessageDto.message);
            }
        }
        catch (error) {
            this.logger.error(`Failed to chat with agent ${agentId}:`, error);
            throw new common_1.HttpException('Failed to send message to agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all available Bedrock agents' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of agents retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAllAgents", null);
__decorate([
    (0, common_1.Get)(':agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The agent ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent details retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgent", null);
__decorate([
    (0, common_1.Post)(':agentId/:agentAliasId/start-session'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new conversation session with an agent' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The agent ID' }),
    (0, swagger_1.ApiParam)({ name: 'agentAliasId', description: 'The agent alias ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Session started successfully',
        type: agent_dto_1.AgentResponseDto
    }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Param)('agentAliasId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, agent_dto_1.StartSessionDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)(':agentId/:agentAliasId/chat'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message to an agent' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The agent ID' }),
    (0, swagger_1.ApiParam)({ name: 'agentAliasId', description: 'The agent alias ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message sent successfully',
        type: agent_dto_1.AgentResponseDto
    }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Param)('agentAliasId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, agent_dto_1.ChatMessageDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "chatWithAgent", null);
exports.AgentController = AgentController = AgentController_1 = __decorate([
    (0, swagger_1.ApiTags)('Bedrock Agents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [agent_service_1.AgentService])
], AgentController);
//# sourceMappingURL=agent.controller.js.map