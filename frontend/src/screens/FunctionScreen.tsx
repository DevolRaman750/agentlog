import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import type { ThemeColors } from '../theme';
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
              <Ionicons name="shield-checkmark" size={12} color={colors.statusSuccess} />
              <Text style={styles.systemBadgeText}>SYSTEM</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={1}>({item.name})</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.cardButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setTestingFunction(item)}
          >
            <Ionicons name="flask-outline" size={18} color={colors.accent} />
            <Text style={styles.cardButtonText}>Test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cardButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setViewingFunction(item)}
          >
            <Ionicons name="eye-outline" size={18} color={colors.accent} />
            <Text style={styles.cardButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardButton, !ownership.canEdit && styles.disabledButton]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => ownership.canEdit ? setEditingFunction(item) : showWarning('Permission Denied', 'You cannot edit a system function.')}
          >
            <Ionicons name="pencil-outline" size={18} color={ownership.canEdit ? colors.accent : colors.textSecondary} />
            <Text style={[styles.cardButtonText, !ownership.canEdit && styles.disabledButtonText]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardButton, !ownership.canDelete && styles.disabledButton]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => ownership.canDelete ? handleDeleteFunction(item.id) : showWarning('Permission Denied', 'You cannot delete a system function.')}
          >
            <Ionicons name="trash-outline" size={18} color={ownership.canDelete ? colors.statusError : colors.textSecondary} />
            <Text style={[styles.cardButtonText, {color: ownership.canDelete ? colors.statusError : colors.textSecondary}]}>Delete</Text>
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
            <Ionicons name="search" size={20} color={colors.textSecondary} />
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
            <Ionicons name="add" size={24} color={colors.textInverse} />
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editFunction ? 'Edit Function' : 'New Function'}
          </Text>
          <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
              <Ionicons name="library" size={20} color={colors.statusError} />
              <Text style={styles.templatesSectionTitle}>Quick Start Templates</Text>
              <Ionicons 
                name={templatesExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
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
                color={activeTab === 'basic' ? colors.accent : colors.textSecondary} 
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
                color={activeTab === 'advanced' ? colors.accent : colors.textSecondary} 
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
                    <Ionicons name="information-circle" size={20} color={colors.accent} />
                    <Text style={styles.sectionCardTitle}>Function Information</Text>
                    {(formData.name && formData.name !== '') && (
                      <View style={styles.templateAppliedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.statusSuccess} />
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
                  <Ionicons name="globe" size={20} color={colors.statusSuccess} />
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
                  <Ionicons name="settings" size={20} color={colors.statusWarning} />
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
                  <Ionicons name="color-wand" size={20} color={colors.accentSecondary} />
                  <Text style={styles.sectionCardTitle}>Result Processing</Text>
                  {(formData.resultTransformer && formData.resultTransformer !== 'default') && (
                    <View style={styles.templateAppliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.statusSuccess} />
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
                          color={formData.resultTransformer === transformer.value ? colors.accent : colors.textSecondary} 
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
                  <Ionicons name="code-slash" size={20} color={colors.accent} />
                  <Text style={styles.sectionCardTitle}>Query Template</Text>
                  {(formData.queryTemplate && formData.queryTemplate.trim() !== '') && (
                    <View style={styles.templateAppliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.statusSuccess} />
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
                  <Ionicons name="shield-checkmark" size={20} color={colors.statusSuccess} />
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
                trackColor={{ false: colors.borderLight, true: colors.statusSuccess }}
                thumbColor={colors.bgCard}
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
                <Ionicons name="play" size={20} color={colors.textInverse} />
                <Text style={styles.testButtonText}>Run Test</Text>
              </>
            )}
          </TouchableOpacity>

          {testResult && (
            <View style={styles.testResultContainer}>
              <Text style={styles.testResultTitle}>Test Result</Text>
              <View style={[
                styles.testResultCard,
                { borderLeftColor: testResult.success ? colors.statusSuccess : colors.statusError }
              ]}>
                <Text style={[
                  styles.testResultStatus,
                  { color: testResult.success ? colors.statusSuccess : colors.statusError }
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
              <Text style={[styles.detailsValue, { color: viewFunction.isActive ? colors.statusSuccess : colors.statusError }]}>
                {viewFunction.isActive ? 'Yes' : 'No'}
              </Text>
            </View>
            {viewFunction.isSystemResource && (
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Type:</Text>
                <View style={styles.systemBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.statusSuccess} />
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
                  <Ionicons name="key-outline" size={16} color={colors.accent} />
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

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  searchAndActionsContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  listContainer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.title,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.title,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchTarget.min,
    gap: spacing.sm,
  },
  addButtonText: {
    color: colors.textInverse,
    ...typography.title,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.display,
    color: colors.accent,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  functionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  functionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  functionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  functionDisplayName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  functionName: {
    ...typography.body,
    fontFamily: 'monospace',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  functionDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  functionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  functionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyStateText: {
    ...typography.h2,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  emptyStateSubtext: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  modalCancelButton: {
    ...typography.title,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  modalSaveButton: {
    ...typography.title,
    fontWeight: '700',
    color: colors.accent,
  },
  modalContent: {
    flex: 1,
  },
  formField: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.title,
    fontWeight: '400',
    minHeight: touchTarget.min,
    backgroundColor: colors.bgCard,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontFamily: 'monospace',
    ...typography.body,
    height: 120,
    textAlignVertical: 'top',
  },
  methodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  methodOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.min,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCard,
  },
  methodOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  methodOptionText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  methodOptionTextSelected: {
    color: colors.textInverse,
  },
  functionTestInfo: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  testFunctionName: {
    ...typography.h1,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  testFunctionDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  testModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touchTarget.min,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  testButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  testButtonText: {
    color: colors.textInverse,
    ...typography.title,
  },
  testResultContainer: {
    marginTop: spacing.lg,
  },
  testResultTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  testResultCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  testResultStatus: {
    ...typography.bodyStrong,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  testResultTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  testResultMock: {
    ...typography.caption,
    color: colors.statusWarning,
    marginBottom: spacing.sm,
  },
  testResultDataLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  testResultData: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: colors.textPrimary,
    backgroundColor: colors.bgApp,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: 'auto',
  },
  systemBadgeText: {
    marginLeft: spacing.xs,
    ...typography.micro,
    fontWeight: '600',
    color: colors.statusSuccess,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: spacing.md,
    marginTop: 'auto',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardButtonText: {
    marginLeft: spacing.sm,
    ...typography.label,
    color: colors.accent,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  detailsSection: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailsTitle: {
    ...typography.h1,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  detailsSectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailsLabel: {
    ...typography.label,
    color: colors.textSecondary,
    width: 120,
    marginRight: spacing.md,
  },
  detailsValue: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  urlText: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  codeBlock: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    ...typography.caption,
    color: colors.textPrimary,
  },
  apiKeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  apiKeyText: {
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  // New styles for query template functionality
  sectionDivider: {
    marginVertical: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  labelWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tooltipButton: {
    padding: spacing.xs,
  },
  transformerSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  transformerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCard,
  },
  transformerOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  transformerOptionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  transformerOptionTextSelected: {
    color: colors.textInverse,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  boldText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  queryTemplateInput: {
    height: 200,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  templateButtonText: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.accent,
  },
  transformerBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  transformerBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.accent,
  },
  // Enhanced styles for tabbed interface
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgApp,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget.min,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  sectionCardTitle: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fieldHelp: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  templateCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  templateIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  templateTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  templateDescription: {
    ...typography.micro,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  transformerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  transformerCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  transformerCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.bgHover,
  },
  transformerCardTitle: {
    ...typography.label,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  transformerCardTitleSelected: {
    color: colors.accent,
  },
  transformerCardDesc: {
    ...typography.micro,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  queryHelp: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  // Templates section above tabs - Enhanced visual separation
  templatesSection: {
    backgroundColor: colors.bgSurface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  templatesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  templatesSectionTitle: {
    ...typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  templatesSectionDescription: {
    ...typography.label,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  templateAppliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  templateAppliedText: {
    ...typography.micro,
    fontWeight: '600',
    color: colors.statusSuccess,
  },
  templateTagsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  templateTag: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  templateTagDisabled: {
    backgroundColor: colors.bgApp,
  },
  templateTagText: {
    ...typography.micro,
    color: colors.statusSuccess,
  },
  templateTagTextDisabled: {
    color: colors.textSecondary,
  },
  templatesCollapsedHint: {
    ...typography.label,
    fontWeight: '400',
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  // Section header styles for grouped functions
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  sectionHeaderTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  sectionHeaderCount: {
    ...typography.label,
    color: colors.textSecondary,
  },
});

export default FunctionScreen; 