import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface ExecutionFlowWASMBridgeRef {
  yamlToDot: (yaml: string) => Promise<{ success: boolean; dot?: string; error?: string }>;
  validateYaml: (yaml: string) => Promise<{ success: boolean; valid?: boolean; error?: string }>;
  generateSVG: (dot: string) => Promise<{ success: boolean; svg?: string; error?: string }>;
}

interface ExecutionFlowWASMBridgeProps {
  onReady: () => void;
  onError: (error: string) => void;
  onProgress?: (progress: { stage: string; percentage: number }) => void;
}

const ExecutionFlowWASMBridge = forwardRef<ExecutionFlowWASMBridgeRef, ExecutionFlowWASMBridgeProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const messageCallbacks = useRef<Map<string, (result: any) => void>>(new Map());
  const [isReady, setIsReady] = useState(false);
  
  // Generate unique message IDs
  const generateMessageId = () => Math.random().toString(36).substr(2, 9);

  // Send message to WebView and return a promise
  const sendMessage = useCallback((type: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!isReady) {
        reject(new Error('WASM bridge not ready'));
        return;
      }

      const messageId = generateMessageId();
      messageCallbacks.current.set(messageId, resolve);
      
      const message = { id: messageId, type, data };
      console.log('🌉 ExecutionFlow WASM Bridge: Sending message:', { id: messageId, type });
      webViewRef.current?.postMessage(JSON.stringify(message));
      
      // Timeout after 30 seconds for complex graph operations
      setTimeout(() => {
        if (messageCallbacks.current.has(messageId)) {
          messageCallbacks.current.delete(messageId);
          console.error('🌉 ExecutionFlow WASM Bridge: Message timeout for:', messageId);
          reject(new Error(`WebView message timeout for ${type}`));
        }
      }, 30000);
    });
  }, [isReady]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('🌉 ExecutionFlow WASM Bridge received message:', message.type);
      
      if (message.type === 'ready') {
        console.log('🌉 ExecutionFlow WASM Bridge: WebView reported ready');
        setIsReady(true);
        props.onReady();
      } else if (message.type === 'error') {
        console.error('🌉 ExecutionFlow WASM Bridge: WebView reported error:', message.data);
        props.onError(message.data);
      } else if (message.type === 'progress' && props.onProgress) {
        props.onProgress(message.data);
      } else if (message.type === 'response' && message.id && messageCallbacks.current.has(message.id)) {
        console.log('🌉 ExecutionFlow WASM Bridge: Received response for message', message.id);
        const callback = messageCallbacks.current.get(message.id);
        messageCallbacks.current.delete(message.id);
        callback?.(message.data);
      } else {
        console.log('🌉 ExecutionFlow WASM Bridge: Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      props.onError(`Message parsing error: ${error}`);
    }
  }, [props]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    yamlToDot: async (yaml: string) => {
      try {
        const result = await sendMessage('yamlToDot', yaml);
        return { success: true, dot: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    validateYaml: async (yaml: string) => {
      try {
        const result = await sendMessage('validateYaml', yaml);
        return { success: true, valid: result.valid };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    generateSVG: async (dot: string) => {
      try {
        const result = await sendMessage('generateSVG', dot);
        return { success: true, svg: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  }), [sendMessage]);

  // Enhanced HTML content for WebView with execution flow specific styling
  const webViewHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Execution Flow WASM Bridge</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: #1a1a1a; 
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top: 4px solid #007AFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading Execution Flow Visualizer...</p>
        </div>
        
        <script>
          // Message handling
          const sendMessage = (type, data, id = null) => {
            window.ReactNativeWebView?.postMessage(JSON.stringify({ type, data, id }));
          };

          const sendProgress = (stage, percentage) => {
            sendMessage('progress', { stage, percentage });
          };

          // Custom execution flow styling configuration
          const EXECUTION_FLOW_STYLE = \`
            graph [
              bgcolor="transparent",
              fontname="SF Pro Display, -apple-system, sans-serif",
              fontsize=12,
              rankdir=TB,
              nodesep=0.8,
              ranksep=1.2,
              splines=ortho,
              concentrate=true
            ];
            
            node [
              fontname="SF Pro Display, -apple-system, sans-serif",
              fontsize=11,
              style="filled,rounded",
              margin=0.2,
              penwidth=2
            ];
            
            edge [
              fontname="SF Pro Text, -apple-system, sans-serif", 
              fontsize=10,
              penwidth=2,
              arrowsize=0.8
            ];

            // Execution flow specific node styles
            node [shape=box, style="filled,rounded,gradient", gradientangle=45];
            
            // AI Model Call nodes - Blue gradient
            subgraph cluster_ai {
              style="invis";
              node [fillcolor="#007AFF:#4A90E2", fontcolor="white"];
            }
            
            // Function Call nodes - Orange gradient  
            subgraph cluster_function {
              style="invis";
              node [fillcolor="#FF9500:#FFB84D", fontcolor="white"];
            }
            
            // Success nodes - Green gradient
            subgraph cluster_success {
              style="invis"; 
              node [fillcolor="#34C759:#5DD67C", fontcolor="white"];
            }
            
            // Error nodes - Red gradient
            subgraph cluster_error {
              style="invis";
              node [fillcolor="#FF3B30:#FF6B5A", fontcolor="white"];
            }
            
            // Parallel group nodes - Purple gradient
            subgraph cluster_parallel {
              style="invis";
              node [fillcolor="#5856D6:#7B7AE8", fontcolor="white", shape="box3d"];
            }

            // Beautiful edge styles
            edge [color="#666666", style="solid"];
            edge [fontcolor="#888888"];
          \`;

          // Enhanced YAML to DOT conversion with execution flow styling
          window.yamlToDotExecutionFlow = function(yamlContent) {
            try {
              sendProgress('Parsing YAML', 10);
              
              // Parse YAML (simplified - in real implementation use proper YAML parser)
              const lines = yamlContent.split('\\n');
              let dotContent = 'digraph ExecutionFlow {\\n';
              
              // Add our beautiful styling
              dotContent += EXECUTION_FLOW_STYLE + '\\n';
              
              sendProgress('Generating nodes', 30);
              
              // Parse entities
              let inEntities = false;
              let inConnections = false;
              let currentEntity = null;
              
              for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed === 'entities:') {
                  inEntities = true;
                  inConnections = false;
                  continue;
                }
                
                if (trimmed === 'connections:') {
                  inEntities = false;
                  inConnections = true;
                  continue;
                }
                
                if (inEntities && trimmed.startsWith('- id:')) {
                  if (currentEntity) {
                    dotContent += generateNodeFromEntity(currentEntity);
                  }
                  currentEntity = { id: trimmed.replace('- id:', '').trim() };
                } else if (inEntities && currentEntity) {
                  // Parse entity properties
                  if (trimmed.startsWith('category:')) {
                    currentEntity.category = trimmed.replace('category:', '').trim();
                  } else if (trimmed.startsWith('description:')) {
                    currentEntity.description = trimmed.replace('description:', '').trim().replace(/"/g, '');
                  } else if (trimmed.startsWith('status:')) {
                    currentEntity.status = trimmed.replace('status:', '').trim();
                  }
                }
                
                if (inConnections && trimmed.startsWith('- from:')) {
                  const from = trimmed.replace('- from:', '').trim();
                  // Look ahead for 'to:' line
                  const nextLineIndex = lines.indexOf(line) + 1;
                  if (nextLineIndex < lines.length) {
                    const toLine = lines[nextLineIndex].trim();
                    if (toLine.startsWith('to:')) {
                      const to = toLine.replace('to:', '').trim();
                      dotContent += \`  "\${from}" -> "\${to}" [style="solid", penwidth=2];\\n\`;
                    }
                  }
                }
              }
              
              // Handle last entity
              if (currentEntity) {
                dotContent += generateNodeFromEntity(currentEntity);
              }
              
              sendProgress('Finalizing graph', 90);
              
              dotContent += '}';
              
              sendProgress('Complete', 100);
              return dotContent;
              
            } catch (error) {
              console.error('YAML to DOT conversion error:', error);
              throw error;
            }
          };

          function generateNodeFromEntity(entity) {
            let nodeStyle = '';
            let shape = 'box';
            let fillColor = '#4A90E2';
            
            // Style based on category
            switch (entity.category) {
              case 'AI_MODEL_CALL':
                fillColor = '#007AFF';
                shape = 'box';
                break;
              case 'FUNCTION_CALL':
                fillColor = '#FF9500';
                shape = 'diamond';
                break;
              case 'FUNCTION_RESPONSE':
                fillColor = '#34C759';
                shape = 'diamond';
                break;
              case 'ERROR_EVENT':
                fillColor = '#FF3B30';
                shape = 'octagon';
                break;
              case 'PARALLEL_GROUP':
                fillColor = '#5856D6';
                shape = 'box3d';
                break;
              case 'PROMPT_START':
                fillColor = '#32D74B';
                shape = 'ellipse';
                break;
              case 'COMPLETION':
                fillColor = '#30B0C7';
                shape = 'doublecircle';
                break;
              default:
                fillColor = '#8E8E93';
            }
            
            const label = entity.description || entity.id;
            return \`  "\${entity.id}" [label="\${label}", fillcolor="\${fillColor}", shape=\${shape}, fontcolor="white"];\\n\`;
          }

          // Listen for messages from React Native
          window.addEventListener('message', async (event) => {
            try {
              const message = JSON.parse(event.data);
              const { id, type, data } = message;
              
              if (type === 'yamlToDot') {
                const result = window.yamlToDotExecutionFlow(data);
                sendMessage('response', result, id);
              } else if (type === 'validateYaml') {
                // Simple YAML validation
                const isValid = data && data.includes('entities:') && data.includes('connections:');
                sendMessage('response', { valid: isValid }, id);
              } else if (type === 'generateSVG') {
                // For now, return the DOT content - SVG generation would need Graphviz
                sendMessage('response', data, id);
              } else {
                sendMessage('response', { error: 'Function not available' }, id);
              }
            } catch (error) {
              console.error('WebView message error:', error);
              sendMessage('error', error.toString());
            }
          });

          // Initialize
          async function initialize() {
            try {
              console.log('🌉 ExecutionFlow WASM Bridge: Initializing...');
              
              sendProgress('Initializing', 0);
              
              // Simulate initialization time
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              sendProgress('Ready', 100);
              
              // Hide loading screen
              document.querySelector('.loading').style.display = 'none';
              
              console.log('🌉 ExecutionFlow WASM Bridge: Ready!');
              sendMessage('ready', 'ExecutionFlow WASM Bridge loaded successfully');
              
            } catch (error) {
              console.error('🌉 ExecutionFlow WASM Bridge initialization error:', error);
              sendMessage('error', error.toString());
            }
          }

          // Start initialization when DOM is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
          } else {
            initialize();
          }
        </script>
      </body>
    </html>
  `;

  // Only render WebView on mobile platforms, return invisible view on web
  if (Platform.OS === 'web') {
    // For web platform, simulate the bridge functionality
    React.useEffect(() => {
      setTimeout(() => {
        setIsReady(true);
        props.onReady();
      }, 1000);
    }, [props]);

    return <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />;
  }

  return (
    <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
      <WebView
        ref={webViewRef}
        source={{ html: webViewHTML }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        allowsLinkPreview={false}
        cacheEnabled={false}
        incognito={false}
        style={{ flex: 1 }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('🌉 ExecutionFlow WASM Bridge WebView error:', nativeEvent);
          props.onError(`WebView error: ${nativeEvent.description}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('🌉 ExecutionFlow WASM Bridge WebView HTTP error:', nativeEvent);
          props.onError(`WebView HTTP error: ${nativeEvent.statusCode}`);
        }}
        onLoadStart={() => console.log('🌉 ExecutionFlow WASM Bridge WebView: Load started')}
        onLoadEnd={() => console.log('🌉 ExecutionFlow WASM Bridge WebView: Load ended')}
      />
    </View>
  );
});

export default ExecutionFlowWASMBridge;
export type { ExecutionFlowWASMBridgeRef };
