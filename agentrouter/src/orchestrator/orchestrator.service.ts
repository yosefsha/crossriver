import { Injectable, Logger } from '@nestjs/common';
import { BedrockService } from '../agent/bedrock.service';
import { ClassificationService } from '../classification/classification.service';
import { ORCHESTRATOR_CONFIG } from './config/orchestrator.config';
import { 
  QueryAnalysis, 
  OrchestrationContext, 
  OrchestrationResponse,
  AgentSpecialization,
  StatusResponse
} from './types/orchestrator.types';

/**
 * OrchestratorService - The brain of the multi-agent system
 * 
 * This service acts as an intelligent router that:
 * 1. Analyzes incoming user queries to understand intent and domain using ClassificationService
 * 2. Scores each specialized agent based on relevance to the query
 * 3. Routes queries to the most appropriate specialized agent
 * 4. Maintains conversation context across multiple exchanges
 * 5. Provides explainable reasoning for all routing decisions
 * 
 * The orchestration process reduces hallucinations by ensuring queries
 * are handled by agents specifically trained for their domain.
 */
@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly config = ORCHESTRATOR_CONFIG;

  constructor(
    private readonly bedrockService: BedrockService,
    private readonly classificationService: ClassificationService
  ) {}

  /**
   * Get the status of the orchestrator service
   * @returns StatusResponse with service information
   */
  async getStatus(): Promise<StatusResponse> {
    this.logger.log('Status endpoint called');
    
    const availableAgents = this.config.specialized_agents.map(agent => ({
      agent_id: agent.id,
      name: agent.name,
      domains: agent.domains,
      description: agent.description
    }));

    return {
      is_active: true,
      available_agents: availableAgents,
      active_sessions: 0,
      uptime_seconds: Math.floor(process.uptime()),
      version: '1.0.0'
    };
  }

  /**
   * Main orchestration method - the entry point for all user queries
   * 
   * @param query - The user's question or request
   * @param sessionId - Unique session identifier for context tracking
   * @param context - Optional conversation history and state (now auto-managed)
   * @returns Promise<OrchestrationResponse> - Complete response with routing metadata
   */
  async orchestrateQuery(
    query: string, 
    sessionId: string, 
    context?: OrchestrationContext
  ): Promise<OrchestrationResponse> {
    this.logger.log(`🎯 Orchestrating query: "${query}" for session: ${sessionId}`);

    try {
      // STEP 1: CONTEXT MANAGEMENT
      // Get or create conversation context for this session
      const managedContext = await this.getOrCreateContext(sessionId, query);
      
      // Use provided context if available, otherwise use managed context
      const activeContext = context || managedContext;

      // STEP 2: QUERY ANALYSIS
      // Analyze the query to determine the best specialized agent
      // This involves keyword matching, domain scoring, and context analysis
      const analysis = await this.analyzeQuery(query, activeContext);
      
      this.logger.log(`📊 Query analysis completed. Selected agent: ${analysis.selected_agent}`);
      this.logger.log(`📈 Confidence scores: ${JSON.stringify(analysis.confidence_scores)}`);

      // STEP 3: AGENT LOOKUP AND HANDLING
      // Find the configuration for the selected agent (including general-assistant)
      const selectedAgent = this.config.specialized_agents.find(
        agent => agent.id === analysis.selected_agent
      );

      if (!selectedAgent) {
        throw new Error(`Selected agent ${analysis.selected_agent} not found in configuration`);
      }

      // STEP 4: CONTEXT-AWARE AGENT INVOCATION
      // Invoke the selected specialized agent with enhanced context
      const agentResponse = await this.invokeSpecializedAgentWithContext(
        selectedAgent,
        query,
        sessionId,
        analysis,
        activeContext
      );

      // STEP 5: RESPONSE PACKAGING
      // Package the response with full routing metadata for transparency
      const orchestrationResponse: OrchestrationResponse = {
        response: agentResponse.response,
        handling_agent: selectedAgent.id,
        agent_name: selectedAgent.name,
        routing_analysis: analysis,
        session_id: sessionId,
        context_maintained: true
      };

      // STEP 6: CONTEXT UPDATE
      // Update the conversation context with this exchange
      await this.updateConversationContext(sessionId, query, orchestrationResponse);

      this.logger.log(`✅ Orchestration completed successfully for agent: ${selectedAgent.name}`);
      return orchestrationResponse;

    } catch (error) {
      this.logger.error(`❌ Orchestration failed for query: ${query}`, error);
      
      // FALLBACK STRATEGY
      // If routing fails, try to use a fallback agent rather than failing completely
      if (this.config.fallback_agent_id) {
        return this.handleFallback(query, sessionId, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Query Analysis Engine - The core intelligence of the orchestrator
   * 
   * This method implements a multi-factor scoring algorithm that considers:
   * - Keyword relevance (60% weight) - Direct keyword matches in the query
   * - Domain patterns (20% weight) - Broader domain-specific language patterns  
   * - Context continuity (20% weight) - Preference for continuing with current agent
   * 
   * @param query - The user's query text
   * @param context - Optional conversation context for continuity scoring
   * @returns Promise<QueryAnalysis> - Detailed analysis with scores and reasoning
   */
  private async analyzeQuery(
    query: string, 
    context?: OrchestrationContext
  ): Promise<QueryAnalysis> {
    try {
      // STEP 1: Try the dedicated classification agent first
      this.logger.log(`Using ClassificationService to analyze query: "${query}"`);
      return await this.classificationService.classifyQuery(query);
    } catch (error) {
      // STEP 2: Fall back to local classification if the classification agent fails
      this.logger.warn(`Classification agent failed: ${error.message}. Falling back to local classification.`);
      return this.fallbackLocalClassification(query, context);
    }
  }
  
  /**
   * Fallback to local classification when the classification agent is unavailable
   * This preserves the original keyword/domain-based classification logic
   */
  private fallbackLocalClassification(query: string, context?: OrchestrationContext): QueryAnalysis {
    const queryLower = query.toLowerCase();
    const confidenceScores: { [agentId: string]: number } = {};

    // MULTI-AGENT SCORING
    // Calculate confidence scores for each specialized agent
    // Higher scores indicate better fit for handling the query
    for (const agent of this.config.specialized_agents) {
      confidenceScores[agent.id] = this.calculateAgentConfidence(queryLower, agent, context);
    }

    // WINNER SELECTION
    // Find the agent with the highest confidence score
    const selectedAgent = Object.entries(confidenceScores)
      .reduce((best, [agentId, score]) => 
        score > best.score ? { agentId, score } : best, 
        { agentId: '', score: 0 }
      );

    // THRESHOLD VALIDATION
    // Ensure the winning agent meets the minimum confidence threshold
    // This prevents routing to agents that aren't truly suitable
    const bestAgent = this.config.specialized_agents.find(a => a.id === selectedAgent.agentId);
    const meetsThreshold = selectedAgent.score >= (bestAgent?.confidence_threshold || 0.5);

    // ANALYSIS RESULT PACKAGING
    const analysis: QueryAnalysis = {
      original_query: query,
      analyzed_intent: this.extractIntent(queryLower, context),
      confidence_scores: confidenceScores,
      selected_agent: meetsThreshold ? selectedAgent.agentId : (this.config.fallback_agent_id || 'general-assistant'),
      reasoning: this.generateReasoningExplanation(selectedAgent, confidenceScores, meetsThreshold),
      keywords_matched: this.extractMatchedKeywords(queryLower, bestAgent)
    };

    return analysis;
  }

  /**
   * Multi-Factor Confidence Scoring Algorithm
   * 
   * This algorithm combines three factors to determine how well-suited
   * an agent is for handling a particular query:
   * 
   * 1. Keyword Matching (60%) - Direct matches with agent's keyword list
   * 2. Domain Relevance (20%) - Broader domain pattern recognition
   * 3. Context Continuity (20%) - Bonus for continuing with current agent
   * 
   * @param queryLower - Normalized query text (lowercase)
   * @param agent - Agent specialization configuration
   * @param context - Optional conversation context
   * @returns number - Confidence score (0.0 to 1.0+)
   */
  private calculateAgentConfidence(
    queryLower: string, 
    agent: AgentSpecialization,
    context?: OrchestrationContext
  ): number {
    let score = 0;
    
    // SCORING WEIGHTS
    // These weights determine the relative importance of each factor
    const weights = {
      keywords: 0.6,    // Primary factor - direct keyword relevance
      domains: 0.2,     // Secondary factor - domain pattern matching
      context: 0.2      // Tertiary factor - conversation continuity
    };

    // FACTOR 1: KEYWORD MATCHING (60% of total score)
    // Count how many of the agent's keywords appear in the query
    const keywordMatches = agent.keywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
    const keywordScore = Math.min(keywordMatches.length / 3, 1); // Normalize to 0-1, diminishing returns after 3 matches
    score += keywordScore * weights.keywords;

    // FACTOR 2: DOMAIN RELEVANCE (20% of total score)
    // Look for broader domain-specific language patterns
    const domainScore = this.calculateDomainRelevance(queryLower, agent.domains);
    score += domainScore * weights.domains;

    // FACTOR 3: CONTEXT CONTINUITY (20% of total score)
    // Bonus for continuing with the same agent to maintain coherent conversations
    const contextScore = this.calculateContextRelevance(agent.id, context);
    score += contextScore * weights.context;

    // EXACT MATCH BONUS
    // Additional boost for exact keyword matches (whole word boundaries)
    // This helps distinguish between "java" (programming) and "java script" (partial match)
    const exactMatches = agent.keywords.filter(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      return regex.test(queryLower);
    });
    score += exactMatches.length * 0.1; // 10% bonus per exact match

    return Math.min(score, 1.2); // Cap at 1.2 to allow some bonus scoring
  }

  /**
   * Domain Pattern Recognition
   * 
   * This method looks for broader linguistic patterns that indicate
   * domain expertise beyond just keyword matching. For example:
   * - "build", "develop", "create" suggest software development
   * - "analyze", "predict", "model" suggest data science
   * - "campaign", "promote", "brand" suggest marketing
   * 
   * @param queryLower - Normalized query text
   * @param domains - Agent's domain specializations
   * @returns number - Domain relevance score (0.0 to 1.0)
   */
  private calculateDomainRelevance(queryLower: string, domains: string[]): number {
    // DOMAIN PATTERN DICTIONARY
    // Maps domain names to action verbs and conceptual terms commonly used in that domain
    const domainPatterns = {
      'software_development': ['build', 'develop', 'create', 'implement', 'code', 'program', 'write'],
      'devops': ['deploy', 'pipeline', 'infrastructure', 'container', 'server', 'automate', 'scale'],
      'cloud_computing': ['aws', 'azure', 'cloud', 'serverless', 'kubernetes', 'docker', 'microservices'],
      'cybersecurity': ['secure', 'encrypt', 'authenticate', 'vulnerability', 'threat', 'firewall'],
      'business_strategy': ['strategy', 'plan', 'business', 'market', 'growth', 'competitive', 'revenue'],
      'project_management': ['project', 'timeline', 'milestone', 'stakeholder', 'scope', 'deliverable', 'mvp', 'plan', 'risk', 'assumption', 'owner'],
      'financial_analysis': ['financial', 'budget', 'cost', 'roi', 'investment', 'profit', 'revenue'],
      'data_science': ['analyze', 'predict', 'model', 'statistics', 'insights', 'correlation', 'trend'],
      'machine_learning': ['train', 'algorithm', 'neural', 'classification', 'regression', 'feature'],
      'analytics': ['dashboard', 'metrics', 'kpi', 'visualization', 'report', 'measurement'],
      'content_creation': ['write', 'create', 'design', 'content', 'copy', 'article', 'blog'],
      'marketing': ['campaign', 'promote', 'brand', 'audience', 'engagement', 'conversion'],
      'design': ['visual', 'layout', 'interface', 'user experience', 'wireframe', 'prototype'],
      'communications': ['message', 'communicate', 'presentation', 'social media', 'public relations']
    };

    let relevanceScore = 0;
    
    // PATTERN MATCHING
    // For each domain the agent specializes in, check if the query contains related patterns
    for (const domain of domains) {
      const patterns = domainPatterns[domain] || [];
      const matches = patterns.filter(pattern => queryLower.includes(pattern));
      
      // Score contribution: 0.3 for any matches in this domain, diminishing returns
      if (matches.length > 0) {
        relevanceScore += Math.min(matches.length * 0.1, 0.3);
      }
    }

    return Math.min(relevanceScore, 1);
  }

  /**
   * Context Continuity Scoring
   * 
   * Provides a bonus score for continuing with the same agent to maintain
   * conversational coherence. This helps avoid unnecessary agent switching
   * when the user is deep in a technical discussion.
   * 
   * @param agentId - The agent being evaluated
   * @param context - Current conversation context
   * @returns number - Context continuity score (0.0 to 0.3)
   */
  private calculateContextRelevance(agentId: string, context?: OrchestrationContext): number {
    if (!context || !context.current_agent) {
      return 0; // No context bonus for new conversations
    }

    // CONTINUITY BONUS
    // If the user is continuing with the same agent, provide a moderate boost
    // This prevents unnecessary switching in the middle of coherent conversations
    return context.current_agent === agentId ? 0.3 : 0;
  }

  /**
   * Advanced Intent Classification Engine
   * 
   * Enhanced classification system that uses multiple techniques:
   * 1. Pattern matching with weighted scoring
   * 2. Question type detection (what, how, why, etc.)
   * 3. Action verb identification
   * 4. Context-aware classification
   * 
   * @param queryLower - Normalized query text
   * @param context - Optional conversation context for better classification
   * @returns string - Classified intent category with confidence
   */
  private extractIntent(queryLower: string, context?: OrchestrationContext): string {
    // ENHANCED INTENT PATTERN MAPPING
    // Each intent now has weighted patterns and specific indicators
    const intentPatterns = {
      'help_request': {
        primary: ['help', 'assist', 'support', 'guide'],
        secondary: ['can you', 'could you', 'would you', 'please'],
        questions: ['how to', 'how do i', 'how can i'],
        weight: 1.0
      },
      'creation_request': {
        primary: ['create', 'build', 'make', 'develop', 'generate', 'design', 'write', 'implement'],
        secondary: ['new', 'from scratch', 'custom', 'prototype'],
        questions: ['how to create', 'how to build', 'how to make'],
        weight: 1.2
      },
      'analysis_request': {
        primary: ['analyze', 'examine', 'review', 'assess', 'evaluate', 'compare', 'study'],
        secondary: ['performance', 'metrics', 'data', 'results'],
        questions: ['what are', 'which is', 'how does', 'why does'],
        weight: 1.1
      },
      'learning_request': {
        primary: ['learn', 'understand', 'explain', 'teach', 'show', 'clarify'],
        secondary: ['concept', 'theory', 'basics', 'fundamentals'],
        questions: ['what is', 'what are', 'why', 'how does', 'when'],
        weight: 1.0
      },
      'troubleshooting': {
        primary: ['fix', 'debug', 'solve', 'resolve', 'repair', 'troubleshoot'],
        secondary: ['error', 'problem', 'issue', 'broken', 'failing', 'not working'],
        questions: ['why is', 'why does', 'what\'s wrong', 'how to fix'],
        weight: 1.3
      },
      'optimization_request': {
        primary: ['improve', 'optimize', 'enhance', 'refactor', 'upgrade'],
        secondary: ['better', 'faster', 'efficient', 'performance', 'speed'],
        questions: ['how to improve', 'how to optimize', 'how to make better'],
        weight: 1.1
      },
      'planning_request': {
        primary: ['plan', 'strategy', 'roadmap', 'schedule', 'organize'],
        secondary: ['timeline', 'approach', 'methodology', 'steps'],
        questions: ['how should', 'what should', 'when should', 'where should'],
        weight: 1.0
      },
      'comparison_request': {
        primary: ['compare', 'versus', 'vs', 'difference', 'similar', 'alternative'],
        secondary: ['better', 'worse', 'pros', 'cons', 'advantages'],
        questions: ['which is', 'what\'s the difference', 'which should'],
        weight: 1.0
      },
      'recommendation_request': {
        primary: ['recommend', 'suggest', 'advise', 'propose'],
        secondary: ['best', 'ideal', 'suitable', 'appropriate'],
        questions: ['what should', 'which should', 'what would you'],
        weight: 1.0
      }
    };

    // MULTI-FACTOR INTENT SCORING
    const intentScores: { [intent: string]: number } = {};

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      let score = 0;

      // Primary patterns (high weight)
      const primaryMatches = patterns.primary.filter(pattern => queryLower.includes(pattern));
      score += primaryMatches.length * 3;

      // Secondary patterns (medium weight)
      const secondaryMatches = patterns.secondary.filter(pattern => queryLower.includes(pattern));
      score += secondaryMatches.length * 2;

      // Question patterns (high weight for specific question types)
      const questionMatches = patterns.questions.filter(pattern => queryLower.includes(pattern));
      score += questionMatches.length * 4;

      // Apply intent-specific weight multiplier
      score *= patterns.weight;

      // Context bonus: if previous conversation was similar intent, small boost
      if (context?.routing_decisions?.length > 0) {
        const lastIntent = context.routing_decisions[context.routing_decisions.length - 1]?.analyzed_intent;
        if (lastIntent === intent) {
          score += 0.5; // Small continuity bonus
        }
      }

      intentScores[intent] = score;
    }

    // ADVANCED QUESTION TYPE DETECTION
    const questionTypeBonus = this.analyzeQuestionType(queryLower);
    for (const [intent, bonus] of Object.entries(questionTypeBonus)) {
      if (intentScores[intent]) {
        intentScores[intent] += bonus;
      }
    }

    // SELECT HIGHEST SCORING INTENT
    const bestIntent = Object.entries(intentScores)
      .reduce((best, [intent, score]) => 
        score > best.score ? { intent, score } : best,
        { intent: 'general_inquiry', score: 0 }
      );

    // CONFIDENCE THRESHOLD
    // Only return specific intent if confidence is sufficient
    return bestIntent.score >= 2 ? bestIntent.intent : 'general_inquiry';
  }

  /**
   * Question Type Analysis
   * 
   * Analyzes the grammatical structure of questions to provide
   * additional intent classification hints.
   * 
   * @param queryLower - Normalized query text
   * @returns Object with intent bonuses based on question patterns
   */
  private analyzeQuestionType(queryLower: string): { [intent: string]: number } {
    const bonuses: { [intent: string]: number } = {};

    // QUESTION WORD ANALYSIS
    const questionPatterns = {
      'what': ['learning_request', 'analysis_request'],
      'how': ['help_request', 'creation_request', 'troubleshooting'],
      'why': ['learning_request', 'troubleshooting'],
      'when': ['planning_request', 'learning_request'],
      'where': ['learning_request', 'planning_request'],
      'which': ['comparison_request', 'recommendation_request'],
      'who': ['learning_request'],
      'can': ['help_request', 'creation_request'],
      'should': ['recommendation_request', 'planning_request'],
      'would': ['recommendation_request', 'comparison_request']
    };

    for (const [questionWord, relatedIntents] of Object.entries(questionPatterns)) {
      if (queryLower.startsWith(questionWord) || queryLower.includes(` ${questionWord} `)) {
        relatedIntents.forEach(intent => {
          bonuses[intent] = (bonuses[intent] || 0) + 1;
        });
      }
    }

    // SENTENCE STRUCTURE ANALYSIS
    if (queryLower.includes('?')) {
      bonuses['learning_request'] = (bonuses['learning_request'] || 0) + 0.5;
    }

    if (queryLower.includes('please') || queryLower.includes('could you')) {
      bonuses['help_request'] = (bonuses['help_request'] || 0) + 1;
    }

    return bonuses;
  }

  /**
   * Keyword Extraction for Transparency
   * 
   * Extracts the specific keywords that influenced the routing decision.
   * This provides transparency and helps users understand why a particular
   * agent was selected.
   * 
   * @param queryLower - Normalized query text
   * @param agent - Selected agent configuration
   * @returns string[] - List of matched keywords
   */
  private extractMatchedKeywords(queryLower: string, agent?: AgentSpecialization): string[] {
    if (!agent) return [];
    
    return agent.keywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Routing Decision Explanation Generator
   * 
   * Generates human-readable explanations for routing decisions.
   * This is crucial for building trust and allowing users to understand
   * why they were routed to a particular specialist.
   * 
   * @param selectedAgent - The winning agent and score
   * @param allScores - All confidence scores for comparison
   * @param meetsThreshold - Whether the winner met minimum confidence
   * @returns string - Human-readable explanation
   */
  private generateReasoningExplanation(
    selectedAgent: { agentId: string; score: number },
    allScores: { [agentId: string]: number },
    meetsThreshold: boolean
  ): string {
    const agentConfig = this.config.specialized_agents.find(a => a.id === selectedAgent.agentId);
    const agentName = agentConfig?.name || selectedAgent.agentId;

    // THRESHOLD FAILURE EXPLANATION
    if (!meetsThreshold) {
      return `No specialized agent met the confidence threshold (${agentConfig?.confidence_threshold || 0.5}). Using fallback agent to ensure you get help.`;
    }

    // SUCCESS EXPLANATION WITH COMPETITIVE ANALYSIS
    const sortedScores = Object.entries(allScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3); // Show top 3 candidates

    const reasonParts = [
      `Selected ${agentName} with confidence score ${selectedAgent.score.toFixed(2)} (threshold: ${agentConfig?.confidence_threshold || 0.5}).`,
      `Top candidates: ${sortedScores.map(([id, score]) => {
        const name = this.config.specialized_agents.find(a => a.id === id)?.name || id;
        return `${name} (${score.toFixed(2)})`;
      }).join(', ')}.`
    ];

    return reasonParts.join(' ');
  }

  /**
   * Enhanced Specialized Agent Invocation with Context
   * 
   * This method handles the actual invocation of the selected specialized agent
   * with full context management and intelligent query enhancement.
   * 
   * @param agent - The selected agent configuration
   * @param query - Original user query
   * @param sessionId - Session identifier for context
   * @param analysis - The routing analysis that led to this selection
   * @param context - Conversation context for enhancement
   * @returns Promise<any> - Response from the specialized agent
   */
  private async invokeSpecializedAgentWithContext(
    agent: AgentSpecialization,
    query: string,
    sessionId: string,
    analysis: QueryAnalysis,
    context: OrchestrationContext
  ) {
    // SIMPLIFIED ARCHITECTURE: Use single agent (YWBU6XB7W7) for ALL roles
    const bedrockAgentId = this.config.orchestrator_agent_id;
    const agentAliasId = this.config.orchestrator_alias_id;
    
    this.logger.log(`🤖 Using single agent ${bedrockAgentId} as ${agent.name} for query: ${query}`);

    // STEP 1: GENERATE APPROPRIATE PROMPT FOR THE ROLE
    let fullPrompt: string;
    
    if (agent.id === 'general-assistant') {
      // Simple, natural prompt for general queries
      fullPrompt = `Please provide a helpful, accurate response to this query: "${query}"`;
    } else {
      // Detailed specialization prompt for domain experts
      const specializationPrompt = this.generateSpecializationPrompt(agent, analysis);
      const contextualQuery = this.enhanceQueryWithContext(query, context, agent);
      fullPrompt = this.combinePromptComponents(specializationPrompt, contextualQuery, agent);
    }
    
    this.logger.log(`📝 Generated ${agent.id} prompt (${fullPrompt.length} chars)`);

    // STEP 2: INVOKE SINGLE AGENT IN APPROPRIATE ROLE
    return await this.bedrockService.invokeAgent(
      bedrockAgentId,
      agentAliasId,
      fullPrompt,
      sessionId
    );
  }

  /**
   * Specialization Prompt Generator
   * 
   * Creates comprehensive system prompts that make the agent behave
   * as a true specialist in the selected domain.
   * 
   * @param agent - The specialist configuration
   * @param analysis - Query analysis for additional context
   * @returns string - Complete specialization prompt
   */
  private generateSpecializationPrompt(agent: AgentSpecialization, analysis: QueryAnalysis): string {
    const promptComponents = [
      // CORE IDENTITY
      `You are a ${agent.name}, a highly experienced professional specialist.`,
      `${agent.description}`,
      '',
      
      // EXPERTISE DEFINITION
      '**Your Core Expertise:**',
      ...agent.capabilities.map(capability => `• ${capability}`),
      '',
      
      // DOMAIN FOCUS
      '**Your Specialized Domains:**',
      ...agent.domains.map(domain => `• ${domain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`),
      '',
      
      // BEHAVIORAL INSTRUCTIONS
      '**How You Should Respond:**',
      this.generateBehavioralInstructions(agent),
      '',
      
      // QUALITY STANDARDS
      '**Quality Standards:**',
      '• Provide expert-level insights and detailed explanations',
      '• Use domain-specific terminology appropriately',
      '• Offer practical, actionable advice',
      '• Share relevant best practices and industry standards',
      '• When applicable, provide examples or code snippets',
      '• Acknowledge limitations and suggest when to consult other specialists',
      '',
      
      // CONTEXT AWARENESS
      '**Context Information:**',
      `• User query intent: ${analysis.analyzed_intent}`,
      `• Confidence in domain match: ${(analysis.confidence_scores[agent.id] || 0).toFixed(2)}`,
      `• Matched keywords: ${analysis.keywords_matched.join(', ') || 'none'}`,
      ''
    ];

    return promptComponents.join('\n');
  }

  /**
   * Behavioral Instructions Generator
   * 
   * Creates specific behavioral guidelines for each specialist type
   * to ensure authentic domain-specific responses.
   * 
   * @param agent - The specialist configuration
   * @returns string - Behavioral instructions for this specialist
   */
  private generateBehavioralInstructions(agent: AgentSpecialization): string {
    const behavioralPatterns: { [agentId: string]: string[] } = {
      'technical-specialist': [
        '• Focus on technical accuracy and implementation details',
        '• Provide code examples when relevant (properly formatted)',
        '• Discuss performance, scalability, and security considerations',
        '• Mention relevant tools, frameworks, and technologies',
        '• Consider different approaches and trade-offs',
        '• Reference documentation and best practices'
      ],
      
      'business-analyst': [
        '• Frame responses in business impact and strategic value',
        '• Quantify benefits where possible (ROI, metrics, KPIs)',
        '• Consider stakeholder perspectives and requirements',
        '• Discuss implementation feasibility and resource needs',
        '• Address risk factors and mitigation strategies',
        '• Connect solutions to business objectives'
      ],
      
      'creative-specialist': [
        '• Emphasize user experience and audience engagement',
        '• Consider brand consistency and messaging alignment',
        '• Suggest creative approaches and innovative solutions',
        '• Think about visual appeal and emotional impact',
        '• Discuss content strategy and storytelling elements',
        '• Consider multichannel and cross-platform implications'
      ],
      
      'data-scientist': [
        '• Focus on data-driven insights and statistical significance',
        '• Explain methodologies and analytical approaches',
        '• Discuss data quality, sources, and limitations',
        '• Provide visualization recommendations',
        '• Consider model selection and validation strategies',
        '• Address ethical considerations and bias in data analysis'
      ]
    };

    const instructions = behavioralPatterns[agent.id] || [
      '• Provide expert advice in your specialized domain',
      '• Use professional terminology and industry standards',
      '• Focus on practical, actionable recommendations',
      '• Consider real-world constraints and best practices'
    ];

    return instructions.join('\n');
  }

  /**
   * Prompt Component Combiner
   * 
   * Intelligently combines specialization prompt, conversation context,
   * and user query into a cohesive prompt that maintains specialist
   * behavior while preserving conversation flow.
   * 
   * @param specializationPrompt - The specialist system prompt
   * @param contextualQuery - Query enhanced with conversation context  
   * @param agent - The specialist configuration
   * @returns string - Complete prompt for the agent
   */
  private combinePromptComponents(
    specializationPrompt: string,
    contextualQuery: string,
    agent: AgentSpecialization
  ): string {
    const combinedPrompt = [
      '=== SPECIALIST ROLE ASSIGNMENT ===',
      specializationPrompt,
      '',
      '=== CONVERSATION CONTEXT ===',
      contextualQuery,
      '',
      '=== RESPONSE INSTRUCTIONS ===',
      `As the ${agent.name}, provide a comprehensive and expert response that:`,
      '• Demonstrates deep domain expertise',
      '• Addresses the specific question or request',
      '• Provides actionable insights or solutions',
      '• Maintains professional specialist tone',
      '',
      'Begin your response now:'
    ];

    return combinedPrompt.join('\n');
  }

  /**
   * Agent Configuration Mapping
   * 
   * Maps our specialist configurations to actual Bedrock agent IDs.
   * This allows for future expansion to multiple physical agents
   * while maintaining the current single-agent architecture.
   * 
   * @param agentId - Specialist configuration ID
   * @returns Object with Bedrock agent ID and alias
   */
  private getBedrockAgentMapping(agentId: string): { agentId: string; aliasId: string } {
    // CURRENT: All specialists use the same underlying agent with different prompts
    // FUTURE: Could map to different physical agents for true isolation
    const agentMappings: { [key: string]: { agentId: string; aliasId: string } } = {
      'technical-specialist': {
        agentId: this.config.orchestrator_agent_id,
        aliasId: this.config.orchestrator_alias_id
      },
      'business-analyst': {
        agentId: this.config.orchestrator_agent_id,
        aliasId: this.config.orchestrator_alias_id
      },
      'creative-specialist': {
        agentId: this.config.orchestrator_agent_id,
        aliasId: this.config.orchestrator_alias_id
      },
      'data-scientist': {
        agentId: this.config.orchestrator_agent_id,
        aliasId: this.config.orchestrator_alias_id
      }
    };

    return agentMappings[agentId] || {
      agentId: this.config.orchestrator_agent_id,
      aliasId: this.config.orchestrator_alias_id
    };
  }

  /**
   * Specialized Agent Invocation (Legacy)
   * 
   * This method handles the actual invocation of the selected specialized agent.
   * It enhances the query with conversation context and manages the interaction
   * with the underlying Bedrock service.
   * 
   * @param agent - The selected agent configuration
   * @param query - Original user query
   * @param sessionId - Session identifier for context
   * @param analysis - The routing analysis that led to this selection
   * @param context - Optional conversation history
   * @returns Promise<any> - Response from the specialized agent
   */
  private async invokeSpecializedAgent(
    agent: AgentSpecialization,
    query: string,
    sessionId: string,
    analysis: QueryAnalysis,
    context?: OrchestrationContext
  ) {
    // AGENT MAPPING
    // In a production system, you would map specialization IDs to actual Bedrock agent IDs
    // For now, we use the specialization ID as the Bedrock agent ID
    const bedrockAgentId = agent.id;
    const agentAliasId = 'TSTALIASID'; // Default alias - should be configurable per agent

    this.logger.log(`🤖 Invoking ${agent.name} (${bedrockAgentId}) for query: ${query}`);

    // CONTEXT ENHANCEMENT
    // If this is part of an ongoing conversation, enhance the query with relevant history
    // This helps the specialized agent understand the conversation flow
    let enhancedQuery = query;
    if (context?.conversation_history?.length > 0) {
      const recentHistory = context.conversation_history.slice(-2); // Last 2 exchanges for context
      const contextSummary = recentHistory.map(step => 
        `Previous: ${step.user_message} -> ${step.agent_response.substring(0, 100)}...`
      ).join(' ');
      
      enhancedQuery = `Context: ${contextSummary}\n\nCurrent question: ${query}`;
      this.logger.log(`📝 Enhanced query with conversation context`);
    }

    // AGENT INVOCATION
    // Call the underlying Bedrock service with the enhanced query
    return await this.bedrockService.invokeAgent(
      bedrockAgentId,
      agentAliasId,
      enhancedQuery,
      sessionId
    );
  }

  /**
   * Fallback Handler - Graceful Degradation
   * 
   * When the primary routing system fails, this method provides a graceful
   * fallback response rather than completely failing the user's request.
   * This ensures system reliability even when individual components fail.
   * 
   * @param query - Original user query
   * @param sessionId - Session identifier
   * @param errorMessage - Description of what went wrong
   * @returns Promise<OrchestrationResponse> - Fallback response
   */
  private async handleFallback(
    query: string,
    sessionId: string,
    errorMessage: string
  ): Promise<OrchestrationResponse> {
    this.logger.warn(`⚠️ Using fallback agent due to error: ${errorMessage}`);

    // FALLBACK RESPONSE CONSTRUCTION
    // Provide a helpful response that acknowledges the issue but still attempts to help
    const fallbackResponse: OrchestrationResponse = {
      response: `I encountered an issue with my routing system (${errorMessage}), but I'll do my best to help with your request: "${query}". Please let me know if you need me to try a different approach.`,
      handling_agent: this.config.fallback_agent_id || 'general-assistant',
      agent_name: 'General Assistant (Fallback)',
      routing_analysis: {
        original_query: query,
        analyzed_intent: 'fallback',
        confidence_scores: {},
        selected_agent: this.config.fallback_agent_id || 'general-assistant',
        reasoning: `Fallback due to routing error: ${errorMessage}`,
        keywords_matched: []
      },
      session_id: sessionId,
      context_maintained: false
    };

    return fallbackResponse;
  }

  // ========================================
  // CONVERSATION CONTEXT MANAGEMENT SYSTEM
  // ========================================

  /**
   * Enhanced Context Management - The Memory System
   * 
   * This comprehensive context management system maintains conversation
   * continuity across multiple interactions, enabling:
   * 1. Cross-agent context transfer
   * 2. Conversation topic tracking
   * 3. Agent switching optimization
   * 4. Context-aware routing decisions
   */

  private conversationContexts = new Map<string, OrchestrationContext>();

  /**
   * Retrieve or Initialize Conversation Context
   * 
   * Gets the existing conversation context for a session or creates a new one.
   * This is the entry point for all context-related operations.
   * 
   * @param sessionId - Unique session identifier
   * @param userQuery - Current user query for context initialization
   * @returns OrchestrationContext - Current or new conversation context
   */
  async getOrCreateContext(sessionId: string, userQuery: string): Promise<OrchestrationContext> {
    let context = this.conversationContexts.get(sessionId);

    if (!context) {
      // CREATE NEW CONTEXT
      context = {
        session_id: sessionId,
        user_query: userQuery,
        conversation_history: [],
        routing_decisions: [],
        // current_agent will be set after first routing decision
      };

      this.conversationContexts.set(sessionId, context);
      this.logger.log(`📝 Created new conversation context for session: ${sessionId}`);
    } else {
      // UPDATE EXISTING CONTEXT
      context.user_query = userQuery;
      this.logger.log(`📝 Retrieved existing context for session: ${sessionId} (${context.conversation_history.length} previous exchanges)`);
    }

    return context;
  }

  /**
   * Update Context After Agent Response
   * 
   * Records the completed interaction in the conversation history and
   * updates the context state for future routing decisions.
   * 
   * @param sessionId - Session identifier
   * @param userQuery - The user's query
   * @param response - The orchestrator's complete response
   * @returns Promise<void>
   */
  async updateConversationContext(
    sessionId: string,
    userQuery: string,
    response: OrchestrationResponse
  ): Promise<void> {
    const context = this.conversationContexts.get(sessionId);
    if (!context) {
      this.logger.warn(`⚠️ No context found for session ${sessionId} during update`);
      return;
    }

    // ADD TO CONVERSATION HISTORY
    const conversationStep = {
      timestamp: new Date(),
      user_message: userQuery,
      agent_id: response.handling_agent,
      agent_response: response.response,
      routing_reason: response.routing_analysis.reasoning
    };

    context.conversation_history.push(conversationStep);
    context.routing_decisions.push(response.routing_analysis);
    context.current_agent = response.handling_agent;

    // CONTEXT PRUNING
    // Keep only the last 10 exchanges to prevent memory bloat
    // while maintaining sufficient context for routing decisions
    if (context.conversation_history.length > 10) {
      context.conversation_history = context.conversation_history.slice(-10);
    }

    if (context.routing_decisions.length > 10) {
      context.routing_decisions = context.routing_decisions.slice(-10);
    }

    this.logger.log(`📝 Updated context for session ${sessionId}: ${context.conversation_history.length} exchanges, current agent: ${context.current_agent}`);
  }

  /**
   * Analyze Conversation Flow for Context Insights
   * 
   * Analyzes the conversation history to provide insights that can
   * improve routing decisions and provide better context transfer.
   * 
   * @param context - The conversation context to analyze
   * @returns Object with conversation insights
   */
  private analyzeConversationFlow(context: OrchestrationContext): {
    dominant_topic: string;
    agent_switching_frequency: number;
    conversation_depth: number;
    recent_topics: string[];
  } {
    if (!context.conversation_history.length) {
      return {
        dominant_topic: 'none',
        agent_switching_frequency: 0,
        conversation_depth: 0,
        recent_topics: []
      };
    }

    // AGENT SWITCHING ANALYSIS
    const agentSwitches = context.conversation_history.reduce((switches, step, index) => {
      if (index > 0 && step.agent_id !== context.conversation_history[index - 1].agent_id) {
        switches++;
      }
      return switches;
    }, 0);

    const switchingFrequency = agentSwitches / Math.max(context.conversation_history.length - 1, 1);

    // TOPIC ANALYSIS
    const recentTopics = context.routing_decisions
      .slice(-5) // Last 5 routing decisions
      .map(decision => decision.analyzed_intent)
      .filter((topic, index, array) => array.indexOf(topic) === index); // Unique topics

    // DOMINANT TOPIC DETECTION
    const topicCounts = context.routing_decisions.reduce((counts, decision) => {
      counts[decision.analyzed_intent] = (counts[decision.analyzed_intent] || 0) + 1;
      return counts;
    }, {} as { [topic: string]: number });

    const dominantTopic = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'mixed';

    return {
      dominant_topic: dominantTopic,
      agent_switching_frequency: switchingFrequency,
      conversation_depth: context.conversation_history.length,
      recent_topics: recentTopics
    };
  }

  /**
   * Generate Context Summary for Agent Transfer
   * 
   * When switching between agents, this creates a concise summary
   * of the conversation context to help the new agent understand
   * what has been discussed.
   * 
   * @param context - The conversation context
   * @param targetAgent - The agent that will receive the context
   * @returns string - Formatted context summary
   */
  private generateContextSummary(
    context: OrchestrationContext,
    targetAgent: AgentSpecialization
  ): string {
    if (!context.conversation_history.length) {
      return '';
    }

    const flow = this.analyzeConversationFlow(context);
    const recentExchanges = context.conversation_history.slice(-3); // Last 3 exchanges

    const summaryParts = [
      `[CONTEXT TRANSFER to ${targetAgent.name}]`,
      `Conversation Summary: ${flow.conversation_depth} exchanges, dominant topic: ${flow.dominant_topic}`,
    ];

    // ADD RECENT CONVERSATION HIGHLIGHTS
    if (recentExchanges.length > 0) {
      summaryParts.push(`Recent discussion:`);
      recentExchanges.forEach((exchange, index) => {
        const agentName = this.config.specialized_agents.find(a => a.id === exchange.agent_id)?.name || exchange.agent_id;
        summaryParts.push(`${index + 1}. User: ${exchange.user_message.substring(0, 80)}${exchange.user_message.length > 80 ? '...' : ''}`);
        summaryParts.push(`   ${agentName}: ${exchange.agent_response.substring(0, 100)}${exchange.agent_response.length > 100 ? '...' : ''}`);
      });
    }

    summaryParts.push(`[END CONTEXT TRANSFER]`);
    summaryParts.push(''); // Empty line before current query

    return summaryParts.join('\n');
  }

  /**
   * Context-Aware Query Enhancement
   * 
   * Enhances the user's query with relevant conversation context
   * when invoking a specialized agent. This is more sophisticated
   * than the basic context enhancement in invokeSpecializedAgent.
   * 
   * @param query - Original user query
   * @param context - Conversation context
   * @param targetAgent - The agent that will handle the query
   * @returns string - Enhanced query with context
   */
  private enhanceQueryWithContext(
    query: string,
    context: OrchestrationContext,
    targetAgent: AgentSpecialization
  ): string {
    if (!context.conversation_history.length) {
      return query; // No context to add
    }

    const isAgentSwitch = context.current_agent && context.current_agent !== targetAgent.id;
    
    if (isAgentSwitch) {
      // AGENT SWITCH: Provide comprehensive context transfer
      const contextSummary = this.generateContextSummary(context, targetAgent);
      return `${contextSummary}\nCurrent Question: ${query}`;
    } else {
      // SAME AGENT: Provide light context continuity
      const lastExchange = context.conversation_history[context.conversation_history.length - 1];
      if (lastExchange) {
        return `Previous context: "${lastExchange.user_message}" -> "${lastExchange.agent_response.substring(0, 100)}..."\n\nCurrent question: ${query}`;
      }
    }

    return query;
  }

  /**
   * Session Context Cleanup
   * 
   * Removes old conversation contexts to prevent memory leaks.
   * Should be called periodically or when sessions expire.
   * 
   * @param maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  cleanupOldContexts(maxAge: number = 3600000): void {
    const now = new Date().getTime();
    let cleanedCount = 0;

    for (const [sessionId, context] of this.conversationContexts.entries()) {
      const lastActivity = context.conversation_history.length > 0
        ? context.conversation_history[context.conversation_history.length - 1].timestamp.getTime()
        : now;

      if (now - lastActivity > maxAge) {
        this.conversationContexts.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`🧹 Cleaned up ${cleanedCount} old conversation contexts`);
    }
  }

  /**
   * DEBUG UTILITY: Preview Specialization Prompt
   * 
   * Generates and returns the specialization prompt that would be used
   * for a given agent and query. Useful for testing and debugging.
   * 
   * @param agentId - The specialist agent ID
   * @param query - The user query
   * @returns Promise<string> - The generated prompt (or error message)
   */
  async previewSpecializationPrompt(agentId: string, query: string): Promise<string> {
    try {
      const agent = this.config.specialized_agents.find(a => a.id === agentId);
      if (!agent) {
        return `❌ Agent '${agentId}' not found. Available agents: ${this.config.specialized_agents.map(a => a.id).join(', ')}`;
      }

      // Create mock analysis for preview
      const mockAnalysis: QueryAnalysis = {
        original_query: query,
        analyzed_intent: 'preview_mode',
        confidence_scores: { [agentId]: 0.95 },
        selected_agent: agentId,
        reasoning: 'Preview mode - simulated high confidence',
        keywords_matched: agent.keywords.filter(k => query.toLowerCase().includes(k.toLowerCase())).slice(0, 3)
      };

      // Create mock context
      const mockContext: OrchestrationContext = {
        session_id: 'preview-session',
        user_query: query,
        conversation_history: [],
        routing_decisions: []
      };

      const specializationPrompt = this.generateSpecializationPrompt(agent, mockAnalysis);
      const contextualQuery = this.enhanceQueryWithContext(query, mockContext, agent);
      const fullPrompt = this.combinePromptComponents(specializationPrompt, contextualQuery, agent);

      return `🎯 SPECIALIZATION PROMPT PREVIEW for ${agent.name}\n${'='.repeat(60)}\n\n${fullPrompt}`;

    } catch (error) {
      return `❌ Error generating preview: ${error.message}`;
    }
  }
}