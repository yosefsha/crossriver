import { Test, TestingModule } from '@nestjs/testing';
import { ClassificationService } from './classification.service';
import { BedrockService } from '../agent/bedrock.service';
import { ConfigService } from '@nestjs/config';

describe('ClassificationService', () => {
  let service: ClassificationService;
  let bedrockService: BedrockService;
  
  const mockBedrockService = {
    invokeAgent: jest.fn()
  };
  
  const mockConfigService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassificationService,
        { provide: BedrockService, useValue: mockBedrockService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ClassificationService>(ClassificationService);
    bedrockService = module.get<BedrockService>(BedrockService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('classifyQuery', () => {
    it('should correctly classify a business query', async () => {
      // Mock the response from Bedrock
      mockBedrockService.invokeAgent.mockResolvedValue({
        response: `{ "needs_clarification": false, "question": "", "proposed_default": "Business plan analysis", "target_specialist": "business", "routing_confidence": 0.85, "rationale": "Query explicitly requests a business plan with milestones, risks and assumptions" }`,
        sessionId: 'test-session',
        contentType: 'text/plain'
      });

      const query = 'Create a 6-week MVP plan with milestones, owners, risks, and assumptions for a payments product.';
      const result = await service.classifyQuery(query);

      expect(bedrockService.invokeAgent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        query,
        expect.any(String)
      );
      
      expect(result.selected_agent).toBe('business-analyst');
      expect(result.confidence_scores['business-analyst']).toBeGreaterThan(0.8);
      expect(result.original_query).toBe(query);
    });

    it('should correctly classify a technical query', async () => {
      // Mock the response from Bedrock
      mockBedrockService.invokeAgent.mockResolvedValue({
        response: `{ "needs_clarification": false, "question": "", "proposed_default": "Technical implementation", "target_specialist": "technical", "routing_confidence": 0.9, "rationale": "Query requests specific technical implementation details" }`,
        sessionId: 'test-session',
        contentType: 'text/plain'
      });

      const query = 'Write a Dockerfile for Node.js 20 with pnpm and multi-stage builds.';
      const result = await service.classifyQuery(query);

      expect(result.selected_agent).toBe('technical-specialist');
      expect(result.confidence_scores['technical-specialist']).toBeGreaterThan(0.8);
    });

    it('should handle errors and throw when Bedrock service fails', async () => {
      // Mock a failed response
      mockBedrockService.invokeAgent.mockRejectedValue(new Error('Bedrock service unavailable'));

      const query = 'Some query';
      
      await expect(service.classifyQuery(query)).rejects.toThrow('Classification error');
    });

    it('should handle cases when invalid JSON is in the response', async () => {
      // Mock a response with invalid JSON
      mockBedrockService.invokeAgent.mockResolvedValue({
        response: 'This is a response without valid JSON data',
        sessionId: 'test-session',
        contentType: 'text/plain'
      });

      const query = 'Some query';
      
      await expect(service.classifyQuery(query)).rejects.toThrow('Invalid classification response format');
    });
    
    it('should handle cases when JSON is missing required fields', async () => {
      // Mock a response with incomplete JSON
      mockBedrockService.invokeAgent.mockResolvedValue({
        response: '{ "needs_clarification": true, "question": "Some question?" }',
        sessionId: 'test-session',
        contentType: 'text/plain'
      });

      const query = 'Some query';
      
      await expect(service.classifyQuery(query)).rejects.toThrow('Invalid classification data format');
    });
  });
});