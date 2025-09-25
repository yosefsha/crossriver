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
var BedrockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockService = void 0;
const common_1 = require("@nestjs/common");
const client_bedrock_agent_1 = require("@aws-sdk/client-bedrock-agent");
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const config_1 = require("@nestjs/config");
let BedrockService = BedrockService_1 = class BedrockService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(BedrockService_1.name);
        const region = this.configService.get('AWS_REGION', 'us-east-1');
        this.agentClient = new client_bedrock_agent_1.BedrockAgentClient({
            region,
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
                sessionToken: this.configService.get('AWS_SESSION_TOKEN'),
            },
        });
        this.agentRuntimeClient = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
            region,
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
                sessionToken: this.configService.get('AWS_SESSION_TOKEN'),
            },
        });
        this.logger.log(`Bedrock service initialized for region: ${region}`);
    }
    async listAgents() {
        try {
            const command = new client_bedrock_agent_1.ListAgentsCommand({});
            const response = await this.agentClient.send(command);
            this.logger.log('Full response structure:', JSON.stringify(response, null, 2));
            this.logger.log('Agent summaries type:', typeof response.agentSummaries);
            this.logger.log('Agent summaries length:', response.agentSummaries?.length || 0);
            if (response.agentSummaries && response.agentSummaries.length > 0) {
                this.logger.log('First agent structure:', JSON.stringify(response.agentSummaries[0], null, 2));
            }
            return response.agentSummaries || [];
        }
        catch (error) {
            this.logger.error('Failed to list agents:', error);
            throw new Error(`Failed to list agents: ${error.message}`);
        }
    }
    async getAgent(agentId) {
        try {
            const command = new client_bedrock_agent_1.GetAgentCommand({ agentId });
            const response = await this.agentClient.send(command);
            this.logger.log(`Retrieved agent details for: ${agentId}`);
            return response.agent;
        }
        catch (error) {
            this.logger.error(`Failed to get agent ${agentId}:`, error);
            throw new Error(`Failed to get agent: ${error.message}`);
        }
    }
    async invokeAgent(agentId, agentAliasId, prompt, sessionId) {
        try {
            const command = new client_bedrock_agent_runtime_1.InvokeAgentCommand({
                agentId,
                agentAliasId,
                sessionId: sessionId || this.generateSessionId(),
                inputText: prompt,
            });
            const response = await this.agentRuntimeClient.send(command);
            this.logger.log(`Agent ${agentId} invoked successfully`);
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
        }
        catch (error) {
            this.logger.error(`Failed to invoke agent ${agentId}:`, error);
            throw new Error(`Failed to invoke agent: ${error.message}`);
        }
    }
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.BedrockService = BedrockService;
exports.BedrockService = BedrockService = BedrockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BedrockService);
//# sourceMappingURL=bedrock.service.js.map