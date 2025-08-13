import { Agent, LifecycleStatus } from '../types';

/**
 * Generate template-based agents for display in AgentsScreen
 * These agents represent the new development support templates we've created
 */
export const generateTemplateAgents = (): Agent[] => {
  const baseDate = new Date();
  const createdAt = new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week ago
  const updatedAt = new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
  const tokensResetDate = baseDate.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

  return [
    {
      id: 'template-agent-slack-responder-001',
      userId: 'template-user',
      firstName: 'ChatBot',
      lastName: 'Alpha',
      templateId: 'template-slack-responder',
      templateName: 'Slack Responder',
      templateDescription: 'An AI assistant that monitors and responds to questions in the #ai-intern Slack channel. Has full access to Slack functions and GitHub read/write capabilities for issues to provide comprehensive answers based on real repository data.',
      maxTokensPerDay: 15000,
      heartbeatMinutes: 30,
      lifecycleStatus: 'STANDBY' as LifecycleStatus,
      status: 'STANDBY' as LifecycleStatus,
      tokensUsedToday: 3240,
      tokensResetDate,
      lastExecutionAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      nextScheduledAt: new Date(baseDate.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      totalExecutions: 18,
      createdAt,
      updatedAt,
      memorySizeBytes: 2048,
      memoryUpdatedAt: new Date(baseDate.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
    {
      id: 'template-agent-github-enhancer-001',
      userId: 'template-user',
      firstName: 'IssueBot',
      lastName: 'Beta',
      templateId: 'template-github-issue-enhancer',
      templateName: 'GitHub Issue Enhancer',
      templateDescription: 'An engineering assistant that keeps GitHub issues actionable by finding relevant code pointers and appending helpful context. Focuses on code analysis and issue enrichment with safe, non-destructive updates.',
      maxTokensPerDay: 12000,
      heartbeatMinutes: 45,
      lifecycleStatus: 'STANDBY' as LifecycleStatus,
      status: 'STANDBY' as LifecycleStatus,
      tokensUsedToday: 1890,
      tokensResetDate,
      lastExecutionAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      nextScheduledAt: new Date(baseDate.getTime() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
      totalExecutions: 12,
      createdAt,
      updatedAt,
      memorySizeBytes: 1536,
      memoryUpdatedAt: new Date(baseDate.getTime() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    },
    {
      id: 'template-agent-slack-reporter-001',
      userId: 'template-user',
      firstName: 'ReportBot',
      lastName: 'Gamma',
      templateId: 'template-slack-reporter',
      templateName: 'Slack Reporter',
      templateDescription: 'An engineering assistant that continuously monitors GitHub repository activity and reports fresh updates to the #ai-code-updates Slack channel. Provides comprehensive code update digests with memory-based deduplication.',
      maxTokensPerDay: 18000,
      heartbeatMinutes: 60,
      lifecycleStatus: 'STANDBY' as LifecycleStatus,
      status: 'STANDBY' as LifecycleStatus,
      tokensUsedToday: 5670,
      tokensResetDate,
      lastExecutionAt: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      nextScheduledAt: new Date(baseDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      totalExecutions: 24,
      createdAt,
      updatedAt,
      memorySizeBytes: 3072,
      memoryUpdatedAt: new Date(baseDate.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    },
  ];
};

/**
 * Generate a complete development support team with all template agents
 * This represents what users would get when they deploy the "Development Support Team" from the marketplace
 */
export const generateDevelopmentSupportTeam = () => {
  const teamId = 'template-team-dev-support-001';
  const agents = generateTemplateAgents().map(agent => ({
    ...agent,
    teamId,
    teamName: 'Development Support Team',
  }));

  return {
    teamId,
    teamName: 'Development Support Team',
    teamDescription: 'A comprehensive AI team that provides 24/7 development support through Slack monitoring, GitHub issue enhancement, and code update reporting. All agents start in standby mode for safe deployment.',
    agents,
  };
};

/**
 * Check if an agent is a template-based agent
 */
export const isTemplateAgent = (agentId: string): boolean => {
  return agentId.startsWith('template-agent-');
};

/**
 * Get template agent by template ID
 */
export const getTemplateAgentByTemplateId = (templateId: string): Agent | undefined => {
  return generateTemplateAgents().find(agent => agent.templateId === templateId);
};

/**
 * Get all available template IDs
 */
export const getAvailableTemplateIds = (): string[] => {
  return generateTemplateAgents().map(agent => agent.templateId);
};
