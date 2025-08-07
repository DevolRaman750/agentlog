import { MarketplaceAgent } from '../types/marketplace';

export const generateMarketplaceAgents = (): MarketplaceAgent[] => {
  return [
    {
      id: 'agent-code-analyst-prime-7',
      name: 'CodeAnalyst-Prime-7',
      role: 'Software Research Intern',
      category: 'Software Engineering',
      description: 'Specialized AI agent for code analysis, issue creation, and research tasks. Designed with read-only access for safe repository exploration and continuous monitoring. Cannot modify code or make commits, ensuring secure operations.',
      experienceLevel: 'Junior',
      hourlyRate: '$40-60/hour equivalent',
      avatar: {
        initials: 'CA',
        backgroundColor: '#34C759',
        textColor: '#FFFFFF',
      },
      capabilities: {
        specialties: [
          'READ-ONLY Repository Analysis',
          'Issue Creation & Research',
          'Code Pattern Detection',
          'Repository Monitoring',
          'Slack Communication',
          'Security: Cannot Modify Code'
        ],
        functionGroups: ['GitHub (Read-Only)', 'Slack Communication'],
        specificFunctions: [
          'github_read_issues',
          'github_read_code',
          'github_search_code',
          'github_list_branches',
          'github_create_issue',
          'github_add_comment',
          'slack_send_message',
          'slack_read_messages'
        ],
        tools: ['GitHub API (Read)', 'Slack Bot API', 'Code Analysis', 'Issue Tracking']
      },
      stats: {
        projectsCompleted: 89,
        successRate: 91,
        responseTime: '< 1 min',
        availability: 'Available'
      },
      templateId: 'template-code-analyst',
      templateName: 'Code Research Analyst',
      highlights: [
        'SECURE: Read-only access prevents accidental code changes',
        'Continuously monitors repositories for issues and patterns',
        'Creates detailed issue reports with code references',
        'Provides Slack updates on findings and recommendations',
        'Perfect for code auditing and research tasks'
      ],
      apiRequirements: {
        requiredKeys: ['githubApiKey', 'SLACK_BOT_TOKEN'],
        displayNames: ['GitHub API Token', 'Slack Bot Token']
      },
      modelConfig: {
        modelName: 'gemini-1.5-flash-latest',
        configName: 'Gemini Flash Default',
        temperature: 0.5,
        maxTokens: 1024
      }
    },
    {
      id: 'agent-dev-nexus-alpha-3',
      name: 'DevNexus-Alpha-3',
      role: 'Autonomous Software Engineer',
      category: 'Software Engineering',
      description: 'Full-capability software development AI with complete GitHub workflow access. Can read, analyze, create branches, modify files, and manage pull requests. Designed for autonomous code implementation without Slack access for focused development work.',
      experienceLevel: 'Expert',
      hourlyRate: '$120-150/hour equivalent',
      avatar: {
        initials: 'DN',
        backgroundColor: '#007AFF',
        textColor: '#FFFFFF',
      },
      capabilities: {
        specialties: [
          'FULL GitHub Workflow Access',
          'Autonomous Code Implementation',
          'Branch Creation & Management',
          'File Creation & Modification',
          'Pull Request Management',
          'NO Slack Access (Focused Development)'
        ],
        functionGroups: ['GitHub (Full Access)'],
        specificFunctions: [
          'github_read_issues',
          'github_read_code',
          'github_search_code',
          'github_list_branches',
          'github_create_branch',
          'github_get_file_sha',
          'github_create_update_file',
          'github_create_pull_request',
          'github_merge_pull_request',
          'github_add_comment',
          'github_update_issue'
        ],
        tools: ['GitHub API (Full Write Access)', 'Git', 'Code Generation', 'Testing Frameworks']
      },
      stats: {
        projectsCompleted: 247,
        successRate: 94,
        responseTime: '< 2 min',
        availability: 'Available'
      },
      templateId: 'template-autonomous-swe',
      templateName: 'Autonomous Software Engineer',
      highlights: [
        'POWERFUL: Full code modification and deployment capabilities',
        'Complete autonomous development workflow from issue to merge',
        'Advanced code generation and refactoring capabilities',
        'Focused on development work without communication distractions',
        'Ideal for implementing features and fixing bugs autonomously'
      ],
      apiRequirements: {
        requiredKeys: ['githubApiKey'],
        displayNames: ['GitHub API Token (Write Access)']
      },
      modelConfig: {
        modelName: 'gemini-1.5-pro-latest',
        configName: 'Autonomous SWE Pro',
        temperature: 0.3,
        maxTokens: 4096
      }
    },
    {
      id: 'agent-weather-comm-sigma-9',
      name: 'WeatherComm-Sigma-9',
      role: 'Weather Communication Specialist',
      category: 'Communication',
      description: 'Specialized AI combining real-time weather data access with Slack communication capabilities. Monitors weather conditions and proactively alerts teams via Slack. Perfect for weather-dependent operations and team coordination.',
      experienceLevel: 'Senior',
      hourlyRate: '$80-100/hour equivalent',
      avatar: {
        initials: 'WC',
        backgroundColor: '#FF9500',
        textColor: '#FFFFFF',
      },
      capabilities: {
        specialties: [
          'Real-time Weather Monitoring',
          'Slack Alert Management',
          'Proactive Weather Communications',
          'Location-based Weather Analysis',
          'Team Weather Coordination',
          'NO Code Access (Weather + Comms Only)'
        ],
        functionGroups: ['Weather API', 'Slack Communication'],
        specificFunctions: [
          'get_current_weather',
          'slack_send_message',
          'slack_read_messages',
          'slack_list_channels',
          'slack_get_channel_info',
          'slack_search_users'
        ],
        tools: ['OpenWeather API', 'Slack Bot API', 'Location Services', 'Alert Systems']
      },
      stats: {
        projectsCompleted: 134,
        successRate: 92,
        responseTime: '< 30 sec',
        availability: 'Available'
      },
      templateId: 'template-weather-comms',
      templateName: 'Weather Communication Specialist',
      highlights: [
        'FOCUSED: Weather data + Slack communication only',
        'Proactive weather alerts for teams and operations',
        'Location-aware weather monitoring and reporting',
        'Perfect for weather-dependent business operations',
        'Seamless integration between weather data and team communication'
      ],
      apiRequirements: {
        requiredKeys: ['openWeatherApiKey', 'SLACK_BOT_TOKEN'],
        displayNames: ['OpenWeather API Key', 'Slack Bot Token']
      },
      modelConfig: {
        modelName: 'gemini-1.5-pro-latest',
        configName: 'Gemini Pro Default',
        temperature: 0.7,
        maxTokens: 2048
      }
    }

  ];
};