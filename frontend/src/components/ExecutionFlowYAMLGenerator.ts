import { ExecutionFlowEvent, FunctionCall, ExecutionStats } from '../types';

// Graph entity categories for different execution flow events
export enum GraphEntityCategory {
  PROMPT_START = 'PROMPT_START',
  AI_MODEL_CALL = 'AI_MODEL_CALL', 
  FUNCTION_CALL = 'FUNCTION_CALL',
  FUNCTION_RESPONSE = 'FUNCTION_RESPONSE',
  AI_RESPONSE = 'AI_RESPONSE',
  ERROR_EVENT = 'ERROR_EVENT',
  COMPLETION = 'COMPLETION',
  PARALLEL_GROUP = 'PARALLEL_GROUP'
}

// Connection types for execution flow
export enum GraphConnectionType {
  SEQUENCE_FLOW = 'Sequence_Flow',
  PARALLEL_BRANCH = 'Parallel_Branch',
  ERROR_FLOW = 'Error_Flow',
  FUNCTION_CALL = 'Function_Call',
  FUNCTION_RETURN = 'Function_Return',
  AI_INTERACTION = 'AI_Interaction'
}

// Graph entity for Gorph YAML
interface GraphEntity {
  id: string;
  category: string;
  description: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  owner: string;
  environment: string;
  tags?: string[];
  attributes: {
    duration?: string;
    sequence: number;
    eventType: string;
    timestamp: string;
    functionName?: string;
    errorMessage?: string;
    parallelGroup?: string;
  };
  shape?: string;
  icon?: string;
}

// Graph connection for Gorph YAML
interface GraphConnection {
  from: string;
  to: string;
  type: string;
  attributes?: {
    duration?: string;
    label?: string;
  };
}

// Complete graph structure
interface ExecutionFlowGraph {
  entities: GraphEntity[];
  connections: GraphConnection[];
  metadata: {
    executionRunId: string;
    totalEvents: number;
    totalDuration: string;
    parallelGroups: number;
  };
}

export class ExecutionFlowYAMLGenerator {
  private events: ExecutionFlowEvent[];
  private functionCalls: FunctionCall[];
  private stats?: ExecutionStats;
  private parallelGroups: Map<string, ExecutionFlowEvent[]> = new Map();

  constructor(events: ExecutionFlowEvent[], functionCalls: FunctionCall[], stats?: ExecutionStats) {
    this.events = events;
    this.functionCalls = functionCalls;
    this.stats = stats;
    this.identifyParallelGroups();
  }

  // Identify parallel execution groups based on timing and sequence
  private identifyParallelGroups(): void {
    const sortedEvents = [...this.events].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    let currentGroup: ExecutionFlowEvent[] = [];
    let currentSequenceRange = 0;

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];

      // Check if this could be part of a parallel group
      if (event.eventType === 'function_call_start' && 
          nextEvent?.eventType === 'function_call_start' &&
          Math.abs(event.sequenceNumber - nextEvent.sequenceNumber) <= 50) {
        
        if (currentGroup.length === 0) {
          currentGroup.push(event);
          currentSequenceRange = event.sequenceNumber;
        }
        
        if (Math.abs(nextEvent.sequenceNumber - currentSequenceRange) <= 100) {
          currentGroup.push(nextEvent);
        } else {
          // Finalize current group
          if (currentGroup.length > 1) {
            const groupId = `parallel_group_${currentGroup[0].sequenceNumber}`;
            this.parallelGroups.set(groupId, [...currentGroup]);
          }
          currentGroup = [nextEvent];
          currentSequenceRange = nextEvent.sequenceNumber;
        }
      } else {
        // Finalize any existing group
        if (currentGroup.length > 1) {
          const groupId = `parallel_group_${currentGroup[0].sequenceNumber}`;
          this.parallelGroups.set(groupId, [...currentGroup]);
        }
        currentGroup = [];
      }
    }

    // Handle final group
    if (currentGroup.length > 1) {
      const groupId = `parallel_group_${currentGroup[0].sequenceNumber}`;
      this.parallelGroups.set(groupId, [...currentGroup]);
    }
  }

  // Convert event type to graph category
  private getEntityCategory(eventType: string): string {
    switch (eventType) {
      case 'prompt_start': return GraphEntityCategory.PROMPT_START;
      case 'ai_model_call': return GraphEntityCategory.AI_MODEL_CALL;
      case 'function_call_start': return GraphEntityCategory.FUNCTION_CALL;
      case 'function_call_end': return GraphEntityCategory.FUNCTION_RESPONSE;
      case 'ai_response': return GraphEntityCategory.AI_RESPONSE;
      case 'error_occurred': return GraphEntityCategory.ERROR_EVENT;
      case 'execution_complete': return GraphEntityCategory.COMPLETION;
      default: return 'GENERAL';
    }
  }

  // Convert status to graph status
  private getEntityStatus(status: string): 'healthy' | 'degraded' | 'down' | 'unknown' {
    switch (status) {
      case 'success': return 'healthy';
      case 'error': return 'down';
      case 'timeout': return 'degraded';
      case 'pending': return 'unknown';
      default: return 'unknown';
    }
  }

  // Get beautiful description for event
  private getEntityDescription(event: ExecutionFlowEvent): string {
    const functionName = event.eventData?.function_name || event.eventData?.functionName;
    const modelName = event.eventData?.model || event.eventData?.modelName;
    
    switch (event.eventType) {
      case 'prompt_start':
        return '🚀 Execution Started';
      case 'ai_model_call':
        return `🤖 ${modelName || 'AI Model'} Call`;
      case 'function_call_start':
        return `🔧 ${functionName || 'Function'} Call`;
      case 'function_call_end':
        return `✅ ${functionName || 'Function'} Complete`;
      case 'ai_response':
        return `💬 AI Response (${modelName || 'Model'})`;
      case 'error_occurred':
        return `❌ Error: ${event.errorMessage?.substring(0, 50) || 'Unknown error'}`;
      case 'execution_complete':
        return '🎯 Execution Complete';
      default:
        return `📝 ${event.eventType.replace('_', ' ').toUpperCase()}`;
    }
  }

  // Format duration for display
  private formatDuration(durationMs?: number): string {
    if (!durationMs) return '';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  }

  // Get node shape based on event type
  private getNodeShape(eventType: string): string {
    switch (eventType) {
      case 'prompt_start': return 'ellipse';
      case 'ai_model_call': return 'box';
      case 'function_call_start': return 'diamond';
      case 'function_call_end': return 'diamond';
      case 'ai_response': return 'box';
      case 'error_occurred': return 'octagon';
      case 'execution_complete': return 'doublecircle';
      default: return 'box';
    }
  }

  // Generate graph entities from events
  private generateEntities(): GraphEntity[] {
    const entities: GraphEntity[] = [];
    const processedEvents = new Set<string>();

    // First, create parallel group entities
    for (const [groupId, groupEvents] of this.parallelGroups) {
      entities.push({
        id: groupId,
        category: GraphEntityCategory.PARALLEL_GROUP,
        description: `⚡ ${groupEvents.length} Parallel Functions`,
        status: 'healthy',
        owner: 'system',
        environment: 'execution',
        tags: ['parallel', 'group'],
        attributes: {
          sequence: Math.min(...groupEvents.map(e => e.sequenceNumber)),
          eventType: 'parallel_group',
          timestamp: groupEvents[0].createdAt,
          parallelGroup: groupId,
          duration: this.formatDuration(Math.max(...groupEvents.map(e => e.durationMs || 0)))
        },
        shape: 'box3d'
      });

      // Mark these events as processed
      groupEvents.forEach(event => processedEvents.add(event.id));
    }

    // Then create individual event entities
    for (const event of this.events) {
      if (processedEvents.has(event.id)) continue;

      const entity: GraphEntity = {
        id: event.id,
        category: this.getEntityCategory(event.eventType),
        description: this.getEntityDescription(event),
        status: this.getEntityStatus(event.status),
        owner: 'execution_engine',
        environment: 'runtime',
        attributes: {
          sequence: event.sequenceNumber,
          eventType: event.eventType,
          timestamp: event.createdAt,
          duration: this.formatDuration(event.durationMs)
        },
        shape: this.getNodeShape(event.eventType)
      };

      // Add function-specific attributes
      if (event.eventData?.function_name || event.eventData?.functionName) {
        entity.attributes.functionName = event.eventData.function_name || event.eventData.functionName;
        entity.tags = ['function'];
      }

      // Add error details
      if (event.errorMessage) {
        entity.attributes.errorMessage = event.errorMessage.substring(0, 100);
        entity.tags = (entity.tags || []).concat(['error']);
      }

      // Add AI model details
      if (event.eventData?.model || event.eventData?.modelName) {
        entity.tags = (entity.tags || []).concat(['ai_model']);
      }

      entities.push(entity);
    }

    return entities.sort((a, b) => a.attributes.sequence - b.attributes.sequence);
  }

  // Generate graph connections
  private generateConnections(): GraphConnection[] {
    const connections: GraphConnection[] = [];
    const sortedEvents = [...this.events].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // Create sequential connections
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];

      // Skip if either event is part of a parallel group
      const currentInParallel = Array.from(this.parallelGroups.values()).some(group => 
        group.some(e => e.id === currentEvent.id));
      const nextInParallel = Array.from(this.parallelGroups.values()).some(group => 
        group.some(e => e.id === nextEvent.id));

      if (currentInParallel || nextInParallel) continue;

      // Determine connection type
      let connectionType = GraphConnectionType.SEQUENCE_FLOW;
      if (currentEvent.eventType === 'function_call_start' && nextEvent.eventType === 'function_call_end') {
        connectionType = GraphConnectionType.FUNCTION_RETURN;
      } else if (currentEvent.eventType === 'ai_model_call' && nextEvent.eventType === 'ai_response') {
        connectionType = GraphConnectionType.AI_INTERACTION;
      } else if (nextEvent.eventType === 'error_occurred') {
        connectionType = GraphConnectionType.ERROR_FLOW;
      }

      connections.push({
        from: currentEvent.id,
        to: nextEvent.id,
        type: connectionType,
        attributes: {
          duration: this.formatDuration(nextEvent.durationMs),
          label: this.getConnectionLabel(connectionType)
        }
      });
    }

    // Create parent-child connections
    for (const event of this.events) {
      if (event.parentEventId) {
        const parentExists = this.events.some(e => e.id === event.parentEventId);
        if (parentExists) {
          connections.push({
            from: event.parentEventId,
            to: event.id,
            type: GraphConnectionType.SEQUENCE_FLOW,
            attributes: {
              label: 'spawns'
            }
          });
        }
      }
    }

    // Create connections from parallel groups
    for (const [groupId, groupEvents] of this.parallelGroups) {
      // Find the event before the group
      const firstGroupEvent = groupEvents.reduce((min, event) => 
        event.sequenceNumber < min.sequenceNumber ? event : min);
      
      const beforeGroupEvent = sortedEvents
        .filter(e => e.sequenceNumber < firstGroupEvent.sequenceNumber)
        .pop();

      if (beforeGroupEvent) {
        connections.push({
          from: beforeGroupEvent.id,
          to: groupId,
          type: GraphConnectionType.PARALLEL_BRANCH,
          attributes: {
            label: 'branches'
          }
        });
      }

      // Find the event after the group
      const lastGroupEvent = groupEvents.reduce((max, event) => 
        event.sequenceNumber > max.sequenceNumber ? event : max);
      
      const afterGroupEvent = sortedEvents
        .find(e => e.sequenceNumber > lastGroupEvent.sequenceNumber);

      if (afterGroupEvent) {
        connections.push({
          from: groupId,
          to: afterGroupEvent.id,
          type: GraphConnectionType.SEQUENCE_FLOW,
          attributes: {
            label: 'continues'
          }
        });
      }
    }

    return connections;
  }

  // Get connection label
  private getConnectionLabel(connectionType: string): string {
    switch (connectionType) {
      case GraphConnectionType.FUNCTION_CALL: return 'calls';
      case GraphConnectionType.FUNCTION_RETURN: return 'returns';
      case GraphConnectionType.AI_INTERACTION: return 'responds';
      case GraphConnectionType.ERROR_FLOW: return 'error';
      case GraphConnectionType.PARALLEL_BRANCH: return 'parallel';
      default: return '';
    }
  }

  // Generate complete execution flow graph
  public generateGraph(): ExecutionFlowGraph {
    const entities = this.generateEntities();
    const connections = this.generateConnections();

    const totalDuration = this.stats?.totalExecutionTimeMs || 
      Math.max(...this.events.map(e => e.durationMs || 0));

    return {
      entities,
      connections,
      metadata: {
        executionRunId: this.events[0]?.executionRunId || 'unknown',
        totalEvents: this.events.length,
        totalDuration: this.formatDuration(totalDuration),
        parallelGroups: this.parallelGroups.size
      }
    };
  }

  // Generate YAML string for Gorph
  public generateYAML(): string {
    const graph = this.generateGraph();
    
    const yamlLines: string[] = [];
    
    // Add metadata as comment
    yamlLines.push(`# Execution Flow Graph`);
    yamlLines.push(`# Run ID: ${graph.metadata.executionRunId}`);
    yamlLines.push(`# Total Events: ${graph.metadata.totalEvents}`);
    yamlLines.push(`# Total Duration: ${graph.metadata.totalDuration}`);
    yamlLines.push(`# Parallel Groups: ${graph.metadata.parallelGroups}`);
    yamlLines.push('');

    // Add entities
    yamlLines.push('entities:');
    for (const entity of graph.entities) {
      yamlLines.push(`  - id: ${entity.id}`);
      yamlLines.push(`    category: ${entity.category}`);
      yamlLines.push(`    description: "${entity.description}"`);
      yamlLines.push(`    status: ${entity.status}`);
      yamlLines.push(`    owner: ${entity.owner}`);
      yamlLines.push(`    environment: ${entity.environment}`);
      
      if (entity.tags && entity.tags.length > 0) {
        yamlLines.push(`    tags: [${entity.tags.map(tag => `"${tag}"`).join(', ')}]`);
      }
      
      yamlLines.push('    attributes:');
      for (const [key, value] of Object.entries(entity.attributes)) {
        if (value !== undefined && value !== '') {
          yamlLines.push(`      ${key}: "${value}"`);
        }
      }
      
      if (entity.shape) {
        yamlLines.push(`    shape: ${entity.shape}`);
      }
      
      yamlLines.push('');
    }

    // Add connections
    yamlLines.push('connections:');
    for (const connection of graph.connections) {
      yamlLines.push(`  - from: ${connection.from}`);
      yamlLines.push(`    to: ${connection.to}`);
      yamlLines.push(`    type: ${connection.type}`);
      
      if (connection.attributes) {
        yamlLines.push('    attributes:');
        for (const [key, value] of Object.entries(connection.attributes)) {
          if (value !== undefined && value !== '') {
            yamlLines.push(`      ${key}: "${value}"`);
          }
        }
      }
      
      yamlLines.push('');
    }

    return yamlLines.join('\n');
  }
}

// Export utility function
export function generateExecutionFlowYAML(
  events: ExecutionFlowEvent[], 
  functionCalls: FunctionCall[], 
  stats?: ExecutionStats
): string {
  const generator = new ExecutionFlowYAMLGenerator(events, functionCalls, stats);
  return generator.generateYAML();
}
