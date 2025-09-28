import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ClassificationService } from './classification.service';
import { BedrockService } from '../agent/bedrock.service';
import { QueryAnalysis } from '../orchestrator/types/orchestrator.types';

describe('ClassificationService Live Tests', () => {
  let service: ClassificationService;
  let bedrockService: BedrockService;
  
  // Increase timeout for real API calls
  jest.setTimeout(30000);
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
      ],
      providers: [
        ClassificationService,
        BedrockService,
      ],
    }).compile();
    
    service = module.get<ClassificationService>(ClassificationService);
    bedrockService = module.get<BedrockService>(BedrockService);
  });
  
  describe('Real AWS Bedrock Classification Tests', () => {
    it('should correctly classify a business query', async () => {
      const query = 'Create a 6-week MVP plan with milestones, owners, risks, and assumptions for a payments product.';
      
      try {
        const result = await service.classifyQuery(query);
        console.log('Business query classification result:', result);
        
        expect(result).toBeDefined();
        expect(result.selected_agent).toBeDefined();
        expect(result.confidence_scores).toBeDefined();
      } catch (error) {
        console.error('Test failed with error:', error.message);
        throw error;
      }
    });
    
    it('should correctly classify a technical query', async () => {
      const query = 'Write a Dockerfile for Node.js 20 with pnpm and multi-stage builds.';
      
      try {
        const result = await service.classifyQuery(query);
        console.log('Technical query classification result:', result);
        
        expect(result).toBeDefined();
        expect(result.selected_agent).toBeDefined();
        expect(result.confidence_scores).toBeDefined();
      } catch (error) {
        console.error('Test failed with error:', error.message);
        throw error;
      }
    });
    
    it('should correctly classify a data science query', async () => {
      const query = 'Gradient boosting vs. random forests: when to use each for an imbalanced dataset targeting AUC?';
      
      try {
        const result = await service.classifyQuery(query);
        console.log('Data science query classification result:', result);
        
        expect(result).toBeDefined();
        expect(result.selected_agent).toBeDefined();
        expect(result.confidence_scores).toBeDefined();
      } catch (error) {
        console.error('Test failed with error:', error.message);
        throw error;
      }
    });
  });
});