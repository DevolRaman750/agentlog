import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  Dimensions, 
  Platform,
  PanResponder,
  Animated,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import { generateExecutionFlowYAML } from './ExecutionFlowYAMLGenerator';
import ExecutionFlowWASMBridge, { ExecutionFlowWASMBridgeRef } from './ExecutionFlowWASMBridge';

// Use the same interfaces as the main ExecutionFlowGraph component
interface ExecutionFlowEvent {
  id: string;
  executionRunId: string;
  requestId?: string;
  eventType: 'prompt_start' | 'ai_model_call' | 'function_call_start' | 'function_call_end' | 'ai_response' | 'error_occurred' | 'retry_attempt' | 'execution_complete';
  sequenceNumber: number;
  parentEventId?: string;
  eventData?: any;
  durationMs?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  errorMessage?: string;
  createdAt: string;
}

interface FunctionCall {
  id: string;
  request_id: string;
  function_name: string;
  function_arguments: any;
  function_response?: any;
  execution_status: string;
  execution_time_ms?: number;
  error_details?: string;
  created_at: string;
  sequence_number: number;
  parent_call_id?: string;
  execution_depth: number;
}

interface ExecutionStats {
  id: string;
  executionRunId: string;
  totalFunctionCalls: number;
  totalAIModelCalls: number;
  totalErrors: number;
  totalRetries: number;
  totalExecutionTimeMs: number;
  avgFunctionCallTimeMs: number;
  avgAIResponseTimeMs: number;
  maxExecutionDepth: number;
  functionCallBreakdown?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionFlowGraphVisualizationProps {
  events: ExecutionFlowEvent[];
  functionCalls: FunctionCall[];
  stats?: ExecutionStats;
  executionRunId: string;
  visible: boolean;
  onClose: () => void;
  onNodeClick?: (event: ExecutionFlowEvent) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ExecutionFlowGraphVisualization: React.FC<ExecutionFlowGraphVisualizationProps> = ({
  events,
  functionCalls,
  stats,
  executionRunId,
  visible,
  onClose,
  onNodeClick
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphSVG, setGraphSVG] = useState<string | null>(null);
  const [yamlContent, setYamlContent] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<ExecutionFlowEvent | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showYAMLModal, setShowYAMLModal] = useState(false);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [progress, setProgress] = useState({ stage: 'Initializing', percentage: 0 });

  const wasmBridgeRef = useRef<ExecutionFlowWASMBridgeRef>(null);
  const webViewRef = useRef<WebView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Pan and zoom state for mobile optimization
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateXValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(0)).current;

  // Generate graph when component mounts or data changes
  useEffect(() => {
    if (visible && events.length > 0 && bridgeReady) {
      generateGraph();
    }
  }, [visible, events, functionCalls, stats, bridgeReady]);

  // Generate the graph visualization
  const generateGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress({ stage: 'Generating YAML', percentage: 10 });

      console.log('🎨 Generating execution flow graph for', events.length, 'events');

      // Generate YAML from execution flow data
      const yaml = generateExecutionFlowYAML(events, functionCalls, stats);
      setYamlContent(yaml);
      setProgress({ stage: 'Converting to DOT', percentage: 40 });

      // Convert YAML to DOT using WASM bridge
      if (wasmBridgeRef.current) {
        const dotResult = await wasmBridgeRef.current.yamlToDot(yaml);
        
        if (dotResult.success && dotResult.dot) {
          setProgress({ stage: 'Rendering Graph', percentage: 80 });
          
          // For now, we'll create a beautiful HTML representation
          // In a full implementation, this would generate actual SVG from DOT
          const htmlGraph = generateHTMLGraph(dotResult.dot);
          setGraphSVG(htmlGraph);
          
          setProgress({ stage: 'Complete', percentage: 100 });
          console.log('✅ Graph generation complete');
        } else {
          throw new Error(dotResult.error || 'Failed to convert YAML to DOT');
        }
      } else {
        throw new Error('WASM bridge not available');
      }
    } catch (err: any) {
      console.error('❌ Graph generation error:', err);
      setError(err.message || 'Failed to generate graph');
    } finally {
      setLoading(false);
    }
  }, [events, functionCalls, stats]);

  // Generate HTML representation of the graph for mobile optimization
  const generateHTMLGraph = (dotContent: string): string => {
    const nodes = events.map(event => ({
      id: event.id,
      label: getNodeLabel(event),
      type: event.eventType,
      status: event.status,
      x: Math.random() * 800 + 100, // Temporary positioning
      y: event.sequenceNumber * 80 + 100,
      event
    }));

    const connections = [];
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      connections.push({
        from: current.id,
        to: next.id,
        type: 'sequence'
      });
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
          <title>Execution Flow Graph</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
              overflow: hidden;
              touch-action: manipulation;
            }
            .graph-container {
              position: relative;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
              cursor: grab;
            }
            .graph-container.grabbing { cursor: grabbing; }
            .graph-canvas {
              position: absolute;
              top: 0;
              left: 0;
              transform-origin: 0 0;
              transition: transform 0.1s ease-out;
            }
            .node {
              position: absolute;
              min-width: 140px;
              max-width: 280px;
              padding: 12px 16px;
              border-radius: 12px;
              backdrop-filter: blur(20px);
              border: 2px solid rgba(255,255,255,0.1);
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              user-select: none;
            }
            .node:hover {
              transform: scale(1.05) translateY(-4px);
              box-shadow: 0 16px 48px rgba(0,0,0,0.4);
              border-color: rgba(255,255,255,0.3);
            }
            .node:active {
              transform: scale(0.98);
            }
            .node-prompt { background: linear-gradient(135deg, #32D74B, #30B0C7); }
            .node-ai { background: linear-gradient(135deg, #007AFF, #5856D6); }
            .node-function { background: linear-gradient(135deg, #FF9500, #FF6B35); }
            .node-response { background: linear-gradient(135deg, #34C759, #32D74B); }
            .node-error { background: linear-gradient(135deg, #FF3B30, #FF6B5A); }
            .node-complete { background: linear-gradient(135deg, #30B0C7, #5856D6); }
            .node-title {
              font-size: 14px;
              font-weight: 700;
              color: white;
              margin-bottom: 4px;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .node-subtitle {
              font-size: 12px;
              color: rgba(255,255,255,0.85);
              line-height: 1.3;
            }
            .node-meta {
              font-size: 10px;
              color: rgba(255,255,255,0.7);
              margin-top: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .connection {
              position: absolute;
              pointer-events: none;
              z-index: 0;
            }
            .connection-line {
              stroke: rgba(255,255,255,0.4);
              stroke-width: 2;
              fill: none;
              stroke-dasharray: 5,5;
              animation: dash 20s linear infinite;
            }
            .connection-arrow {
              fill: rgba(255,255,255,0.6);
            }
            @keyframes dash {
              to { stroke-dashoffset: -200; }
            }
            .controls {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1000;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .control-btn {
              width: 44px;
              height: 44px;
              border-radius: 22px;
              background: rgba(0,0,0,0.7);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255,255,255,0.2);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              font-size: 18px;
            }
            .control-btn:hover {
              background: rgba(0,0,0,0.8);
              transform: scale(1.1);
            }
            .info-panel {
              position: fixed;
              bottom: 20px;
              left: 20px;
              right: 20px;
              background: rgba(0,0,0,0.8);
              backdrop-filter: blur(20px);
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.1);
              padding: 16px;
              color: white;
              font-size: 12px;
              z-index: 1000;
            }
            @media (max-width: 768px) {
              .node { 
                min-width: 120px; 
                max-width: 200px; 
                padding: 10px 12px; 
              }
              .node-title { font-size: 13px; }
              .node-subtitle { font-size: 11px; }
              .node-meta { font-size: 9px; }
              .controls { top: 10px; right: 10px; }
              .info-panel { 
                bottom: 10px; 
                left: 10px; 
                right: 10px; 
                padding: 12px; 
              }
            }
          </style>
        </head>
        <body>
          <div class="graph-container" id="graphContainer">
            <div class="graph-canvas" id="graphCanvas">
              <svg id="connections" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;">
                ${connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return '';
                  
                  const x1 = fromNode.x + 70;
                  const y1 = fromNode.y + 30;
                  const x2 = toNode.x + 70;
                  const y2 = toNode.y + 30;
                  
                  return \`
                    <path class="connection-line" d="M\$\{x1\},\$\{y1\} Q\$\{(x1+x2)/2\},\$\{y1-50\} \$\{x2\},\$\{y2\}" />
                    <polygon class="connection-arrow" points="\$\{x2-5\},\$\{y2-5\} \$\{x2+5\},\$\{y2-5\} \$\{x2\},\$\{y2+5\}" />
                  \`;
                }).join('')}
              </svg>
              ${nodes.map(node => \`
                <div class="node node-\$\{getNodeClass(node.type)\}" 
                     style="left: \$\{node.x\}px; top: \$\{node.y\}px;"
                     data-node-id="\$\{node.id\}"
                     onclick="handleNodeClick('\$\{node.id\}')">
                  <div class="node-title">\$\{getNodeIcon(node.type)\} \$\{node.label\}</div>
                  <div class="node-subtitle">Seq: #\$\{node.event.sequenceNumber\}</div>
                  <div class="node-meta">
                    <span>\$\{formatDuration(node.event.durationMs)\}</span>
                    <span class="status-\$\{node.status\}">\$\{node.status.toUpperCase()\}</span>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
          
          <div class="controls">
            <div class="control-btn" onclick="zoomIn()">+</div>
            <div class="control-btn" onclick="zoomOut()">−</div>
            <div class="control-btn" onclick="resetView()">⌂</div>
          </div>
          
          <div class="info-panel">
            <strong>Execution Flow Graph</strong><br>
            Events: ${events.length} • Duration: ${formatDuration(stats?.totalExecutionTimeMs)} • Functions: ${stats?.totalFunctionCalls || 0}
            <br><small>Tap nodes for details • Pinch to zoom • Drag to pan</small>
          </div>

          <script>
            let currentScale = 1;
            let currentX = 0;
            let currentY = 0;
            let isDragging = false;
            let lastTouchX = 0;
            let lastTouchY = 0;
            let lastTouchDistance = 0;

            function getNodeClass(type) {
              switch(type) {
                case 'prompt_start': return 'prompt';
                case 'ai_model_call': return 'ai';
                case 'function_call_start':
                case 'function_call_end': return 'function';
                case 'ai_response': return 'response';
                case 'error_occurred': return 'error';
                case 'execution_complete': return 'complete';
                default: return 'ai';
              }
            }

            function getNodeIcon(type) {
              switch(type) {
                case 'prompt_start': return '🚀';
                case 'ai_model_call': return '🤖';
                case 'function_call_start': return '🔧';
                case 'function_call_end': return '✅';
                case 'ai_response': return '💬';
                case 'error_occurred': return '❌';
                case 'execution_complete': return '🎯';
                default: return '📝';
              }
            }

            function formatDuration(ms) {
              if (!ms) return '';
              return ms < 1000 ? \`\$\{ms\}ms\` : \`\$\{(ms/1000).toFixed(1)\}s\`;
            }

            function handleNodeClick(nodeId) {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'nodeClick',
                nodeId: nodeId
              }));
            }

            function updateTransform() {
              const canvas = document.getElementById('graphCanvas');
              canvas.style.transform = \`translate(\$\{currentX\}px, \$\{currentY\}px) scale(\$\{currentScale\})\`;
            }

            function zoomIn() {
              currentScale = Math.min(currentScale * 1.2, 3);
              updateTransform();
            }

            function zoomOut() {
              currentScale = Math.max(currentScale / 1.2, 0.3);
              updateTransform();
            }

            function resetView() {
              currentScale = 1;
              currentX = 0;
              currentY = 0;
              updateTransform();
            }

            // Touch handling for mobile
            const container = document.getElementById('graphContainer');

            container.addEventListener('touchstart', (e) => {
              if (e.touches.length === 1) {
                isDragging = true;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
                container.classList.add('grabbing');
              } else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.sqrt(
                  Math.pow(touch2.clientX - touch1.clientX, 2) +
                  Math.pow(touch2.clientY - touch1.clientY, 2)
                );
              }
              e.preventDefault();
            });

            container.addEventListener('touchmove', (e) => {
              if (e.touches.length === 1 && isDragging) {
                const deltaX = e.touches[0].clientX - lastTouchX;
                const deltaY = e.touches[0].clientY - lastTouchY;
                currentX += deltaX;
                currentY += deltaY;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
                updateTransform();
              } else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                  Math.pow(touch2.clientX - touch1.clientX, 2) +
                  Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                if (lastTouchDistance > 0) {
                  const scale = distance / lastTouchDistance;
                  currentScale = Math.max(0.3, Math.min(3, currentScale * scale));
                  updateTransform();
                }
                lastTouchDistance = distance;
              }
              e.preventDefault();
            });

            container.addEventListener('touchend', () => {
              isDragging = false;
              container.classList.remove('grabbing');
            });

            // Mouse handling for desktop
            container.addEventListener('mousedown', (e) => {
              isDragging = true;
              lastTouchX = e.clientX;
              lastTouchY = e.clientY;
              container.classList.add('grabbing');
              e.preventDefault();
            });

            container.addEventListener('mousemove', (e) => {
              if (isDragging) {
                const deltaX = e.clientX - lastTouchX;
                const deltaY = e.clientY - lastTouchY;
                currentX += deltaX;
                currentY += deltaY;
                lastTouchX = e.clientX;
                lastTouchY = e.clientY;
                updateTransform();
              }
            });

            container.addEventListener('mouseup', () => {
              isDragging = false;
              container.classList.remove('grabbing');
            });

            container.addEventListener('wheel', (e) => {
              const delta = e.deltaY > 0 ? 0.9 : 1.1;
              currentScale = Math.max(0.3, Math.min(3, currentScale * delta));
              updateTransform();
              e.preventDefault();
            });

            // Initialize
            document.addEventListener('DOMContentLoaded', () => {
              console.log('🎨 Execution Flow Graph initialized');
              resetView();
            });
          </script>
        </body>
      </html>
    `;
  };

  // Helper functions
  const getNodeLabel = (event: ExecutionFlowEvent): string => {
    const functionName = event.eventData?.function_name || event.eventData?.functionName;
    const modelName = event.eventData?.model || event.eventData?.modelName;
    
    switch (event.eventType) {
      case 'prompt_start': return 'Start';
      case 'ai_model_call': return modelName || 'AI Call';
      case 'function_call_start': return functionName || 'Function';
      case 'function_call_end': return `${functionName} Done` || 'Complete';
      case 'ai_response': return 'AI Response';
      case 'error_occurred': return 'Error';
      case 'execution_complete': return 'Complete';
      default: return event.eventType;
    }
  };

  const formatDuration = (durationMs?: number): string => {
    if (!durationMs) return '';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  // Handle WASM bridge events
  const handleBridgeReady = useCallback(() => {
    console.log('🌉 WASM Bridge ready');
    setBridgeReady(true);
  }, []);

  const handleBridgeError = useCallback((error: string) => {
    console.error('🌉 WASM Bridge error:', error);
    setError(error);
    setLoading(false);
  }, []);

  const handleProgress = useCallback((progressData: { stage: string; percentage: number }) => {
    setProgress(progressData);
  }, []);

  // Handle WebView messages (node clicks, etc.)
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'nodeClick') {
        const clickedEvent = events.find(e => e.id === message.nodeId);
        if (clickedEvent) {
          setSelectedNode(clickedEvent);
          setShowNodeModal(true);
          onNodeClick?.(clickedEvent);
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [events, onNodeClick]);

  // Export graph functionality
  const exportGraph = useCallback(() => {
    Alert.alert(
      'Export Graph',
      'Choose export format:',
      [
        { text: 'YAML', onPress: () => setShowYAMLModal(true) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* WASM Bridge */}
      <ExecutionFlowWASMBridge
        ref={wasmBridgeRef}
        onReady={handleBridgeReady}
        onError={handleBridgeError}
        onProgress={handleProgress}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🎨 Graph View</Text>
          <Text style={styles.subtitle}>{events.length} events</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={exportGraph} style={styles.headerButton}>
            <Ionicons name="download-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#1D1D1F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#007AFF" style={styles.loadingSpinner} />
            <Text style={styles.loadingTitle}>{progress.stage}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
            </View>
            <Text style={styles.loadingSubtitle}>{progress.percentage}% complete</Text>
          </View>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Graph Generation Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generateGraph}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Graph Display */}
      {graphSVG && !loading && !error && (
        <View style={styles.graphContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: graphSVG }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scalesPageToFit={Platform.OS === 'android'}
            startInLoadingState={false}
          />
        </View>
      )}

      {/* Node Detail Modal */}
      <Modal
        visible={showNodeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNodeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNodeModal(false)}>
              <Text style={styles.modalCloseButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          {selectedNode && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.nodeDetailCard}>
                <View style={styles.nodeDetailHeader}>
                  <Text style={styles.nodeDetailIcon}>
                    {selectedNode.eventType === 'prompt_start' ? '🚀' :
                     selectedNode.eventType === 'ai_model_call' ? '🤖' :
                     selectedNode.eventType === 'function_call_start' ? '🔧' :
                     selectedNode.eventType === 'function_call_end' ? '✅' :
                     selectedNode.eventType === 'ai_response' ? '💬' :
                     selectedNode.eventType === 'error_occurred' ? '❌' :
                     selectedNode.eventType === 'execution_complete' ? '🎯' : '📝'}
                  </Text>
                  <View style={styles.nodeDetailInfo}>
                    <Text style={styles.nodeDetailType}>
                      {selectedNode.eventType.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.nodeDetailSequence}>
                      Sequence #{selectedNode.sequenceNumber}
                    </Text>
                  </View>
                  <View style={[styles.nodeDetailStatus, { 
                    backgroundColor: selectedNode.status === 'success' ? '#34C759' :
                                   selectedNode.status === 'error' ? '#FF3B30' :
                                   selectedNode.status === 'timeout' ? '#FF9500' : '#8E8E93'
                  }]}>
                    <Text style={styles.nodeDetailStatusText}>
                      {selectedNode.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {selectedNode.durationMs && (
                  <View style={styles.nodeDetailSection}>
                    <Text style={styles.nodeDetailSectionTitle}>⏱️ Timing</Text>
                    <Text style={styles.nodeDetailValue}>
                      Duration: {formatDuration(selectedNode.durationMs)}
                    </Text>
                    <Text style={styles.nodeDetailValue}>
                      Created: {new Date(selectedNode.createdAt).toLocaleString()}
                    </Text>
                  </View>
                )}

                {selectedNode.eventData && (
                  <View style={styles.nodeDetailSection}>
                    <Text style={styles.nodeDetailSectionTitle}>📄 Event Data</Text>
                    <View style={styles.nodeDetailDataContainer}>
                      <Text style={styles.nodeDetailData}>
                        {JSON.stringify(selectedNode.eventData, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedNode.errorMessage && (
                  <View style={styles.nodeDetailSection}>
                    <Text style={styles.nodeDetailSectionTitle}>❌ Error Details</Text>
                    <View style={styles.nodeDetailErrorContainer}>
                      <Text style={styles.nodeDetailError}>
                        {selectedNode.errorMessage}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* YAML Modal */}
      <Modal
        visible={showYAMLModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowYAMLModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowYAMLModal(false)}>
              <Text style={styles.modalCloseButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Graph YAML</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.yamlContainer}>
              <Text style={styles.yamlContent}>{yamlContent}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  graphContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  headerSpacer: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  nodeDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  nodeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  nodeDetailIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  nodeDetailInfo: {
    flex: 1,
  },
  nodeDetailType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  nodeDetailSequence: {
    fontSize: 14,
    color: '#8E8E93',
  },
  nodeDetailStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nodeDetailStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  nodeDetailSection: {
    marginBottom: 20,
  },
  nodeDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  nodeDetailValue: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 4,
  },
  nodeDetailDataContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  nodeDetailData: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1D1D1F',
    lineHeight: 16,
  },
  nodeDetailErrorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  nodeDetailError: {
    fontSize: 14,
    color: '#FF3B30',
    lineHeight: 20,
  },
  yamlContainer: {
    backgroundColor: '#1D1D1F',
    borderRadius: 12,
    padding: 16,
  },
  yamlContent: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#FFFFFF',
    lineHeight: 16,
  },
});

export default ExecutionFlowGraphVisualization;
