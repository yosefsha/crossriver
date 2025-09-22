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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentResponseDto = exports.StartSessionDto = exports.ChatMessageDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ChatMessageDto {
}
exports.ChatMessageDto = ChatMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The message to send to the agent',
        example: 'What is the weather like today?',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional session ID to continue a conversation',
        example: 'session-1234567890-abc123',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "sessionId", void 0);
class StartSessionDto {
}
exports.StartSessionDto = StartSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional initial message to start the conversation',
        example: 'Hello, I need help with...',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StartSessionDto.prototype, "initialMessage", void 0);
class AgentResponseDto {
}
exports.AgentResponseDto = AgentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The session ID for this conversation',
        example: 'session-1234567890-abc123',
    }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The agent response',
        example: 'Hello! How can I help you today?',
    }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "response", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Content type of the response',
        example: 'text/plain',
    }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "contentType", void 0);
//# sourceMappingURL=agent.dto.js.map