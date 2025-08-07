export interface MarketplaceAgent {
  id: string;
  name: string;
  role: string;
  category: 'Software Engineering' | 'Communication' | 'DevOps' | 'Research' | 'Analytics' | 'Support';
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
  stats: {
    projectsCompleted: number;
    successRate: number;
    responseTime: string;
    availability: 'Available' | 'Busy' | 'Offline';
  };
  templateId: string;
  templateName: string;
  highlights: string[]; // Key selling points
  apiRequirements: {
    requiredKeys: string[]; // e.g., ['githubApiKey', 'SLACK_BOT_TOKEN']
    displayNames: string[]; // e.g., ['GitHub API Token', 'Slack Bot Token']
  };
  modelConfig: {
    modelName: string; // e.g., 'gemini-1.5-pro-latest'
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
  functionIds: string[];
}