export interface MarketplaceAgent {
  id: string;
  name: string;
  role: string;
  category: 'Software Engineering' | 'Communication' | 'DevOps' | 'Research' | 'Analytics' | 'Support' | 'Development Support';
  description: string;
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Expert';
  hourlyRate?: string; // For visual appeal, like "$50-80/hour equivalent"
  avatar: {
    initials: string;
    backgroundColor: string;
    textColor: string;
  };
  capabilities: {
    specialties: string[];
    functionGroups: string[];
    specificFunctions: string[];
    tools: string[];
  };
  templateId: string;
  templateName: string;
  highlights: string[]; // Key selling points
  apiRequirements: {
    requiredKeys: string[]; // e.g., ['githubApiKey', 'SLACK_BOT_TOKEN']
    displayNames: string[]; // e.g., ['GitHub API Token', 'Slack Bot Token']
  };
  modelConfig: {
    modelName: string; // e.g., 'gemini-2.5-pro'
    configName: string; // e.g., 'Autonomous SWE Pro'
    temperature: number;
    maxTokens: number;
  };
  testimonial?: {
    text: string;
    author: string;
    rating: number;
  };
}

export interface FunctionDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  functionGroup: string;
  parameters: any;
}

export interface ExecutionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  functionIDs: string[];
}

export interface MarketplaceTeam {
  id: string;
  name: string;
  description: string;
  category: 'Development Support' | 'DevOps' | 'Customer Support' | 'Analytics' | 'Research';
  teamSize: number;
  estimatedCost: string; // e.g., "$300-450/month equivalent"
  avatar: {
    icon: string; // emoji or icon name
    backgroundColor: string;
    textColor: string;
  };
  capabilities: {
    overview: string[];
    coverage: string[]; // What areas this team covers
    integrations: string[]; // What services/APIs it integrates with
  };
  agents: MarketplaceTeamAgent[];
  highlights: string[]; // Key selling points for the team
  apiRequirements: {
    requiredKeys: string[];
    displayNames: string[];
  };
  teamConfigId: string; // References the team configuration
  testimonial?: {
    text: string;
    author: string;
    rating: number;
  };
}

export interface MarketplaceTeamAgent {
  role: string;
  name: string;
  templateId: string;
  description: string;
  capabilities: string[];
  defaultConfig: {
    maxTokensPerDay: number;
    heartbeatMinutes: number;
    lifecycleStatus: 'STANDBY' | 'ACTIVE' | 'PAUSED' | 'KILLED';
  };
}