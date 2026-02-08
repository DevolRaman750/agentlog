import { MarketplaceAgent } from '../types/marketplace';

export const generateMarketplaceAgents = (): MarketplaceAgent[] => {
  return [
    {
      id: 'agent-slack-responder-alpha',
      name: 'ChatBot-Alpha',
      role: 'Slack Responder',
      category: 'Development Support',
      description: 'An AI assistant that monitors and responds to questions in the #ai-intern Slack channel. Has full access to Slack functions and GitHub read/write capabilities for issues to provide comprehensive answers based on real repository data.',
      experienceLevel: 'Senior',
      hourlyRate: '$80-100/hour equivalent',
      avatar: {
        initials: 'CB',
        backgroundColor: '#4CAF50',
        textColor: '#FFFFFF',
      },
      capabilities: {
        specialties: [
          'Slack Channel Monitoring',
          'Intelligent Question Answering',
          'GitHub Data Integration',
          'Real-time Code Analysis',
          'Memory-based Context Tracking',
          'Automated Response Marking'
        ],
        functionGroups: ['Slack Communication', 'GitHub (Read/Write Issues)', 'Agent Memory'],
        specificFunctions: [
          'slack_read_messages',
          'slack_list_channels', 
          'slack_send_message',
          'slack_search_messages',
          'github_read_issues',
          'github_read_code',
          'github_read_commits',
          'github_search_code',
          'github_create_issue',
          'github_add_comment',
          'github_update_issue',
          'agent_memory_read',
          'agent_memory_write',
          'agent_memory_search',
          'agent_memory_clear'
        ],
        tools: ['Slack Bot API', 'GitHub API', 'Memory Management', 'Code Analysis']
      },
      templateId: 'template-slack-responder',
      templateName: 'Slack Responder',
      highlights: [
        'INTELLIGENT: Leverages GitHub data for accurate responses',
        'MEMORY-DRIVEN: Tracks conversation context and patterns',
        'PROACTIVE: Monitors channels for unanswered questions',
        'COMPREHENSIVE: Combines Slack communication with code knowledge',
        'SAFE: Read-only code access with controlled issue management'
      ],
      apiRequirements: {
        requiredKeys: ['githubApiKey', 'SLACK_BOT_TOKEN'],
        displayNames: ['GitHub API Token', 'Slack Bot Token']
      },
      modelConfig: {
        modelName: 'gemini-2.5-pro',
        configName: 'Gemini Pro Default',
        temperature: 0.5,
        maxTokens: 2048
      }
    },
    {
      id: 'agent-github-issue-enhancer-beta',
      name: 'IssueBot-Beta',
      role: 'GitHub Issue Enhancer',
      category: 'Development Support',
      description: 'An engineering assistant that keeps GitHub issues actionable by finding relevant code pointers and appending helpful context. Focuses on code analysis and issue enrichment with safe, non-destructive updates.',
      experienceLevel: 'Expert',
      hourlyRate: '$100-120/hour equivalent',
      avatar: {
        initials: 'IB',
        backgroundColor: '#2196F3',
        textColor: '#FFFFFF',
      },
      capabilities: {
        specialties: [
          'Automated Issue Enhancement',
          'Code Pointer Discovery',
          'Safe Context Appending',
          'Repository Code Analysis',
          'Issue Deduplication',
          'Memory-based Processing'
        ],
        functionGroups: ['GitHub (Read/Write Issues)', 'Agent Memory'],
        specificFunctions: [
          'github_read_issues',
          'github_read_code',
          'github_read_commits',
          'github_search_code',
          'github_add_comment',
          'github_update_issue',
          'agent_memory_read',
          'agent_memory_write',
          'agent_memory_search',
          'agent_memory_clear'
        ],
        tools: ['GitHub API', 'Code Analysis Engine', 'Memory Management', 'Issue Tracking']
      },
      templateId: 'template-github-issue-enhancer',
      templateName: 'GitHub Issue Enhancer',
      highlights: [
        'NON-DESTRUCTIVE: Only appends context, never overwrites',
        'INTELLIGENT: Finds relevant code pointers automatically',
        'EFFICIENT: Memory-based deduplication prevents repeat work',
        'ACTIONABLE: Provides concrete next steps for developers',
        'COMPREHENSIVE: Deep code analysis with contextual insights'
      ],
      apiRequirements: {
        requiredKeys: ['githubApiKey'],
        displayNames: ['GitHub API Token']
      },
      modelConfig: {
        modelName: 'gemini-2.5-pro',
        configName: 'Gemini Pro Default',
        temperature: 0.3,
        maxTokens: 4096
      }
    },
    {
      id: 'agent-slack-reporter-gamma',
      name: 'ReportBot-Gamma',
      role: 'Slack Reporter',
      category: 'Development Support',
      description: 'An engineering assistant that continuously monitors GitHub repository activity and reports fresh updates to the #ai-code-updates Slack channel. Provides comprehensive code update digests with memory-based deduplication.',
      experienceLevel: 'Senior',
      hourlyRate: '$90-110/hour equivalent',
      avatar: {
        initials: 'RB',
        backgroundColor: '#FF5722',
        textColor: '#FFFFFF',
      },
      capabilities: {
        specialties: [
          'Continuous Repository Monitoring',
          'Automated Slack Reporting',
          'Code Update Digests',
          'Memory-based Deduplication',
          'Multi-channel Communication',
          'Activity Pattern Recognition'
        ],
        functionGroups: ['GitHub (Read)', 'Slack Communication', 'Agent Memory'],
        specificFunctions: [
          'github_read_issues',
          'github_read_code',
          'github_read_commits',
          'github_search_code',
          'slack_read_messages',
          'slack_list_channels',
          'slack_send_message',
          'slack_search_messages',
          'agent_memory_read',
          'agent_memory_write',
          'agent_memory_search',
          'agent_memory_clear'
        ],
        tools: ['GitHub API', 'Slack Bot API', 'Memory Management', 'Activity Monitoring']
      },
      templateId: 'template-slack-reporter',
      templateName: 'Slack Reporter',
      highlights: [
        'COMPREHENSIVE: Monitors issues, commits, and PRs automatically',
        'SMART: Memory prevents duplicate reports and spam',
        'TIMELY: Provides fresh updates on repository activity',
        'ACTIONABLE: Highlights what needs team attention',
        'EFFICIENT: Batches updates into digestible reports'
      ],
      apiRequirements: {
        requiredKeys: ['githubApiKey', 'SLACK_BOT_TOKEN'],
        displayNames: ['GitHub API Token', 'Slack Bot Token']
      },
      modelConfig: {
        modelName: 'gemini-2.5-pro',
        configName: 'Gemini Pro Default',
        temperature: 0.4,
        maxTokens: 3072
      }
    },
    {
      id: 'agent-autonomous-swe-legacy',
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
        modelName: 'gemini-2.5-pro',
        configName: 'Autonomous SWE Pro',
        temperature: 0.3,
        maxTokens: 4096
      }
    }
  ];
};