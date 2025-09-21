import { OrchestrationConfig } from '../types/orchestrator.types';

export const ORCHESTRATOR_CONFIG: OrchestrationConfig = {
  orchestrator_agent_id: 'orchestrator-main',
  orchestrator_alias_id: 'TSTALIASID',
  routing_strategy: 'hybrid',
  fallback_agent_id: 'general-assistant',
  
  specialized_agents: [
    {
      id: 'technical-specialist',
      name: 'Technical Specialist',
      description: 'Handles programming, software development, infrastructure, and technical troubleshooting',
      capabilities: [
        'Code generation and debugging',
        'Architecture design',
        'DevOps and infrastructure',
        'API development',
        'Database design',
        'Security implementation'
      ],
      keywords: [
        'code', 'programming', 'debug', 'api', 'database', 'sql', 'javascript', 'python',
        'typescript', 'react', 'node', 'aws', 'docker', 'kubernetes', 'git', 'github',
        'deployment', 'ci/cd', 'testing', 'error', 'bug', 'function', 'class', 'method',
        'algorithm', 'data structure', 'performance', 'optimization', 'security'
      ],
      domains: ['software_development', 'devops', 'cloud_computing', 'cybersecurity'],
      confidence_threshold: 0.7
    },
    
    {
      id: 'business-analyst',
      name: 'Business Analyst',
      description: 'Handles business strategy, analysis, project management, and process optimization',
      capabilities: [
        'Business strategy development',
        'Market analysis',
        'Project planning and management',
        'Process optimization',
        'Financial analysis',
        'Risk assessment'
      ],
      keywords: [
        'business', 'strategy', 'market', 'analysis', 'project', 'management', 'roi',
        'revenue', 'cost', 'budget', 'planning', 'stakeholder', 'requirements',
        'process', 'workflow', 'optimization', 'kpi', 'metrics', 'dashboard',
        'finance', 'investment', 'risk', 'compliance', 'agile', 'scrum'
      ],
      domains: ['business_strategy', 'project_management', 'financial_analysis'],
      confidence_threshold: 0.6
    },
    
    {
      id: 'creative-specialist',
      name: 'Creative Specialist', 
      description: 'Handles content creation, design, marketing, and creative problem solving',
      capabilities: [
        'Content writing and copywriting',
        'Creative design concepts',
        'Marketing strategy',
        'Brand development',
        'Social media strategy',
        'Creative problem solving'
      ],
      keywords: [
        'content', 'writing', 'copy', 'design', 'creative', 'marketing', 'brand',
        'social media', 'campaign', 'advertising', 'messaging', 'story', 'narrative',
        'visual', 'graphics', 'ui', 'ux', 'user experience', 'blog', 'article',
        'press release', 'email', 'newsletter', 'video', 'podcast', 'presentation'
      ],
      domains: ['content_creation', 'marketing', 'design', 'communications'],
      confidence_threshold: 0.6
    },
    
    {
      id: 'data-scientist',
      name: 'Data Scientist',
      description: 'Handles data analysis, machine learning, statistics, and data-driven insights',
      capabilities: [
        'Data analysis and visualization',
        'Statistical modeling',
        'Machine learning implementation',
        'Predictive analytics',
        'Data pipeline design',
        'Insights and recommendations'
      ],
      keywords: [
        'data', 'analysis', 'statistics', 'machine learning', 'ml', 'ai', 'model',
        'prediction', 'analytics', 'visualization', 'chart', 'graph', 'dataset',
        'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'regression',
        'classification', 'clustering', 'neural network', 'deep learning',
        'feature engineering', 'correlation', 'hypothesis', 'experiment'
      ],
      domains: ['data_science', 'machine_learning', 'statistics', 'analytics'],
      confidence_threshold: 0.7
    }
  ]
};