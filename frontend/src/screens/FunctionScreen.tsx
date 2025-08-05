import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  SectionList,
  Modal,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FunctionDefinition, getResourceOwnership, ResourceOwnership, FunctionApiKeyRequirements } from '../types';
import TemplateLibraryScreen from './TemplateLibraryScreen';
import { goGentAPI } from '../api/client';
import { restAPI } from '../api';
import LoadingScreen from '../components/LoadingScreen';
import JsonEditor from '../components/JsonEditor';
import { AlertAPI } from '../components/CustomAlert';
import { containerStyles, shadowPresets } from '../styles/containers';
import GroupedFunctionList from '../components/GroupedFunctionList';
import ApiKeyModal from '../components/ApiKeyModal';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

interface FunctionFormData {
  name: string;
  displayName: string;
  description: string;
  parametersSchema: string;
  mockResponse: string;
  endpointUrl: string;
  httpMethod: string;
  headers: string;
  authConfig: string;
  // New dynamic query template fields
  queryTemplate: string;
  resultTransformer: string;
  fallbackData: string;
}

type FunctionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'API Keys'
>;

// Map backend service names to modal service names
const mapBackendServicesToModalServices = (backendServices: string[]): string[] => {
  const serviceMap: Record<string, string> = {
    'SCHEDULER_API_KEY': 'openweather', // Temp mapping until we have a scheduler service
    'SENDGRID_API_KEY': 'openweather',  // Temp mapping until we have email service
    'SLACK_BOT_TOKEN': 'slack',
    'DISCORD_WEBHOOK_URL': 'discord',
    'openWeatherApiKey': 'openweather',
    'githubApiKey': 'github',
    'GOOGLE_VISION_API_KEY': 'openai',  // Temp mapping until we have vision service
    'TEXT_ANALYTICS_API_KEY': 'openai', // Temp mapping until we have text analytics
    'GOOGLE_CALENDAR_API_KEY': 'openweather', // Temp mapping
    'HUBSPOT_API_KEY': 'openweather',   // Temp mapping
    'OPENAI_API_KEY': 'openai',
    'GEMINI_API_KEY': 'gemini',
    'GOOGLE_TRANSLATE_API_KEY': 'openweather', // Temp mapping
    'neo4jUrl': 'neo4j',
    'neo4jUsername': 'neo4j',
    'neo4jPassword': 'neo4j',
    'neo4jDatabase': 'neo4j',
  };

  const modalServices = new Set<string>();
  backendServices.forEach(service => {
    const modalService = serviceMap[service] || 'openweather'; // Default fallback
    modalServices.add(modalService);
  });

  return Array.from(modalServices);
};

const FunctionScreen: React.FC = () => {
  const { state } = useApp();
  const { user, isLoading: authLoading } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const navigation = useNavigation<FunctionScreenNavigationProp>();

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading function definitions..." />;
  }
  const [functions, setFunctions] = useState<FunctionDefinition[]>([]);
  const [showNewFunctionForm, setShowNewFunctionForm] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionDefinition | null>(null);
  const [testingFunction, setTestingFunction] = useState<FunctionDefinition | null>(null);
  const [viewingFunction, setViewingFunction] = useState<FunctionDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyRequirements, setApiKeyRequirements] = useState<Record<string, FunctionApiKeyRequirements>>({});
  const [loadingApiKeyStatus, setLoadingApiKeyStatus] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyModalFunction, setApiKeyModalFunction] = useState<FunctionDefinition | null>(null);

  useEffect(() => {
    // Load functions on mount - not dependent on connection state
    console.log('⚙️ FunctionScreen mounted - loading functions');
    loadFunctions();
  }, []);

  // Reload functions when tab becomes focused - DECOUPLED from connection state  
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 FunctionScreen focused - checking if refresh needed');
      
      // Only refresh if authenticated and not already loading - connection status is irrelevant
      if (user && !isLoading) {
        console.log('✅ Refreshing functions data for:', user.username);
        loadFunctions();
      } else {
        console.log('⏳ Skipping refresh:', { 
          hasUser: !!user, 
          isLoading 
        });
      }
    }, [user?.id]) // Removed state.isConnected dependency
  );

  const loadFunctions = async () => {
    setIsLoading(true);
    try {
      const response = await goGentAPI.getFunctions();
      
      if (response.success && response.data) {
        // Ensure the response data is an array
        const functionsArray = Array.isArray(response.data) ? response.data : [];
        
        // DEBUG: Log the actual function data to see what's missing
        console.log('🔍 Raw function data from backend:', JSON.stringify(functionsArray, null, 2));
        
        // Backend now returns correct isSystemResource field
        console.log('🔧 Functions loaded from backend:', functionsArray.map(f => ({ 
          name: f.name, 
          isSystemResource: f.isSystemResource, 
          userId: f.userId 
        })));
        
        setFunctions(functionsArray);
        console.log('✅ Loaded functions from backend:', functionsArray.length);
        
        // Load API key requirements for the functions
        loadApiKeyRequirements(functionsArray);
      } else {
        console.error('Failed to load functions:', response.error);
        // FIXED: Function loading failures should NOT affect main app connection status
        setFunctions([]); // Ensure it's always an array
        setApiKeyRequirements({}); // Clear API key requirements
        console.warn('⚠️ Functions unavailable but app connection remains independent');
      }
    } catch (error) {
      console.error('Error loading functions:', error);
      // FIXED: Function errors should NOT affect main app connection status
      // Show user-friendly error but don't impact overall connectivity
      showWarning('Functions Unavailable', 'Failed to load functions. This does not affect your app connectivity.');
      setFunctions([]); // Ensure it's always an array
      setApiKeyRequirements({}); // Clear API key requirements
      console.warn('⚠️ Function loading failed but app connection status is independent');
    } finally {
      setIsLoading(false);
    }
  };

  // Load API key requirements for functions
  const loadApiKeyRequirements = async (functionList: FunctionDefinition[]) => {
    if (!functionList.length) {
      setApiKeyRequirements({});
      return;
    }

    setLoadingApiKeyStatus(true);
    try {
      const requirements: Record<string, FunctionApiKeyRequirements> = {};
      
      // Load requirements for each function (could be optimized with a batch endpoint)
      await Promise.all(
        functionList.map(async (func) => {
          try {
            const response = await restAPI.getFunctionApiKeyRequirements(func.id);
            if (response.success && response.data) {
              requirements[func.id] = response.data;
            }
          } catch (error) {
            console.warn(`Failed to load API key requirements for function ${func.name}:`, error);
          }
        })
      );
      
      setApiKeyRequirements(requirements);
      console.log('✅ Loaded API key requirements for', Object.keys(requirements).length, 'functions');
    } catch (error) {
      console.error('Error loading API key requirements:', error);
    } finally {
      setLoadingApiKeyStatus(false);
    }
  };

  // Handle configuring API keys for a function
  const handleConfigureApiKeys = async (func: FunctionDefinition) => {
    setApiKeyModalFunction(func);
    
    // Ensure we have API key requirements for this function before showing the modal
    if (!apiKeyRequirements[func.id]) {
      console.log('🔄 Loading API key requirements for function:', func.name);
      try {
        const response = await restAPI.getFunctionApiKeyRequirements(func.id);
        if (response.success && response.data) {
          setApiKeyRequirements(prev => ({
            ...prev,
            [func.id]: response.data!
          }));
          console.log('✅ Loaded API key requirements for function:', func.name, response.data.requiredServices);
        } else {
          console.warn('⚠️ Failed to load API key requirements for function:', func.name, response.error);
          showWarning('API Key Requirements', `Could not load API key requirements for ${func.displayName || func.name}`);
          return;
        }
      } catch (error) {
        console.error('❌ Error loading API key requirements:', error);
        showError('Error', `Failed to load API key requirements for ${func.displayName || func.name}`);
        return;
      }
    }
    
    setShowApiKeyModal(true);
  };

  // Group functions by functionGroup and filter based on search
  const groupedFunctions = useMemo(() => {
    if (!functions || !Array.isArray(functions)) {
      console.warn('Functions is not an array:', functions);
      return [];
    }
    
    // First filter functions based on search query
    let filtered = functions;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = functions.filter(func => {
        if (!func) return false;
        return (
          func.displayName?.toLowerCase().includes(query) ||
          func.description?.toLowerCase().includes(query) ||
          func.name?.toLowerCase().includes(query)
        );
      });
    }
    
    // Group filtered functions by functionGroup
    const grouped = filtered.reduce((acc, func) => {
      if (!func) return acc;
      
      const group = func.functionGroup || 'general';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(func);
      return acc;
    }, {} as Record<string, FunctionDefinition[]>);
    
    // Convert to SectionList format
    return Object.entries(grouped)
      .map(([title, data]) => ({
        title: title.charAt(0).toUpperCase() + title.slice(1), // Capitalize first letter
        data
      }))
      .sort((a, b) => a.title.localeCompare(b.title)); // Sort sections alphabetically
  }, [functions, searchQuery]);

  // Create filtered functions for the GroupedFunctionList component
  const filteredFunctions = useMemo(() => {
    if (!functions || !Array.isArray(functions)) {
      return [];
    }
    
    // Filter functions based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return functions.filter(func => {
        if (!func) return false;
        return (
          func.displayName?.toLowerCase().includes(query) ||
          func.description?.toLowerCase().includes(query) ||
          func.name?.toLowerCase().includes(query)
        );
      });
    }
    
    return functions;
  }, [functions, searchQuery]);

  const renderFunctionCard = ({ item }: { item: FunctionDefinition }) => {
    const ownership = getResourceOwnership(item, user?.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.displayName}</Text>
          {ownership.ownershipType === 'system' && (
            <View style={styles.systemBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#34C759" />
              <Text style={styles.systemBadgeText}>SYSTEM</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={1}>({item.name})</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.cardButton} 
            onPress={() => setTestingFunction(item)}
          >
            <Ionicons name="flask-outline" size={18} color="#007AFF" />
            <Text style={styles.cardButtonText}>Test</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cardButton} 
            onPress={() => setViewingFunction(item)}
          >
            <Ionicons name="eye-outline" size={18} color="#007AFF" />
            <Text style={styles.cardButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cardButton, !ownership.canEdit && styles.disabledButton]} 
                          onPress={() => ownership.canEdit ? setEditingFunction(item) : showWarning('Permission Denied', 'You cannot edit a system function.')}
          >
            <Ionicons name="pencil-outline" size={18} color={ownership.canEdit ? "#007AFF" : "#8E8E93"} />
            <Text style={[styles.cardButtonText, !ownership.canEdit && styles.disabledButtonText]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cardButton, !ownership.canDelete && styles.disabledButton]} 
            onPress={() => ownership.canDelete ? handleDeleteFunction(item.id) : showWarning('Permission Denied', 'You cannot delete a system function.')}
          >
            <Ionicons name="trash-outline" size={18} color={ownership.canDelete ? "#FF3B30" : "#8E8E93"} />
            <Text style={[styles.cardButtonText, {color: ownership.canDelete ? '#FF3B30' : '#8E8E93'}]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string; data: FunctionDefinition[] } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
      <Text style={styles.sectionHeaderCount}>{section.data.length} function{section.data.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  const handleDeleteFunction = (functionId: string) => {
    // Find the function to check if it's a system function
    const functionToDelete = functions.find(f => f.id === functionId);
    if (functionToDelete && getResourceOwnership(functionToDelete, user?.id).ownershipType === 'system') {
      showWarning('Permission Denied', 'System functions cannot be deleted.');
      return;
    }
    
    AlertAPI.alert(
      'Delete Function',
      'Are you sure you want to delete this function? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting function:', functionToDelete?.displayName);
              
              // Use proper API client to delete function
              const response = await goGentAPI.deleteFunction(functionId);
              
              if (!response.success) {
                console.error('Delete function failed:', response.error);
                showError('Delete Failed', response.error || 'Failed to delete function');
                return;
              }
              
              // Update local state
              setFunctions(prev => prev.filter(f => f.id !== functionId));
              console.log('✅ Function deleted successfully:', functionToDelete?.displayName);
              showSuccess('Function Deleted', `"${functionToDelete?.displayName}" has been deleted successfully.`);
            } catch (error) {
              console.error('Error deleting function:', error);
              showError('Delete Failed', 'Failed to delete function');
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Function Manager</Text>
      <Text style={styles.headerSubtitle}>
        Define and manage functions that AI agents can call
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{functions.length}</Text>
          <Text style={styles.statLabel}>Total Functions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{functions.filter(f => f.isActive).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{functions.filter(f => f.endpointUrl).length}</Text>
          <Text style={styles.statLabel}>With Real API</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Actions - Outside of SectionList to maintain focus */}
      <View style={styles.searchAndActionsContainer}>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search functions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewFunctionForm(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>New Function</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <GroupedFunctionList
        functions={filteredFunctions}
        showEditActions={true}
        showApiKeyStatus={true}
        apiKeyRequirements={apiKeyRequirements}
        onFunctionPress={(func) => setViewingFunction(func)}
        onEdit={(func) => {
          const ownership = getResourceOwnership(func, user?.id);
          if (ownership.canEdit) {
            setEditingFunction(func);
          } else {
            showWarning('Permission Denied', 'You cannot edit a system function.');
          }
        }}
        onDelete={(functionId) => {
          const func = functions.find(f => f.id === functionId);
          if (func) {
            const ownership = getResourceOwnership(func, user?.id);
            if (ownership.canDelete) {
              handleDeleteFunction(functionId);
            } else {
              showWarning('Permission Denied', 'You cannot delete a system function.');
            }
          }
        }}
        onTest={(func) => setTestingFunction(func)}
        onConfigureApiKeys={handleConfigureApiKeys}
        emptyMessage={searchQuery ? 'No functions match your search' : 'No functions found. Create your first function to get started.'}
        style={{ flex: 1, paddingBottom: 100 }}
      />
      
      {/* Function Form Modal */}
      <FunctionFormModal
        visible={showNewFunctionForm || (editingFunction !== null && getResourceOwnership(editingFunction, user?.id).canEdit)}
        function={editingFunction}
        onClose={() => {
          setShowNewFunctionForm(false);
          setEditingFunction(null);
        }}
        onSave={async (functionData) => {
          try {
            // Transform form data to backend format
            const backendPayload = {
              name: functionData.name,
              displayName: functionData.displayName,
              description: functionData.description,
              parametersSchema: JSON.parse(functionData.parametersSchema),
              mockResponse: JSON.parse(functionData.mockResponse),
              endpointUrl: functionData.endpointUrl || null,
              httpMethod: functionData.httpMethod,
              headers: JSON.parse(functionData.headers),
              authConfig: JSON.parse(functionData.authConfig),
              queryTemplate: functionData.queryTemplate || null,
              resultTransformer: functionData.resultTransformer || 'default',
              fallbackData: JSON.parse(functionData.fallbackData),
              isActive: true,
              userId: user?.id || null,
              isSystemResource: false
            };
            
            console.log('📤 Sending function data to backend:', JSON.stringify(backendPayload, null, 2));
            
            // Use proper API client with authentication
            const response = editingFunction 
              ? await goGentAPI.updateFunction(editingFunction.id, backendPayload)
              : await goGentAPI.createFunction(backendPayload);
            
            if (response.success) {
              showSuccess(
                editingFunction ? 'Function Updated' : 'Function Created', 
                editingFunction ? 'Function updated successfully!' : 'Function created successfully!'
              );
              setShowNewFunctionForm(false);
              setEditingFunction(null);
              loadFunctions();
            } else {
              console.error('❌ Backend error response:', response.error);
              showError('Save Failed', response.error || 'Failed to save function');
            }
          } catch (error) {
            console.error('Error saving function:', error);
            
            // More detailed error message
            let errorMessage = 'Failed to save function';
            if (error instanceof Error) {
              if (error.message.includes('JSON')) {
                errorMessage = 'Invalid JSON format in one of the fields';
              } else {
                errorMessage = error.message;
              }
            }
            
            showError('Function Error', errorMessage);
          }
        }}
      />
      
      {/* Function Test Modal */}
      <FunctionTestModal
        visible={testingFunction !== null}
        function={testingFunction}
        onClose={() => setTestingFunction(null)}
      />

      {/* Function Details Modal */}
      <FunctionDetailsModal
        visible={viewingFunction !== null}
        function={viewingFunction}
        onClose={() => setViewingFunction(null)}
      />

      {/* API Key Configuration Modal */}
      <ApiKeyModal
        visible={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setApiKeyModalFunction(null);
        }}
        onSave={() => {
          // Reload API key requirements after saving
          if (apiKeyModalFunction) {
            loadApiKeyRequirements([apiKeyModalFunction]);
          }
        }}
        requiredServices={
          apiKeyModalFunction && apiKeyRequirements[apiKeyModalFunction.id] 
            ? mapBackendServicesToModalServices(apiKeyRequirements[apiKeyModalFunction.id].requiredServices)
            : undefined
        }
      />
    </View>
  );
};

// Function Form Modal Component
interface FunctionFormModalProps {
  visible: boolean;
  function?: FunctionDefinition | null;
  onClose: () => void;
  onSave: (functionData: FunctionFormData) => void;
}

const FunctionFormModal: React.FC<FunctionFormModalProps> = ({ 
  visible, 
  function: editFunction, 
  onClose, 
  onSave 
}) => {
  const { user } = useAuth();
  const { showError, showWarning } = useToast();
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  
  // Check if this is a system function that shouldn't be edited
  const isSystemFunction = editFunction && getResourceOwnership(editFunction, user?.id).ownershipType === 'system';
  
  // If trying to edit a system function, don't show the modal
  useEffect(() => {
    if (isSystemFunction) {
      showWarning('Permission Denied', 'System functions cannot be edited. You can duplicate this function to create your own version.');
      onClose();
    }
  }, [isSystemFunction, onClose, showWarning]);
  
  // Don't render modal content for system functions
  if (isSystemFunction) {
    return null;
  }

  const [formData, setFormData] = useState<FunctionFormData>({
    name: '',
    displayName: '',
    description: '',
    parametersSchema: `{
  "type": "object",
  "description": "Function parameters",
  "properties": {
    "location": {
      "type": "string",
      "description": "The location to query"
    }
  },
  "required": ["location"]
}`,
    mockResponse: '{\n  "status": "success"\n}',
    endpointUrl: '',
    httpMethod: 'POST',
    headers: '{}',
    authConfig: '{}',
    queryTemplate: '',
    resultTransformer: 'default',
    fallbackData: '{}',
  });
  const [templatesExpanded, setTemplatesExpanded] = useState(true);

  useEffect(() => {
    if (editFunction) {
      setFormData({
        name: editFunction.name,
        displayName: editFunction.displayName,
        description: editFunction.description,
        parametersSchema: JSON.stringify(editFunction.parametersSchema, null, 2),
        mockResponse: JSON.stringify(editFunction.mockResponse || {}, null, 2),
        endpointUrl: editFunction.endpointUrl || '',
        httpMethod: editFunction.httpMethod,
        headers: JSON.stringify(editFunction.headers || {}, null, 2),
        authConfig: JSON.stringify(editFunction.authConfig || {}, null, 2),
        queryTemplate: editFunction.queryTemplate || '',
        resultTransformer: editFunction.resultTransformer || 'default',
        fallbackData: JSON.stringify(editFunction.fallbackData || {}, null, 2),
      });
    } else {
      // Reset form for new function
      setFormData({
        name: '',
        displayName: '',
        description: '',
        parametersSchema: `{
  "type": "object",
  "description": "Function parameters",
  "properties": {
    "location": {
      "type": "string",
      "description": "The location to query"
    }
  },
  "required": ["location"]
}`,
        mockResponse: '{\n  "status": "success"\n}',
        endpointUrl: '',
        httpMethod: 'POST',
        headers: '{}',
        authConfig: '{}',
        queryTemplate: '',
        resultTransformer: 'default',
        fallbackData: '{}',
      });
    }
  }, [editFunction, visible]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.displayName.trim() || !formData.description.trim()) {
      showError('Missing Fields', 'Please fill in all required fields');
      return;
    }

    try {
      const parametersSchema = JSON.parse(formData.parametersSchema);
      JSON.parse(formData.mockResponse);
      JSON.parse(formData.headers);
      JSON.parse(formData.authConfig);
      JSON.parse(formData.fallbackData);
      
      // Validate parameters schema for Gemini API compatibility
      const validationError = validateParametersSchema(parametersSchema);
      if (validationError) {
        showError('Parameter Schema Error', validationError);
        return;
      }
    } catch (error) {
      showError('JSON Error', 'Invalid JSON format in one of the fields');
      return;
    }

    onSave(formData);
  };

  // Helper function to get query template examples based on transformer type
  const getQueryTemplateExample = (transformerType: string): string => {
    switch (transformerType) {
      case 'neo4j_nodes':
        return `MATCH (n:{{node_label}}) {{where_clause}}
RETURN n
LIMIT {{limit}}`;
      case 'sales_summary':
        return `MATCH (p:Product)-[:HAS_DOCUMENT]->(d:Document)
OPTIONAL MATCH (d)-[:HAS_ITEM]->(i:Item)
WITH p.category AS raw_category,
     coalesce(d.total_amount, d.total_discounted_amount) AS amount,
     d.currency_code AS currency,
     count(i) AS item_count
RETURN raw_category, avg(amount) as avg_amount, count(*) as doc_count
ORDER BY avg_amount DESC
LIMIT {{limit}}`;
      case 'normalize_attributes':
        return `MATCH (n:{{node_label}})
WHERE n.{{attribute_name}} IS NOT NULL
RETURN DISTINCT n.{{attribute_name}} AS raw_value
ORDER BY raw_value
LIMIT {{limit}}`;
      default:
        return `// For HTTP functions, leave this empty and use Endpoint URL instead.
// For Neo4j functions, write Cypher with {{parameter}} placeholders:
MATCH (n:{{node_label}})
WHERE n.{{property_name}} = {{property_value}}
RETURN n
LIMIT {{limit}}`;
    }
  };

  // Helper function to get fallback data examples
  const getFallbackDataExample = (transformerType: string): string => {
    switch (transformerType) {
      case 'neo4j_nodes':
        return `{
  "nodes": [
    {
      "id": "mock_node_1",
      "labels": ["MockNode"],
      "properties": {
        "name": "Sample Data",
        "status": "offline"
      }
    }
  ],
  "summary": {
    "totalNodes": 1,
    "error": "Neo4j unavailable"
  }
}`;
      case 'sales_summary':
        return `{
  "sales_summary": [
    {
      "category": "Software",
      "avg_amount": 5000.00,
      "doc_count": 10
    }
  ],
  "summary": {
    "total_categories": 1,
    "error": "Database unavailable"
  }
}`;
      case 'normalize_attributes':
        return `{
  "attribute_mappings": [
    {
      "raw_value": "software engineering",
      "normalized_value": "Software Engineering",
      "confidence": 1.0
    }
  ],
  "summary": {
    "total_processed": 1,
    "error": "Service unavailable"
  }
}`;
      default:
        return `{
  "status": "offline",
  "message": "Service temporarily unavailable",
  "timestamp": "${new Date().toISOString()}"
}`;
    }
  };

  // Apply template from TemplateLibrary component
  const applyTemplate = (template: any) => {
    console.log(`🎯 Applying ${template.name} template to both tabs`);
    
    setFormData(prev => ({
      ...prev,
      // Basic Setup Tab
      name: template.name,
      displayName: template.displayName,
      description: template.description,
      httpMethod: template.httpMethod,
      endpointUrl: template.endpointUrl,
      headers: JSON.stringify({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }, null, 2),
      authConfig: '{}',
      parametersSchema: JSON.stringify(template.parametersSchema, null, 2),
      mockResponse: JSON.stringify(template.fallbackData, null, 2),
      // Query Templates Tab
      queryTemplate: template.queryTemplate || '',
      resultTransformer: template.resultTransformer || 'default',
      fallbackData: JSON.stringify(template.fallbackData, null, 2)
    }));
  };

  // Legacy apply template function (kept for compatibility)
  const applyTemplateLegacy = (templateType: string) => {
    // Show user feedback that template is being applied
    console.log(`🎯 Applying ${templateType} template to both tabs`);
    
    switch (templateType) {
      case 'neo4j_lookup':
        setFormData(prev => ({
          ...prev,
          // Basic Setup Tab
          name: 'neo4j_node_lookup',
          displayName: 'Neo4j Node Lookup',
          description: 'Look up nodes in Neo4j by label and properties. Matches the system neo4j_node_lookup function for finding specific nodes in your graph database.',
          httpMethod: 'CYPHER',
          endpointUrl: 'neo4j://localhost:7687',
          headers: JSON.stringify({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }, null, 2),
          authConfig: '{}',
          parametersSchema: JSON.stringify({
            type: 'object',
            properties: {
              node_label: { 
                type: 'string', 
                description: 'The Neo4j node label to search (e.g., "Product", "Person")'
              },
              properties: { 
                type: 'object', 
                description: 'Properties to match as key-value pairs'
              },
              limit: { 
                type: 'integer', 
                description: 'Maximum number of results to return',
                minimum: 1,
                maximum: 100,
                default: 25
              }
            },
            required: ['node_label']
          }, null, 2),
          mockResponse: JSON.stringify({
            nodes: [
              {
                id: 'mock_node_1',
                labels: ['Product'],
                properties: {
                  name: 'Sample Product',
                  category: 'Software'
                }
              }
            ],
            summary: {
              totalNodes: 1,
              executionTime: '15ms'
            }
          }, null, 2),
          // Query Templates Tab
          queryTemplate: getQueryTemplateExample('neo4j_nodes'),
          resultTransformer: 'neo4j_nodes',
          fallbackData: getFallbackDataExample('neo4j_nodes')
        }));
        break;
      case 'sales_analytics':
        setFormData(prev => ({
          ...prev,
          // Basic Setup Tab
          name: 'sales_summary',
          displayName: 'Sales Summary Analytics',
          description: 'Generate comprehensive sales analytics report showing annualized amounts by category, with currency conversion and item counts from Neo4j product and document data. Matches the system sales_summary function.',
          httpMethod: 'CYPHER',
          endpointUrl: 'neo4j://localhost:7687',
          headers: JSON.stringify({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }, null, 2),
          authConfig: '{}',
          parametersSchema: JSON.stringify({
            type: 'object',
            properties: {
              limit: { 
                type: 'integer', 
                description: 'Maximum number of categories to return in the summary',
                minimum: 1,
                maximum: 100,
                default: 25
              },
              currency_filter: { 
                type: 'string', 
                description: 'Filter results by specific currency code',
                enum: ['USD', 'EUR', 'GBP']
              },
              min_amount: { 
                type: 'number', 
                description: 'Minimum annualized amount threshold in USD',
                minimum: 0
              }
            },
            required: []
          }, null, 2),
          mockResponse: JSON.stringify({
            sales_summary: [
              {
                standard_category: 'Sales Enablement',
                avg_annualized_amount_usd: 125000.00,
                document_count: 15,
                total_item_count: 45
              },
              {
                standard_category: 'Revenue Operations',
                avg_annualized_amount_usd: 98000.00,
                document_count: 8,
                total_item_count: 24
              }
            ],
            summary: {
              total_categories: 2,
              executionTime: '250ms'
            }
          }, null, 2),
          // Query Templates Tab
          queryTemplate: getQueryTemplateExample('sales_summary'),
          resultTransformer: 'sales_summary',
          fallbackData: getFallbackDataExample('sales_summary')
        }));
        break;
      case 'normalize_data':
        setFormData(prev => ({
          ...prev,
          // Basic Setup Tab
          name: 'normalize_attributes',
          displayName: 'Normalize Node Attributes',
          description: 'Standardize and normalize attributes from any Neo4j node type. Takes raw values like "software engineering" and maps them to standardized forms like "Software Engineering". Useful for creating consistent category mappings. Matches the system normalize_attributes function.',
          httpMethod: 'CYPHER',
          endpointUrl: 'neo4j://localhost:7687',
          headers: JSON.stringify({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }, null, 2),
          authConfig: '{}',
          parametersSchema: JSON.stringify({
            type: 'object',
            properties: {
              node_label: { 
                type: 'string', 
                description: 'The Neo4j node label to query (e.g., "Product", "Person", "Company")'
              },
              attribute_name: { 
                type: 'string', 
                description: 'The attribute/property name to normalize (e.g., "category", "title", "industry")'
              },
              normalization_type: { 
                type: 'string', 
                description: 'Type of normalization to apply',
                enum: ['financial_categories', 'job_titles', 'industries', 'general', 'custom'],
                default: 'general'
              },
              case_style: { 
                type: 'string', 
                description: 'Preferred case style for output',
                enum: ['title_case', 'lower_case', 'upper_case', 'preserve'],
                default: 'title_case'
              },
              limit: { 
                type: 'integer', 
                description: 'Maximum number of unique values to process',
                minimum: 1,
                maximum: 1000,
                default: 100
              }
            },
            required: ['node_label', 'attribute_name']
          }, null, 2),
          mockResponse: JSON.stringify({
            attribute_mappings: [
              {
                raw_value: 'software engineering',
                normalized_value: 'Software Engineering',
                confidence: 1.0
              },
              {
                raw_value: 'data science',
                normalized_value: 'Data Science',
                confidence: 1.0
              }
            ],
            summary: {
              total_raw_values: 2,
              total_unique_normalized: 2,
              executionTime: '180ms'
            }
          }, null, 2),
          // Query Templates Tab
          queryTemplate: getQueryTemplateExample('normalize_attributes'),
          resultTransformer: 'normalize_attributes',
          fallbackData: getFallbackDataExample('normalize_attributes')
        }));
        break;
      case 'http_api':
        setFormData(prev => ({
          ...prev,
          // Basic Setup Tab
          name: 'custom_http_api',
          displayName: 'Custom HTTP API',
          description: 'Call an external HTTP API endpoint with flexible parameters. Similar to the system get_current_weather function but for any REST API service.',
          httpMethod: 'POST',
          endpointUrl: 'https://api.example.com/v1/endpoint',
          headers: JSON.stringify({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'GoGent-Function/1.0'
          }, null, 2),
          authConfig: JSON.stringify({
            type: 'api_key',
            header: 'X-API-Key',
            description: 'API key authentication'
          }, null, 2),
          parametersSchema: JSON.stringify({
            type: 'object',
            properties: {
              query: { 
                type: 'string', 
                description: 'Search or query parameter for the API'
              },
              limit: { 
                type: 'integer', 
                description: 'Maximum number of results to return',
                minimum: 1,
                maximum: 100,
                default: 10
              },
              format: {
                type: 'string',
                description: 'Response format preference',
                enum: ['json', 'xml'],
                default: 'json'
              }
            },
            required: ['query']
          }, null, 2),
          mockResponse: JSON.stringify({
            status: 'success',
            data: [
              {
                id: 1,
                title: 'Sample Result',
                description: 'This is a sample API response'
              }
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 10
            }
          }, null, 2),
          // Query Templates Tab - Empty for HTTP APIs
          queryTemplate: '',
          resultTransformer: 'default',
          fallbackData: getFallbackDataExample('default')
        }));
        break;
    }
  };

  // Validate that parameters schema only contains fields supported by Gemini API
  const validateParametersSchema = (schema: any): string | null => {
    if (!schema || typeof schema !== 'object') {
      return 'Parameters schema must be a valid object';
    }

    // Check top-level fields
    const allowedTopLevel = ['type', 'properties', 'required', 'description'];
    const invalidTopLevel = Object.keys(schema).filter(key => !allowedTopLevel.includes(key));
    if (invalidTopLevel.length > 0) {
      return `Unsupported top-level fields: ${invalidTopLevel.join(', ')}. Only allowed: ${allowedTopLevel.join(', ')}`;
    }

    // Check properties if they exist
    if (schema.properties && typeof schema.properties === 'object') {
      const allowedPropertyFields = [
        'type', 'description', 'enum', 'items', 'properties', 'required',
        'minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'format'
      ];
      
      for (const [propName, propValue] of Object.entries(schema.properties)) {
        if (typeof propValue === 'object' && propValue !== null) {
          const invalidFields = Object.keys(propValue as object).filter(
            key => !allowedPropertyFields.includes(key)
          );
          if (invalidFields.length > 0) {
            return `Property "${propName}" has unsupported fields: ${invalidFields.join(', ')}. Remove fields like "examples" which are not supported by Gemini API.`;
          }
        }
      }
    }

    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editFunction ? 'Edit Function' : 'New Function'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Template Library Section - Minimizable */}
          <View style={styles.templatesSection}>
            <TouchableOpacity 
              style={styles.templatesSectionHeader}
              onPress={() => setTemplatesExpanded(!templatesExpanded)}
            >
              <Ionicons name="library" size={20} color="#FF3B30" />
              <Text style={styles.templatesSectionTitle}>Quick Start Templates</Text>
              <Ionicons 
                name={templatesExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#8E8E93" 
              />
            </TouchableOpacity>
            
            {templatesExpanded && (
              <>
                <Text style={styles.templatesSectionDescription}>
                  Choose from pre-built templates to automatically configure your function
                </Text>
                
                <TemplateLibraryScreen 
                  embedded={true}
                  onSelectTemplate={(template) => {
                    applyTemplate(template);
                    setTemplatesExpanded(false); // Auto-minimize after selection
                  }}
                />
              </>
            )}
            
            {!templatesExpanded && (
              <Text style={styles.templatesCollapsedHint}>
                Tap to browse 4 pre-built templates
              </Text>
            )}
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
              onPress={() => setActiveTab('basic')}
            >
              <Ionicons 
                name="settings-outline" 
                size={16} 
                color={activeTab === 'basic' ? '#007AFF' : '#8E8E93'} 
              />
              <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>
                Basic Setup
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'advanced' && styles.activeTab]}
              onPress={() => setActiveTab('advanced')}
            >
              <Ionicons 
                name="code-slash-outline" 
                size={16} 
                color={activeTab === 'advanced' ? '#007AFF' : '#8E8E93'} 
              />
              <Text style={[styles.tabText, activeTab === 'advanced' && styles.activeTabText]}>
                Query Templates
              </Text>
            </TouchableOpacity>
          </View>
          {activeTab === 'basic' ? (
            <View style={styles.tabContent}>
              {/* Basic Configuration Section */}
                              <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={20} color="#007AFF" />
                    <Text style={styles.sectionCardTitle}>Function Information</Text>
                    {(formData.name && formData.name !== '') && (
                      <View style={styles.templateAppliedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                        <Text style={styles.templateAppliedText}>Template Applied</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sectionDescription}>
                    Define the basic properties and metadata for your function. Use templates above to auto-populate these fields.
                  </Text>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Function Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="e.g., get_weather"
                    autoCapitalize="none"
                  />
                  <Text style={styles.fieldHelp}>
                    Internal identifier used by AI agents. Use lowercase with underscores.
                  </Text>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Display Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.displayName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                    placeholder="e.g., Get Weather"
                  />
                  <Text style={styles.fieldHelp}>
                    Human-readable name shown in the interface.
                  </Text>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Description *</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Describe what this function does..."
                    multiline
                    numberOfLines={3}
                  />
                  <Text style={styles.fieldHelp}>
                    Clear description helping AI understand when to use this function.
                  </Text>
                </View>
              </View>

              {/* API Configuration Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="globe" size={20} color="#34C759" />
                  <Text style={styles.sectionCardTitle}>API Configuration</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Configure how this function connects to external services.
                </Text>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>HTTP Method</Text>
                  <View style={styles.methodSelector}>
                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'CYPHER'].map(method => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.methodOption,
                          formData.httpMethod === method && styles.methodOptionSelected
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, httpMethod: method }))}
                      >
                        <Text style={[
                          styles.methodOptionText,
                          formData.httpMethod === method && styles.methodOptionTextSelected
                        ]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.fieldHelp}>
                    Choose CYPHER for Neo4j databases, or HTTP method for REST APIs.
                  </Text>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Endpoint URL</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.endpointUrl}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, endpointUrl: text }))}
                    placeholder="https://api.example.com/endpoint or neo4j://localhost:7687"
                    autoCapitalize="none"
                  />
                  <Text style={styles.fieldHelp}>
                    {formData.httpMethod === 'CYPHER' 
                      ? 'Neo4j connection string (e.g., neo4j://localhost:7687)'
                      : 'REST API endpoint URL'
                    }
                  </Text>
                </View>

                <View style={styles.formField}>
                  <JsonEditor
                    label="Headers (JSON)"
                    helpText="HTTP headers to include with requests. Leave as {} if none needed."
                    value={formData.headers}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, headers: text }))}
                    placeholder='{"Content-Type": "application/json"}'
                    minHeight={120}
                    maxHeight={200}
                  />
                </View>

                <View style={styles.formField}>
                  <JsonEditor
                    label="Auth Config (JSON)"
                    helpText="Authentication configuration. Use API key management for sensitive data."
                    value={formData.authConfig}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, authConfig: text }))}
                    placeholder='{"type": "bearer", "token": "..."}'
                    minHeight={120}
                    maxHeight={200}
                  />
                </View>
              </View>

              {/* Parameters Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="settings" size={20} color="#FF9500" />
                  <Text style={styles.sectionCardTitle}>Parameters & Response</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Define what parameters this function accepts and mock response format.
                </Text>

                <View style={styles.formField}>
                  <JsonEditor
                    label="Parameters Schema (JSON)"
                    helpText="JSON Schema defining function parameters. AI agents use this to understand what data to provide."
                    value={formData.parametersSchema}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, parametersSchema: text }))}
                    minHeight={200}
                    maxHeight={300}
                  />
                </View>

                <View style={styles.formField}>
                  <JsonEditor
                    label="Mock Response (JSON)"
                    helpText="Sample response for testing and development when real API is unavailable."
                    value={formData.mockResponse}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, mockResponse: text }))}
                    placeholder='{"status": "success", "data": "..."}'
                    minHeight={160}
                    maxHeight={250}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.tabContent}>
              {/* Result Transformer Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="color-wand" size={20} color="#8E4EC6" />
                  <Text style={styles.sectionCardTitle}>Result Processing</Text>
                  {(formData.resultTransformer && formData.resultTransformer !== 'default') && (
                    <View style={styles.templateAppliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.templateAppliedText}>Template Applied</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sectionDescription}>
                  Configure how raw query results are transformed into the final output format. Templates above set this automatically.
                </Text>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Result Transformer</Text>
                  <View style={styles.transformerGrid}>
                    {[
                      { value: 'default', label: 'Default', desc: 'Raw results as-is', icon: 'document-outline' },
                      { value: 'neo4j_nodes', label: 'Neo4j Nodes', desc: 'Node/relationship format', icon: 'git-network-outline' },
                      { value: 'sales_summary', label: 'Sales Summary', desc: 'Formatted sales analytics', icon: 'trending-up-outline' },
                      { value: 'normalize_attributes', label: 'Normalize Data', desc: 'Standardized mappings', icon: 'library-outline' }
                    ].map(transformer => (
                      <TouchableOpacity
                        key={transformer.value}
                        style={[
                          styles.transformerCard,
                          formData.resultTransformer === transformer.value && styles.transformerCardSelected
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, resultTransformer: transformer.value }))}
                      >
                        <Ionicons 
                          name={transformer.icon as any} 
                          size={20} 
                          color={formData.resultTransformer === transformer.value ? '#007AFF' : '#8E8E93'} 
                        />
                        <Text style={[
                          styles.transformerCardTitle,
                          formData.resultTransformer === transformer.value && styles.transformerCardTitleSelected
                        ]}>
                          {transformer.label}
                        </Text>
                        <Text style={styles.transformerCardDesc}>{transformer.desc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Query Template Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="code-slash" size={20} color="#007AFF" />
                  <Text style={styles.sectionCardTitle}>Query Template</Text>
                  {(formData.queryTemplate && formData.queryTemplate.trim() !== '') && (
                    <View style={styles.templateAppliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.templateAppliedText}>Template Applied</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sectionDescription}>
                  {formData.httpMethod === 'CYPHER' 
                    ? 'Write Cypher queries with {{parameter}} placeholders for dynamic execution. Templates above provide working examples.'
                    : 'Leave empty for HTTP functions - they use the endpoint URL instead.'
                  }
                </Text>

                <View style={styles.formField}>
                  <JsonEditor
                    helpText={
                      formData.httpMethod === 'CYPHER' 
                        ? "🎯 Use placeholders: {{node_label}}, {{limit}}, {{where_clause}}. Parameters are substituted at runtime."
                        : "🌐 HTTP Functions use the Endpoint URL field instead. Query Templates are only needed for Cypher/database functions."
                    }
                    value={formData.queryTemplate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, queryTemplate: text }))}
                    placeholder={getQueryTemplateExample(formData.resultTransformer)}
                    minHeight={300}
                    maxHeight={500}
                  />
                </View>
              </View>

              {/* Fallback Data Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                  <Text style={styles.sectionCardTitle}>Fallback Data</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Data returned when external services are unavailable. Should match your expected output format.
                </Text>

                <View style={styles.formField}>
                  <TextInput
                    style={[styles.formInput, styles.codeInput]}
                    value={formData.fallbackData}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, fallbackData: text }))}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                    placeholder={getFallbackDataExample(formData.resultTransformer)}
                  />
                  <Text style={styles.fieldHelp}>
                    🛡️ <Text style={styles.boldText}>Offline resilience:</Text> Ensures functions work even when services are down
                    {'\n'}📋 <Text style={styles.boldText}>Format matching:</Text> Should mirror the structure of real responses
                    {'\n'}🔧 <Text style={styles.boldText}>Testing:</Text> Useful for development and demos
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Function Test Modal Component
interface FunctionTestModalProps {
  visible: boolean;
  function?: FunctionDefinition | null;
  onClose: () => void;
}

const FunctionTestModal: React.FC<FunctionTestModalProps> = ({ 
  visible, 
  function: testFunction, 
  onClose 
}) => {
  const [testArguments, setTestArguments] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    if (testFunction) {
      // Generate sample arguments from schema
      const sampleArgs = generateSampleArguments(testFunction.parametersSchema);
      setTestArguments(JSON.stringify(sampleArgs, null, 2));
      setTestResult(null);
    }
  }, [testFunction]);

  const generateSampleArguments = (schema: any): object => {
    if (!schema || !schema.properties) return {};
    
    const args: any = {};
    Object.keys(schema.properties).forEach(key => {
      const prop = schema.properties[key];
      switch (prop.type) {
        case 'string':
          args[key] = prop.enum ? prop.enum[0] : `sample_${key}`;
          break;
        case 'number':
          args[key] = 42;
          break;
        case 'boolean':
          args[key] = true;
          break;
        case 'array':
          args[key] = ['sample_item'];
          break;
        default:
          args[key] = null;
      }
    });
    return args;
  };

  const runTest = async () => {
    if (!testFunction) return;
    
    setIsRunning(true);
    setTestResult(null);
    
    try {
      const args = JSON.parse(testArguments);
      
      // Call the real API
      const response = await goGentAPI.testFunction(testFunction.id, args, useMockData);
      
      if (response.success) {
        setTestResult(response.data);
      } else {
        setTestResult({
          success: false,
          error: response.error || 'Function test failed',
          executionTimeMs: 0,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Invalid JSON arguments',
        executionTimeMs: 0,
      });
      setIsRunning(false);
    }
  };

  if (!testFunction) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Test Function</Text>
          <View style={{ width: 50 }} />
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.functionTestInfo}>
            <Text style={styles.testFunctionName}>{testFunction.displayName}</Text>
            <Text style={styles.testFunctionDescription}>{testFunction.description}</Text>
          </View>

          <View style={styles.formField}>
            <View style={styles.testModeContainer}>
              <Text style={styles.formLabel}>Use Mock Data</Text>
              <Switch
                value={useMockData}
                onValueChange={setUseMockData}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <JsonEditor
              label="Test Arguments (JSON)"
              value={testArguments}
              onChangeText={setTestArguments}
              minHeight={200}
              maxHeight={300}
            />
          </View>

          <TouchableOpacity
            style={[styles.testButton, isRunning && styles.testButtonDisabled]}
            onPress={runTest}
            disabled={isRunning}
          >
            {isRunning ? (
              <Text style={styles.testButtonText}>Running...</Text>
            ) : (
              <>
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.testButtonText}>Run Test</Text>
              </>
            )}
          </TouchableOpacity>

          {testResult && (
            <View style={styles.testResultContainer}>
              <Text style={styles.testResultTitle}>Test Result</Text>
              <View style={[
                styles.testResultCard,
                { borderLeftColor: testResult.success ? '#34C759' : '#FF3B30' }
              ]}>
                <Text style={[
                  styles.testResultStatus,
                  { color: testResult.success ? '#34C759' : '#FF3B30' }
                ]}>
                  {testResult.success ? 'SUCCESS' : 'ERROR'}
                </Text>
                
                {testResult.executionTimeMs > 0 && (
                  <Text style={styles.testResultTime}>
                    Execution time: {testResult.executionTimeMs}ms
                  </Text>
                )}
                
                {testResult.usedMockData && (
                  <Text style={styles.testResultMock}>Used mock data</Text>
                )}
                
                <Text style={styles.testResultDataLabel}>Response:</Text>
                <Text style={styles.testResultData}>
                  {JSON.stringify(testResult.response || testResult.error, null, 2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Function Details Modal Component
interface FunctionDetailsModalProps {
  visible: boolean;
  function: FunctionDefinition | null;
  onClose: () => void;
}

const FunctionDetailsModal: React.FC<FunctionDetailsModalProps> = ({ 
  visible, 
  function: viewFunction, 
  onClose 
}) => {
  if (!viewFunction) return null;

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Function Details</Text>
          <View style={{ width: 50 }} />
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>{viewFunction.displayName}</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Function Name:</Text>
              <Text style={styles.detailsValue}>{viewFunction.name}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Description:</Text>
              <Text style={styles.detailsValue}>{viewFunction.description}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Active:</Text>
              <Text style={[styles.detailsValue, { color: viewFunction.isActive ? '#34C759' : '#FF3B30' }]}>
                {viewFunction.isActive ? 'Yes' : 'No'}
              </Text>
            </View>
            {viewFunction.isSystemResource && (
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Type:</Text>
                <View style={styles.systemBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#34C759" />
                  <Text style={styles.systemBadgeText}>SYSTEM FUNCTION</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>API Configuration</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>HTTP Method:</Text>
              <Text style={styles.detailsValue}>{viewFunction.httpMethod || 'POST'}</Text>
            </View>
            {viewFunction.endpointUrl && (
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Endpoint URL:</Text>
                <Text style={[styles.detailsValue, styles.urlText]}>{viewFunction.endpointUrl}</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Parameters Schema</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
                {formatJson(viewFunction.parametersSchema)}
              </Text>
            </View>
          </View>

          {viewFunction.headers && Object.keys(viewFunction.headers).length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Headers</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {formatJson(viewFunction.headers)}
                </Text>
              </View>
            </View>
          )}

          {viewFunction.authConfig && Object.keys(viewFunction.authConfig).length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Authentication Config</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {formatJson(viewFunction.authConfig)}
                </Text>
              </View>
            </View>
          )}

          {viewFunction.mockResponse && Object.keys(viewFunction.mockResponse).length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Mock Response</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {formatJson(viewFunction.mockResponse)}
                </Text>
              </View>
            </View>
          )}

          {viewFunction.queryTemplate && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Query Template</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {viewFunction.queryTemplate}
                </Text>
              </View>
              <Text style={styles.helpText}>
                🎯 Cypher query with {"{{parameter}}"} placeholders for dynamic execution
              </Text>
            </View>
          )}

          {viewFunction.resultTransformer && viewFunction.resultTransformer !== 'default' && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Result Transformer</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Transformer Type:</Text>
                <View style={styles.transformerBadge}>
                  <Text style={styles.transformerBadgeText}>{viewFunction.resultTransformer}</Text>
                </View>
              </View>
              <Text style={styles.helpText}>
                📊 Defines how raw query results are transformed into the final output format
              </Text>
            </View>
          )}

          {viewFunction.fallbackData && Object.keys(viewFunction.fallbackData).length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Fallback Data</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {formatJson(viewFunction.fallbackData)}
                </Text>
              </View>
              <Text style={styles.helpText}>
                🛡️ Data returned when external services are unavailable
              </Text>
            </View>
          )}

          {viewFunction.requiredApiKeys && viewFunction.requiredApiKeys.length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Required API Keys</Text>
              {viewFunction.requiredApiKeys.map((key, index) => (
                <View key={index} style={styles.apiKeyItem}>
                  <Ionicons name="key-outline" size={16} color="#007AFF" />
                  <Text style={styles.apiKeyText}>{key}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchAndActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  functionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  functionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  functionInfo: {
    flex: 1,
    marginRight: 12,
  },
  functionDisplayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  functionName: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#007AFF',
    marginBottom: 4,
  },
  functionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  functionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  functionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  modalCancelButton: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '500',
  },
  modalSaveButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
  },
  formField: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
  },
  methodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  methodOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  methodOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  methodOptionTextSelected: {
    color: '#FFFFFF',
  },
  functionTestInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  testFunctionName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  testFunctionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  testModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    gap: 8,
    marginBottom: 20,
  },
  testButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testResultContainer: {
    marginTop: 20,
  },
  testResultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  testResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  testResultStatus: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  testResultTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  testResultMock: {
    fontSize: 12,
    color: '#FF9500',
    marginBottom: 8,
  },
  testResultDataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  testResultData: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  systemBadgeText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#34C759',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 'auto',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#8E8E93',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    width: 120,
    marginRight: 12,
  },
  detailsValue: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    lineHeight: 20,
  },
  urlText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  codeBlock: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#3C3C43',
    lineHeight: 16,
  },
  apiKeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  apiKeyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
  },
  // New styles for query template functionality
  sectionDivider: {
    marginVertical: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  labelWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tooltipButton: {
    padding: 4,
  },
  transformerSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  transformerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  transformerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  transformerOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  transformerOptionTextSelected: {
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '600',
    color: '#000000',
  },
  queryTemplateInput: {
    height: 200,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  templateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  transformerBadge: {
    backgroundColor: '#E8F4FD',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  transformerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  // Enhanced styles for tabbed interface
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    ...containerStyles.primaryContainer,
    marginBottom: 24, // Increased spacing between sections
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
  },
  fieldHelp: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
    lineHeight: 16,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  templateCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  templateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 3,
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 6,
  },
  transformerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  transformerCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  transformerCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  transformerCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  transformerCardTitleSelected: {
    color: '#007AFF',
  },
  transformerCardDesc: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 14,
  },
  queryHelp: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  // Templates section above tabs - Enhanced visual separation
  templatesSection: {
    ...containerStyles.secondaryContainer,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#FBFCFD', // Slightly different background for distinction
  },
  templatesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  templatesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  templatesSectionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 20,
  },
  templateAppliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginLeft: 'auto',
  },
  templateAppliedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34C759',
  },
  templateTagsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  templateTag: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  templateTagDisabled: {
    backgroundColor: '#F2F2F7',
  },
  templateTagText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#34C759',
  },
  templateTagTextDisabled: {
    color: '#8E8E93',
  },
  templatesCollapsedHint: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Section header styles for grouped functions
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  sectionHeaderCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});

export default FunctionScreen; 