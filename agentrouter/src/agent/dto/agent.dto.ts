import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    description: 'The message to send to the agent',
    example: 'What is the weather like today?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Optional session ID to continue a conversation',
    example: 'session-1234567890-abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class StartSessionDto {
  @ApiProperty({
    description: 'Optional initial message to start the conversation',
    example: 'Hello, I need help with...',
    required: false,
  })
  @IsString()
  @IsOptional()
  initialMessage?: string;
}

export class AgentResponseDto {
  @ApiProperty({
    description: 'The session ID for this conversation',
    example: 'session-1234567890-abc123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'The agent response',
    example: 'Hello! How can I help you today?',
  })
  response: string;

  @ApiProperty({
    description: 'Content type of the response',
    example: 'text/plain',
  })
  contentType: string;
}