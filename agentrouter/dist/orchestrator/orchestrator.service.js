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
var OrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const bedrock_service_1 = require("../agent/bedrock.service");
const orchestrator_config_1 = require("./config/orchestrator.config");
let OrchestratorService = OrchestratorService_1 = class OrchestratorService {
    constructor(bedrockService) {
        this.bedrockService = bedrockService;
        this.logger = new common_1.Logger(OrchestratorService_1.name);
        this.config = orchestrator_config_1.ORCHESTRATOR_CONFIG;
        this.conversationContexts = new Map();
    }
    async orchestrateQuery(query, sessionId, context) {
        this.logger.log(`🎯 Orchestrating query: "${query}" for session: ${sessionId}`);
        try {
            const managedContext = await this.getOrCreateContext(sessionId, query);
            const activeContext = context || managedContext;
            const analysis = await this.analyzeQuery(query, activeContext);
            this.logger.log(`📊 Query analysis completed. Selected agent: ${analysis.selected_agent}`);
            this.logger.log(`📈 Confidence scores: ${JSON.stringify(analysis.confidence_scores)}`);
            const selectedAgent = this.config.specialized_agents.find(agent => agent.id === analysis.selected_agent);
            if (!selectedAgent) {
                throw new Error(`Selected agent ${analysis.selected_agent} not found in configuration`);
            }
            const agentResponse = await this.invokeSpecializedAgentWithContext(selectedAgent, query, sessionId, analysis, activeContext);
            const orchestrationResponse = {
                response: agentResponse.response,
                handling_agent: selectedAgent.id,
                agent_name: selectedAgent.name,
                routing_analysis: analysis,
                session_id: sessionId,
                context_maintained: true
            };
            await this.updateConversationContext(sessionId, query, orchestrationResponse);
            this.logger.log(`✅ Orchestration completed successfully for agent: ${selectedAgent.name}`);
            return orchestrationResponse;
        }
        catch (error) {
            this.logger.error(`❌ Orchestration failed for query: ${query}`, error);
            if (this.config.fallback_agent_id) {
                return this.handleFallback(query, sessionId, error.message);
            }
            throw error;
        }
    }
    async analyzeQuery(query, context) {
        const queryLower = query.toLowerCase();
        const confidenceScores = {};
        for (const agent of this.config.specialized_agents) {
            confidenceScores[agent.id] = this.calculateAgentConfidence(queryLower, agent, context);
        }
        const selectedAgent = Object.entries(confidenceScores)
            .reduce((best, [agentId, score]) => score > best.score ? { agentId, score } : best, { agentId: '', score: 0 });
        const bestAgent = this.config.specialized_agents.find(a => a.id === selectedAgent.agentId);
        const meetsThreshold = selectedAgent.score >= (bestAgent?.confidence_threshold || 0.5);
        const analysis = {
            original_query: query,
            analyzed_intent: this.extractIntent(queryLower, context),
            confidence_scores: confidenceScores,
            selected_agent: meetsThreshold ? selectedAgent.agentId : (this.config.fallback_agent_id || 'general-assistant'),
            reasoning: this.generateReasoningExplanation(selectedAgent, confidenceScores, meetsThreshold),
            keywords_matched: this.extractMatchedKeywords(queryLower, bestAgent)
        };
        return analysis;
    }
    calculateAgentConfidence(queryLower, agent, context) {
        let score = 0;
        const weights = {
            keywords: 0.6,
            domains: 0.2,
            context: 0.2
        };
        const keywordMatches = agent.keywords.filter(keyword => queryLower.includes(keyword.toLowerCase()));
        const keywordScore = Math.min(keywordMatches.length / 3, 1);
        score += keywordScore * weights.keywords;
        const domainScore = this.calculateDomainRelevance(queryLower, agent.domains);
        score += domainScore * weights.domains;
        const contextScore = this.calculateContextRelevance(agent.id, context);
        score += contextScore * weights.context;
        const exactMatches = agent.keywords.filter(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
            return regex.test(queryLower);
        });
        score += exactMatches.length * 0.1;
        return Math.min(score, 1.2);
    }
    calculateDomainRelevance(queryLower, domains) {
        const domainPatterns = {
            'software_development': ['build', 'develop', 'create', 'implement', 'code', 'program', 'write'],
            'devops': ['deploy', 'pipeline', 'infrastructure', 'container', 'server', 'automate', 'scale'],
            'cloud_computing': ['aws', 'azure', 'cloud', 'serverless', 'kubernetes', 'docker', 'microservices'],
            'cybersecurity': ['secure', 'encrypt', 'authenticate', 'vulnerability', 'threat', 'firewall'],
            'business_strategy': ['strategy', 'plan', 'business', 'market', 'growth', 'competitive', 'revenue'],
            'project_management': ['project', 'timeline', 'milestone', 'stakeholder', 'scope', 'deliverable'],
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
        for (const domain of domains) {
            const patterns = domainPatterns[domain] || [];
            const matches = patterns.filter(pattern => queryLower.includes(pattern));
            if (matches.length > 0) {
                relevanceScore += Math.min(matches.length * 0.1, 0.3);
            }
        }
        return Math.min(relevanceScore, 1);
    }
    calculateContextRelevance(agentId, context) {
        if (!context || !context.current_agent) {
            return 0;
        }
        return context.current_agent === agentId ? 0.3 : 0;
    }
    extractIntent(queryLower, context) {
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
        const intentScores = {};
        for (const [intent, patterns] of Object.entries(intentPatterns)) {
            let score = 0;
            const primaryMatches = patterns.primary.filter(pattern => queryLower.includes(pattern));
            score += primaryMatches.length * 3;
            const secondaryMatches = patterns.secondary.filter(pattern => queryLower.includes(pattern));
            score += secondaryMatches.length * 2;
            const questionMatches = patterns.questions.filter(pattern => queryLower.includes(pattern));
            score += questionMatches.length * 4;
            score *= patterns.weight;
            if (context?.routing_decisions?.length > 0) {
                const lastIntent = context.routing_decisions[context.routing_decisions.length - 1]?.analyzed_intent;
                if (lastIntent === intent) {
                    score += 0.5;
                }
            }
            intentScores[intent] = score;
        }
        const questionTypeBonus = this.analyzeQuestionType(queryLower);
        for (const [intent, bonus] of Object.entries(questionTypeBonus)) {
            if (intentScores[intent]) {
                intentScores[intent] += bonus;
            }
        }
        const bestIntent = Object.entries(intentScores)
            .reduce((best, [intent, score]) => score > best.score ? { intent, score } : best, { intent: 'general_inquiry', score: 0 });
        return bestIntent.score >= 2 ? bestIntent.intent : 'general_inquiry';
    }
    analyzeQuestionType(queryLower) {
        const bonuses = {};
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
        if (queryLower.includes('?')) {
            bonuses['learning_request'] = (bonuses['learning_request'] || 0) + 0.5;
        }
        if (queryLower.includes('please') || queryLower.includes('could you')) {
            bonuses['help_request'] = (bonuses['help_request'] || 0) + 1;
        }
        return bonuses;
    }
    extractMatchedKeywords(queryLower, agent) {
        if (!agent)
            return [];
        return agent.keywords.filter(keyword => queryLower.includes(keyword.toLowerCase()));
    }
    generateReasoningExplanation(selectedAgent, allScores, meetsThreshold) {
        const agentConfig = this.config.specialized_agents.find(a => a.id === selectedAgent.agentId);
        const agentName = agentConfig?.name || selectedAgent.agentId;
        if (!meetsThreshold) {
            return `No specialized agent met the confidence threshold (${agentConfig?.confidence_threshold || 0.5}). Using fallback agent to ensure you get help.`;
        }
        const sortedScores = Object.entries(allScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
        const reasonParts = [
            `Selected ${agentName} with confidence score ${selectedAgent.score.toFixed(2)} (threshold: ${agentConfig?.confidence_threshold || 0.5}).`,
            `Top candidates: ${sortedScores.map(([id, score]) => {
                const name = this.config.specialized_agents.find(a => a.id === id)?.name || id;
                return `${name} (${score.toFixed(2)})`;
            }).join(', ')}.`
        ];
        return reasonParts.join(' ');
    }
    async invokeSpecializedAgentWithContext(agent, query, sessionId, analysis, context) {
        const bedrockAgentId = this.config.orchestrator_agent_id;
        const agentAliasId = this.config.orchestrator_alias_id;
        this.logger.log(`🤖 Invoking ${agent.name} specialist via ${bedrockAgentId} for query: ${query}`);
        const specializationPrompt = this.generateSpecializationPrompt(agent, analysis);
        const contextualQuery = this.enhanceQueryWithContext(query, context, agent);
        const fullPrompt = this.combinePromptComponents(specializationPrompt, contextualQuery, agent);
        this.logger.log(`📝 Generated specialized prompt for ${agent.name} (${fullPrompt.length} chars)`);
        return await this.bedrockService.invokeAgent(bedrockAgentId, agentAliasId, fullPrompt, sessionId);
    }
    generateSpecializationPrompt(agent, analysis) {
        const promptComponents = [
            `You are a ${agent.name}, a highly experienced professional specialist.`,
            `${agent.description}`,
            '',
            '**Your Core Expertise:**',
            ...agent.capabilities.map(capability => `• ${capability}`),
            '',
            '**Your Specialized Domains:**',
            ...agent.domains.map(domain => `• ${domain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`),
            '',
            '**How You Should Respond:**',
            this.generateBehavioralInstructions(agent),
            '',
            '**Quality Standards:**',
            '• Provide expert-level insights and detailed explanations',
            '• Use domain-specific terminology appropriately',
            '• Offer practical, actionable advice',
            '• Share relevant best practices and industry standards',
            '• When applicable, provide examples or code snippets',
            '• Acknowledge limitations and suggest when to consult other specialists',
            '',
            '**Context Information:**',
            `• User query intent: ${analysis.analyzed_intent}`,
            `• Confidence in domain match: ${(analysis.confidence_scores[agent.id] || 0).toFixed(2)}`,
            `• Matched keywords: ${analysis.keywords_matched.join(', ') || 'none'}`,
            ''
        ];
        return promptComponents.join('\n');
    }
    generateBehavioralInstructions(agent) {
        const behavioralPatterns = {
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
    combinePromptComponents(specializationPrompt, contextualQuery, agent) {
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
    getBedrockAgentMapping(agentId) {
        const agentMappings = {
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
    async invokeSpecializedAgent(agent, query, sessionId, analysis, context) {
        const bedrockAgentId = agent.id;
        const agentAliasId = 'TSTALIASID';
        this.logger.log(`🤖 Invoking ${agent.name} (${bedrockAgentId}) for query: ${query}`);
        let enhancedQuery = query;
        if (context?.conversation_history?.length > 0) {
            const recentHistory = context.conversation_history.slice(-2);
            const contextSummary = recentHistory.map(step => `Previous: ${step.user_message} -> ${step.agent_response.substring(0, 100)}...`).join(' ');
            enhancedQuery = `Context: ${contextSummary}\n\nCurrent question: ${query}`;
            this.logger.log(`📝 Enhanced query with conversation context`);
        }
        return await this.bedrockService.invokeAgent(bedrockAgentId, agentAliasId, enhancedQuery, sessionId);
    }
    async handleFallback(query, sessionId, errorMessage) {
        this.logger.warn(`⚠️ Using fallback agent due to error: ${errorMessage}`);
        const fallbackResponse = {
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
    async getOrCreateContext(sessionId, userQuery) {
        let context = this.conversationContexts.get(sessionId);
        if (!context) {
            context = {
                session_id: sessionId,
                user_query: userQuery,
                conversation_history: [],
                routing_decisions: [],
            };
            this.conversationContexts.set(sessionId, context);
            this.logger.log(`📝 Created new conversation context for session: ${sessionId}`);
        }
        else {
            context.user_query = userQuery;
            this.logger.log(`📝 Retrieved existing context for session: ${sessionId} (${context.conversation_history.length} previous exchanges)`);
        }
        return context;
    }
    async updateConversationContext(sessionId, userQuery, response) {
        const context = this.conversationContexts.get(sessionId);
        if (!context) {
            this.logger.warn(`⚠️ No context found for session ${sessionId} during update`);
            return;
        }
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
        if (context.conversation_history.length > 10) {
            context.conversation_history = context.conversation_history.slice(-10);
        }
        if (context.routing_decisions.length > 10) {
            context.routing_decisions = context.routing_decisions.slice(-10);
        }
        this.logger.log(`📝 Updated context for session ${sessionId}: ${context.conversation_history.length} exchanges, current agent: ${context.current_agent}`);
    }
    analyzeConversationFlow(context) {
        if (!context.conversation_history.length) {
            return {
                dominant_topic: 'none',
                agent_switching_frequency: 0,
                conversation_depth: 0,
                recent_topics: []
            };
        }
        const agentSwitches = context.conversation_history.reduce((switches, step, index) => {
            if (index > 0 && step.agent_id !== context.conversation_history[index - 1].agent_id) {
                switches++;
            }
            return switches;
        }, 0);
        const switchingFrequency = agentSwitches / Math.max(context.conversation_history.length - 1, 1);
        const recentTopics = context.routing_decisions
            .slice(-5)
            .map(decision => decision.analyzed_intent)
            .filter((topic, index, array) => array.indexOf(topic) === index);
        const topicCounts = context.routing_decisions.reduce((counts, decision) => {
            counts[decision.analyzed_intent] = (counts[decision.analyzed_intent] || 0) + 1;
            return counts;
        }, {});
        const dominantTopic = Object.entries(topicCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'mixed';
        return {
            dominant_topic: dominantTopic,
            agent_switching_frequency: switchingFrequency,
            conversation_depth: context.conversation_history.length,
            recent_topics: recentTopics
        };
    }
    generateContextSummary(context, targetAgent) {
        if (!context.conversation_history.length) {
            return '';
        }
        const flow = this.analyzeConversationFlow(context);
        const recentExchanges = context.conversation_history.slice(-3);
        const summaryParts = [
            `[CONTEXT TRANSFER to ${targetAgent.name}]`,
            `Conversation Summary: ${flow.conversation_depth} exchanges, dominant topic: ${flow.dominant_topic}`,
        ];
        if (recentExchanges.length > 0) {
            summaryParts.push(`Recent discussion:`);
            recentExchanges.forEach((exchange, index) => {
                const agentName = this.config.specialized_agents.find(a => a.id === exchange.agent_id)?.name || exchange.agent_id;
                summaryParts.push(`${index + 1}. User: ${exchange.user_message.substring(0, 80)}${exchange.user_message.length > 80 ? '...' : ''}`);
                summaryParts.push(`   ${agentName}: ${exchange.agent_response.substring(0, 100)}${exchange.agent_response.length > 100 ? '...' : ''}`);
            });
        }
        summaryParts.push(`[END CONTEXT TRANSFER]`);
        summaryParts.push('');
        return summaryParts.join('\n');
    }
    enhanceQueryWithContext(query, context, targetAgent) {
        if (!context.conversation_history.length) {
            return query;
        }
        const isAgentSwitch = context.current_agent && context.current_agent !== targetAgent.id;
        if (isAgentSwitch) {
            const contextSummary = this.generateContextSummary(context, targetAgent);
            return `${contextSummary}\nCurrent Question: ${query}`;
        }
        else {
            const lastExchange = context.conversation_history[context.conversation_history.length - 1];
            if (lastExchange) {
                return `Previous context: "${lastExchange.user_message}" -> "${lastExchange.agent_response.substring(0, 100)}..."\n\nCurrent question: ${query}`;
            }
        }
        return query;
    }
    cleanupOldContexts(maxAge = 3600000) {
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
    async previewSpecializationPrompt(agentId, query) {
        try {
            const agent = this.config.specialized_agents.find(a => a.id === agentId);
            if (!agent) {
                return `❌ Agent '${agentId}' not found. Available agents: ${this.config.specialized_agents.map(a => a.id).join(', ')}`;
            }
            const mockAnalysis = {
                original_query: query,
                analyzed_intent: 'preview_mode',
                confidence_scores: { [agentId]: 0.95 },
                selected_agent: agentId,
                reasoning: 'Preview mode - simulated high confidence',
                keywords_matched: agent.keywords.filter(k => query.toLowerCase().includes(k.toLowerCase())).slice(0, 3)
            };
            const mockContext = {
                session_id: 'preview-session',
                user_query: query,
                conversation_history: [],
                routing_decisions: []
            };
            const specializationPrompt = this.generateSpecializationPrompt(agent, mockAnalysis);
            const contextualQuery = this.enhanceQueryWithContext(query, mockContext, agent);
            const fullPrompt = this.combinePromptComponents(specializationPrompt, contextualQuery, agent);
            return `🎯 SPECIALIZATION PROMPT PREVIEW for ${agent.name}\n${'='.repeat(60)}\n\n${fullPrompt}`;
        }
        catch (error) {
            return `❌ Error generating preview: ${error.message}`;
        }
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = OrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bedrock_service_1.BedrockService])
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map