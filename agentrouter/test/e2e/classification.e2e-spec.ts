import { Test, TestingModule } from '@nestjs/testing';
import { ClassificationService } from '../../src/classification/classification.service';
import { BedrockService } from '../../src/agent/bedrock.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';

describe('ClassificationService - Real API Calls', () => {
  let service: ClassificationService;
  let bedrockService: BedrockService;
  
  // Increase the test timeout to 30 seconds to allow for real API calls
  jest.setTimeout(30000);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        ClassificationService,
        BedrockService,
        ConfigService,
      ],
    }).compile();

    service = module.get<ClassificationService>(ClassificationService);
    bedrockService = module.get<BedrockService>(BedrockService);
  });

  describe('classifyQuery', () => {
    it('should correctly classify a business query', async () => {
      const query = 'Create a 6-week MVP plan with milestones, owners, risks, and assumptions for a payments product.';
      
      const result = await service.classifyQuery(query);
      
      console.log('Classification result for business query:', JSON.stringify(result, null, 2));
      
      expect(result).toBeDefined();
      expect(result.selected_agent).toBeDefined();
      expect(result.confidence_scores).toBeDefined();
      expect(result.original_query).toBe(query);
    });

    it('should correctly classify a technical query', async () => {
      const query = 'Write a Dockerfile for Node.js 20 with pnpm and multi-stage builds.';
      
      const result = await service.classifyQuery(query);
      
      console.log('Classification result for technical query:', JSON.stringify(result, null, 2));
      
      expect(result).toBeDefined();
      expect(result.selected_agent).toBeDefined();
      expect(result.confidence_scores).toBeDefined();
    });

    it('should correctly classify a data science query', async () => {
      const query = 'Gradient boosting vs. random forests: when to use each for an imbalanced dataset targeting AUC?';
      
      const result = await service.classifyQuery(query);
      
      console.log('Classification result for data science query:', JSON.stringify(result, null, 2));
      
      expect(result).toBeDefined();
      expect(result.selected_agent).toBeDefined();
      expect(result.confidence_scores).toBeDefined();
    });

    it('should correctly classify a finance query', async () => {
      const query = 'Build a simple DCF for a SaaS with $5M ARR, 80% gross margin, 20% growth, 10% WACC, 2% terminal.';
      
      const result = await service.classifyQuery(query);
      
      console.log('Classification result for finance query:', JSON.stringify(result, null, 2));
      
      expect(result).toBeDefined();
      expect(result.selected_agent).toBeDefined();
      expect(result.confidence_scores).toBeDefined();
    });
  });
});