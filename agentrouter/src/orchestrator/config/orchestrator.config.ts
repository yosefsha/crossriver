import { OrchestrationConfig } from '../types/orchestrator.types';

export const ORCHESTRATOR_CONFIG: OrchestrationConfig = {
  orchestrator_agent_id: 'YWBU6XB7W7', // Single Bedrock agent handles ALL roles
  orchestrator_alias_id: 'UIAHNBDBXI', // Single alias for all interactions
  routing_strategy: 'hybrid',
  fallback_agent_id: 'general-assistant', // Use same agent for general queries
  
  specialized_agents: [
    {
      id: 'technical-specialist',
      name: 'Technical Specialist',
      description: 'A senior software engineer and technical architect with deep expertise in programming, system design, DevOps, and emerging technologies. Specializes in providing practical, production-ready solutions.',
      capabilities: [
        'Full-stack software development and architecture',
        'Code generation, debugging, and optimization',
        'Cloud infrastructure design and DevOps automation',
        'API design and microservices architecture',
        'Database design and performance tuning',
        'Security implementation and best practices',
        'Technical project planning and estimation',
        'Code review and quality assurance'
      ],
      keywords: [
        'code', 'programming', 'debug', 'api', 'database', 'sql', 'javascript', 'python',
        'typescript', 'react', 'node', 'aws', 'docker', 'kubernetes', 'git', 'github',
        'deployment', 'ci/cd', 'testing', 'error', 'bug', 'function', 'class', 'method',
        'algorithm', 'data structure', 'performance', 'optimization', 'security',
        'framework', 'library', 'backend', 'frontend', 'server', 'client'
      ],
      domains: ['software_development', 'devops', 'cloud_computing', 'cybersecurity'],
      confidence_threshold: 0.7
    },
    
    {
      id: 'business-analyst',
      name: 'Business Analyst',
      description: 'A strategic business consultant with expertise in market analysis, financial modeling, project management, and organizational optimization. Focuses on driving measurable business outcomes.',
      capabilities: [
        'Strategic business planning and roadmap development',
        'Financial analysis and ROI modeling',
        'Market research and competitive analysis',
        'Project management and stakeholder coordination',
        'Process optimization and workflow design',
        'Risk assessment and mitigation strategies',
        'KPI definition and performance measurement',
        'Business case development and presentation'
      ],
      keywords: [
        'business', 'strategy', 'market', 'analysis', 'project', 'management', 'roi',
        'revenue', 'cost', 'budget', 'planning', 'stakeholder', 'requirements',
        'process', 'workflow', 'optimization', 'kpi', 'metrics', 'dashboard',
        'finance', 'investment', 'risk', 'compliance', 'agile', 'scrum',
        'profit', 'growth', 'competitive', 'opportunity', 'mvp', 'milestone',
        'assumption', 'product', 'roadmap', 'timeline', 'plan', 'owners', 'risks'
      ],
      domains: ['business_strategy', 'project_management', 'financial_analysis'],
      confidence_threshold: 0.6
    },
    
    {
      id: 'creative-specialist',
      name: 'Creative Specialist', 
      description: 'A creative director and content strategist with expertise in design, marketing communications, brand development, and audience engagement. Specializes in creating compelling, user-centered experiences.',
      capabilities: [
        'Content strategy and creative copywriting',
        'Brand development and messaging alignment',
        'User experience and interface design concepts',
        'Marketing campaign strategy and execution',
        'Social media strategy and community building',
        'Visual storytelling and multimedia content',
        'Creative problem solving and innovation',
        'Audience research and persona development'
      ],
      keywords: [
        'content', 'writing', 'copy', 'design', 'creative', 'marketing', 'brand',
        'social media', 'campaign', 'advertising', 'messaging', 'story', 'narrative',
        'visual', 'graphics', 'ui', 'ux', 'user experience', 'blog', 'article',
        'press release', 'email', 'newsletter', 'video', 'podcast', 'presentation',
        'audience', 'engagement', 'persona', 'voice', 'tone'
      ],
      domains: ['content_creation', 'marketing', 'design', 'communications'],
      confidence_threshold: 0.6
    },
    
    {
      id: 'data-scientist',
      name: 'Data Scientist',
      description: 'A senior data scientist and analytics expert specializing in statistical modeling, machine learning, and data-driven decision making. Transforms complex data into actionable business insights.',
      capabilities: [
        'Advanced statistical analysis and modeling',
        'Machine learning algorithm development and deployment',
        'Data pipeline architecture and ETL processes',
        'Predictive analytics and forecasting',
        'Data visualization and dashboard creation',
        'A/B testing and experimental design',
        'Big data processing and distributed computing',
        'AI ethics and bias detection in models'
      ],
      keywords: [
        'data', 'analysis', 'statistics', 'machine learning', 'ml', 'ai', 'model',
        'prediction', 'analytics', 'visualization', 'chart', 'graph', 'dataset',
        'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'regression',
        'classification', 'clustering', 'neural network', 'deep learning',
        'feature engineering', 'correlation', 'hypothesis', 'experiment',
        'sql', 'python', 'r', 'tableau', 'powerbi'
      ],
      domains: ['data_science', 'machine_learning', 'statistics', 'analytics'],
      confidence_threshold: 0.7
    },
    
    {
      id: 'financial-analyst',
      name: 'Financial Analyst',
      description: 'A senior financial analyst and investment professional with expertise in financial modeling, valuation, risk management, and capital markets. Specializes in financial analysis, investment decisions, and regulatory compliance.',
      capabilities: [
        'Financial statement analysis and ratio analysis',
        'DCF modeling and company valuation',
        'Investment portfolio analysis and optimization',
        'Risk management and hedging strategies',
        'Financial planning and budgeting',
        'Market analysis and economic forecasting',
        'Regulatory compliance and reporting',
        'Capital structure and financing decisions'
      ],
      keywords: [
        'finance', 'financial', 'investment', 'valuation', 'dcf', 'cash flow',
        'budget', 'forecast', 'profit', 'loss', 'revenue', 'expenses', 'margin',
        'ratio', 'balance sheet', 'income statement', 'equity', 'debt', 'bonds',
        'stocks', 'portfolio', 'risk', 'return', 'volatility', 'beta', 'alpha',
        'interest rate', 'dividend', 'earnings', 'ebitda', 'npv', 'irr',
        'financial modeling', 'excel', 'bloomberg', 'sec', 'gaap', 'fbar', 
        'foreign bank account', 'tax reporting', 'compliance', 'irs', 'treasury',
        'reporting requirements', 'foreign assets', 'offshore account',
        'tax', 'taxes', 'taxation', 'tax professional', 'tax advisor', 'tax consultant',
        'accountant', 'cpa', 'tax planning', 'tax preparation', 'tax return',
        'deduction', 'exemption', 'withholding', 'refund'
      ],
      domains: ['finance', 'investment', 'financial_analysis', 'capital_markets'],
      confidence_threshold: 0.3 // Lowered to accept FBAR and other financial compliance queries
    },
    
    {
      id: 'general-assistant',
      name: 'General Assistant',
      description: 'A versatile general-purpose assistant that handles a wide variety of queries that don\'t require specialized domain expertise. Uses a dedicated Bedrock agent optimized for general assistance.',
      capabilities: [
        'General question answering and research',
        'Basic information lookup and explanation',
        'Multi-domain query handling',
        'General advice and guidance',
        'Simple task assistance',
        'Educational explanations',
        'General knowledge queries',
        'Cross-domain information synthesis'
      ],
      keywords: [
        'help', 'question', 'what', 'how', 'why', 'when', 'where', 'explain',
        'general', 'basic', 'simple', 'information', 'research', 'lookup',
        'guide', 'advice', 'assistance', 'support', 'overview', 'summary'
      ],
      domains: ['general', 'multi_domain', 'information', 'assistance'],
      confidence_threshold: 0.1 // Very low threshold to catch most general queries
    }
  ]
};