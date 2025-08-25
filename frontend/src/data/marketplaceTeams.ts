import { MarketplaceTeam } from '../types/marketplace';

export const generateMarketplaceTeams = (): MarketplaceTeam[] => {
  return [
    {
      id: 'team-development-support-alpha',
      name: 'Development Support Team',
      description: 'A comprehensive AI team that provides 24/7 development support through Slack monitoring, GitHub issue enhancement, and code update reporting. All agents start in standby mode for safe deployment. Perfect for engineering teams that want automated assistance with code reviews, issue management, and team communication.',
      category: 'Development Support',
      teamSize: 3,
      estimatedCost: '$300-450/month equivalent',
      avatar: {
        icon: '🚀',
        backgroundColor: '#007AFF',
        textColor: '#FFFFFF',
      },
      capabilities: {
        overview: [
          '24/7 Slack channel monitoring and response',
          'Automated GitHub issue enhancement with code pointers',
          'Real-time code update reporting to team channels',
          'Memory-driven state management across all agents',
          'Intelligent deduplication and workflow coordination'
        ],
        coverage: [
          'Slack Communication Management',
          'GitHub Issue Analysis & Enhancement', 
          'Repository Activity Monitoring',
          'Team Coordination & Updates',
          'Code Review Support'
        ],
        integrations: [
          'Slack (Full API Access)',
          'GitHub (Read/Write Access)',
          'Agent Memory System',
          'Team Memory Coordination'
        ]
      },
      agents: [
        {
          role: 'Slack Responder',
          name: 'SlackBot-Alpha',
          templateId: 'template-slack-responder',
          description: 'Monitors #ai-intern channel and provides intelligent responses to questions using real GitHub data',
          capabilities: [
            'Slack message monitoring and response',
            'GitHub data retrieval for accurate answers',
            'Memory-based conversation tracking',
            'Automatic response marking with ✅'
          ],
          defaultConfig: {
            maxTokensPerDay: 15000,
            heartbeatMinutes: 30,
            lifecycleStatus: 'STANDBY'
          }
        },
        {
          role: 'GitHub Issue Enhancer',
          name: 'IssueBot-Beta',
          templateId: 'template-github-issue-enhancer',
          description: 'Automatically enriches GitHub issues with relevant code pointers and actionable context',
          capabilities: [
            'Automated issue analysis and enhancement',
            'Code pointer generation with relevance scoring',
            'Safe, non-destructive issue updates',
            'Memory-driven deduplication via labels'
          ],
          defaultConfig: {
            maxTokensPerDay: 12000,
            heartbeatMinutes: 60,
            lifecycleStatus: 'STANDBY'
          }
        },
        {
          role: 'Slack Reporter',
          name: 'ReportBot-Gamma',
          templateId: 'template-slack-reporter',
          description: 'Monitors repository activity and provides concise updates to #ai-code-updates channel',
          capabilities: [
            'GitHub activity monitoring (issues, PRs, commits)',
            'Intelligent digest generation for teams',
            'Memory-based deduplication of reports',
            'Configurable reporting frequency'
          ],
          defaultConfig: {
            maxTokensPerDay: 18000,
            heartbeatMinutes: 120,
            lifecycleStatus: 'STANDBY'
          }
        }
      ],
      highlights: [
        'COMPLETE: End-to-end development workflow support',
        'INTELLIGENT: Memory-driven coordination prevents duplicate work',
        'SAFE: Non-destructive operations with comprehensive logging',
        'CONTROLLED: All agents start in standby mode for safe deployment',
        'SCALABLE: Handles multiple repositories and team channels',
        'PROVEN: Based on battle-tested development support patterns'
      ],
      apiRequirements: {
        requiredKeys: ['githubApiKey', 'SLACK_BOT_TOKEN'],
        displayNames: ['GitHub API Token', 'Slack Bot Token']
      },
      teamConfigId: 'team-config-development-support',
      testimonial: {
        text: 'This team transformed our development workflow. We get instant responses in Slack, our issues are automatically enriched with code context, and we never miss important repository updates. It\'s like having a dedicated DevOps team working 24/7.',
        author: 'Sarah Chen, Engineering Manager',
        rating: 5
      }
    },
    {
      id: 'team-autonomous-task-management-alpha',
      name: 'Autonomous Task Management Team',
      description: 'A fully autonomous AI team that manages end-to-end task orchestration through shared memory. Converts requests into structured tasks, executes them autonomously, and reports completion. Perfect for teams wanting hands-off automation of GitHub workflows, issue management, and task coordination.',
      category: 'Task Automation',
      teamSize: 3,
      estimatedCost: '$400-600/month equivalent',
      avatar: {
        icon: '🤖',
        backgroundColor: '#FF6B35',
        textColor: '#FFFFFF',
      },
      capabilities: {
        overview: [
          'Autonomous task creation from Slack/GitHub requests',
          'Intelligent task claiming and execution by specialized agents',
          'Full GitHub workflow automation (branches, PRs, issues, merges)',
          'Memory-driven state management and coordination',
          'Real-time progress reporting with Slack notifications'
        ],
        coverage: [
          'Request Processing & Task Creation',
          'GitHub Operations & Code Management', 
          'Issue Tracking & Pull Request Workflows',
          'Autonomous Task Execution & Completion',
          'Progress Monitoring & Team Communication'
        ],
        integrations: [
          'Slack (Full API Access)',
          'GitHub (Full Read/Write Access)',
          'Team Memory System',
          'Task Orchestration Engine'
        ]
      },
      agents: [
        {
          role: 'Task Creator',
          name: 'TaskCreator-Alpha',
          templateId: 'template-task-creator',
          description: 'Monitors communication channels and converts requests into structured, actionable tasks in team memory',
          capabilities: [
            'Slack and GitHub request monitoring',
            'Intelligent task decomposition and structuring',
            'Priority assignment and capability mapping',
            'Memory-based duplicate detection and coordination'
          ],
          defaultConfig: {
            maxTokensPerDay: 12000,
            heartbeatMinutes: 15,
            lifecycleStatus: 'STANDBY'
          }
        },
        {
          role: 'Task Executor',
          name: 'TaskExecutor-Beta',
          templateId: 'template-task-executor',
          description: 'Claims and executes tasks autonomously using GitHub and Slack integrations with comprehensive result tracking',
          capabilities: [
            'Autonomous task claiming and execution',
            'Full GitHub workflow operations (branches, files, PRs)',
            'Slack communication and team coordination',
            'Comprehensive result tracking and artifact creation'
          ],
          defaultConfig: {
            maxTokensPerDay: 25000,
            heartbeatMinutes: 10,
            lifecycleStatus: 'STANDBY'
          }
        },
        {
          role: 'Task Reporter',
          name: 'TaskReporter-Gamma',
          templateId: 'template-task-reporter',
          description: 'Monitors task status and provides real-time updates, daily summaries, and progress metrics to team channels',
          capabilities: [
            'Real-time task status monitoring and reporting',
            'Daily/weekly team productivity summaries',
            'Progress tracking with metrics and insights',
            'Slack notification management and formatting'
          ],
          defaultConfig: {
            maxTokensPerDay: 15000,
            heartbeatMinutes: 30,
            lifecycleStatus: 'STANDBY'
          }
        }
      ],
      highlights: [
        'AUTONOMOUS: Fully hands-off task management from request to completion',
        'INTELLIGENT: Memory-driven coordination prevents conflicts and duplicates',
        'COMPREHENSIVE: End-to-end GitHub workflow automation',
        'TRANSPARENT: Real-time progress updates and detailed reporting',
        'SCALABLE: Handles complex multi-step workflows and dependencies',
        'SAFE: Controlled deployment with standby mode for testing'
      ],
      apiRequirements: {
        requiredKeys: ['githubApiKey', 'SLACK_BOT_TOKEN'],
        displayNames: ['GitHub API Token', 'Slack Bot Token']
      },
      teamConfigId: 'team-config-autonomous-task-management',
      testimonial: {
        text: 'This team is like having a senior developer working 24/7. It takes our Slack requests, breaks them into tasks, executes everything autonomously, and keeps us updated. Our GitHub workflows are completely automated now and we never miss follow-ups.',
        author: 'Michael Rodriguez, CTO',
        rating: 5
      }
    }
  ];
};
