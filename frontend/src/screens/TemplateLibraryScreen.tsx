import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

// Template data - this will eventually come from the backend system functions
const SYSTEM_TEMPLATES = [
  {
    id: 'neo4j_lookup',
    name: 'neo4j_node_lookup',
    displayName: 'Neo4j Node Lookup',
    description: 'Search and retrieve nodes from a Neo4j graph database by label and properties. Perfect for finding specific entities, relationships, or data patterns.',
    icon: 'search-outline',
    color: 'statusInfo',
    category: 'Database',
    complexity: 'Beginner',
    httpMethod: 'CYPHER',
    endpointUrl: 'neo4j://localhost:7687',
    queryTemplate: 'MATCH (n:{{node_label}}) {{where_clause}} RETURN n LIMIT {{limit}}',
    resultTransformer: 'neo4j_nodes',
    parametersSchema: {
      type: 'object',
      properties: {
        node_label: { 
          type: 'string', 
          description: 'The node label to search for (e.g., Person, Company, Product)'
        },
        properties: { 
          type: 'object', 
          description: 'Key-value pairs to match against node properties'
        },
        limit: { 
          type: 'integer', 
          description: 'Maximum number of nodes to return',
          minimum: 1,
          maximum: 100,
          default: 25
        }
      },
      required: ['node_label']
    },
    fallbackData: {
      nodes: [
        {
          id: 'mock_node_1',
          labels: ['MockNode'],
          properties: {
            name: 'Sample Node',
            category: 'Mock Data'
          }
        }
      ],
      summary: {
        totalNodes: 1,
        executionTime: '0ms',
        source: 'mock'
      }
    },
    tags: ['Neo4j', 'Graph Database', 'Search']
  },
  {
    id: 'sales_analytics',
    name: 'sales_summary',
    displayName: 'Sales Summary Analytics',
    description: 'Generate comprehensive sales analytics reports showing annualized amounts by category, with currency conversion and item counts from Neo4j product and document data.',
    icon: 'analytics-outline',
    color: 'statusSuccess',
    category: 'Analytics',
    complexity: 'Advanced',
    httpMethod: 'CYPHER',
    endpointUrl: 'neo4j://localhost:7687',
    queryTemplate: `MATCH (p:Product)-[:HAS_DOCUMENT]->(d:Document)
OPTIONAL MATCH (d)-[:HAS_ITEM]->(i:Item)
WITH 
  p.category AS raw_category,
  coalesce(d.total_amount, d.total_discounted_amount) AS amount,
  d.currency_code AS currency,
  d.service_duration_month AS duration_months,
  count(i) AS item_count_per_document
WHERE duration_months IS NOT NULL AND duration_months > 0 {{currency_filter}}

WITH 
  raw_category,
  currency,
  amount / duration_months * 12 AS annualized_amount,
  item_count_per_document,
  CASE 
    WHEN toLower(raw_category) IN ['e-signature'] THEN 'E-Signature'
    WHEN toLower(raw_category) IN ['direct-mail-marketing', 'direct mail marketing'] THEN 'Direct Mail Marketing'
    WHEN toLower(raw_category) IN ['rev ops', 'revenue ops'] THEN 'Revenue Operations'
    WHEN toLower(raw_category) IN ['sales engagement', 'sales intelligence', 'sales training', 'sales communication', 'sales productivity'] THEN 'Sales Enablement'
    WHEN toLower(raw_category) = 'commission-management' THEN 'Compensation Management'
    WHEN toLower(raw_category) = 'lead-generation' THEN 'Lead Management'
    WHEN toLower(raw_category) = 'event-services' THEN 'Event Services'
    WHEN toLower(raw_category) = 'security training' THEN 'Security Training'
    ELSE raw_category
  END AS standard_category,
  
  CASE 
    WHEN currency = 'USD' THEN 1.0
    WHEN currency = 'EUR' THEN 1.1
    WHEN currency = 'GBP' THEN 1.3
    ELSE 1.0
  END AS conversion_rate

WITH 
  standard_category,
  round(avg(annualized_amount * conversion_rate), 2) AS avg_annualized_amount_usd,
  count(*) AS document_count,
  sum(item_count_per_document) AS total_item_count

RETURN 
  standard_category,
  avg_annualized_amount_usd,
  document_count,
  total_item_count
ORDER BY avg_annualized_amount_usd DESC
LIMIT {{limit}}`,
    resultTransformer: 'sales_summary',
    parametersSchema: {
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
          description: 'Filter results by specific currency code (USD, EUR, GBP)',
          enum: ['USD', 'EUR', 'GBP']
        },
        min_amount: {
          type: 'number',
          description: 'Minimum annualized amount threshold in USD',
          minimum: 0
        }
      },
      required: []
    },
    fallbackData: {
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
        executionTime: '250ms',
        source: 'mock'
      }
    },
    tags: ['Analytics', 'Sales', 'Financial']
  },
  {
    id: 'normalize_data',
    name: 'normalize_attributes',
    displayName: 'Normalize Node Attributes',
    description: 'Standardize and normalize attributes from any Neo4j node type. Takes raw values like "software engineering" and maps them to standardized forms like "Software Engineering". Useful for creating consistent category mappings.',
    icon: 'swap-horizontal-outline',
    color: 'statusWarning',
    category: 'Data Processing',
    complexity: 'Intermediate',
    httpMethod: 'CYPHER',
    endpointUrl: 'neo4j://localhost:7687',
    queryTemplate: `MATCH (n:{{node_label}})
WHERE n.{{attribute_name}} IS NOT NULL
WITH DISTINCT n.{{attribute_name}} AS raw_value
RETURN 
  raw_value,
  CASE {{case_style}}
    WHEN 'title_case' THEN 
      reduce(result = '', word IN split(toLower(raw_value), ' ') | 
        result + (CASE WHEN result = '' THEN '' ELSE ' ' END) + 
        toUpper(substring(word, 0, 1)) + substring(word, 1)
      )
    WHEN 'upper_case' THEN toUpper(raw_value)
    WHEN 'lower_case' THEN toLower(raw_value)
    ELSE raw_value
  END AS normalized_value,
  1.0 AS confidence
ORDER BY raw_value
LIMIT {{limit}}`,
    resultTransformer: 'normalize_attributes',
    parametersSchema: {
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
    },
    fallbackData: {
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
        executionTime: '180ms',
        source: 'mock'
      }
    },
    tags: ['Data Cleaning', 'Normalization', 'Standardization']
  },
  {
    id: 'http_api',
    name: 'external_api_call',
    displayName: 'HTTP API Template',
    description: 'Call external REST APIs with customizable endpoints, headers, and authentication. Perfect for integrating with third-party services like weather APIs, CRM systems, or data providers.',
    icon: 'globe-outline',
    color: 'statusPaused',
    category: 'Integration',
    complexity: 'Beginner',
    httpMethod: 'GET',
    endpointUrl: 'https://api.example.com/v1/data',
    queryTemplate: null, // HTTP APIs don't use query templates
    resultTransformer: 'default',
    parametersSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'The API endpoint to call'
        },
        api_key: {
          type: 'string',
          description: 'API key for authentication'
        },
        query_params: {
          type: 'object',
          description: 'Query parameters to include in the request'
        }
      },
      required: ['endpoint']
    },
    fallbackData: {
      status: 'success',
      data: {
        message: 'This is mock data when the external API is unavailable',
        timestamp: '2025-01-28T00:00:00Z'
      },
      source: 'fallback'
    },
    tags: ['HTTP', 'REST API', 'Integration']
  }
];

interface TemplateLibraryProps {
  onSelectTemplate?: (template: any) => void;
  embedded?: boolean;
  selectedTemplateId?: string;
}

interface TemplatePreviewModalProps {
  visible: boolean;
  template: any;
  onClose: () => void;
  onUseTemplate: (template: any) => void;
}

const useTemplateStyles = () => useThemedStyles((colors) => ({
  iconColors: {
    statusInfo: colors.statusInfo,
    statusSuccess: colors.statusSuccess,
    statusWarning: colors.statusWarning,
    statusPaused: colors.statusPaused,
  } as Record<string, string>,
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  embeddedContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.none,
  },
  header: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.title,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  searchContainer: {
    padding: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    ...typography.title,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  categoryContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    maxHeight: 44,
  },
  embeddedCategoryContainer: {
    paddingHorizontal: spacing.none,
    marginBottom: spacing.sm,
    maxHeight: 40,
  },
  categoryContentContainer: {
    paddingHorizontal: spacing.md,
    alignItems: 'center' as const,
  },
  categoryChip: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
  },
  selectedCategoryChip: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  selectedCategoryChipText: {
    color: colors.textInverse,
  },
  templatesContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  templatesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  templateCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '48%' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 140,
  },
  selectedTemplateCard: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  templateCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.sm,
  },
  templateCardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  templateCardMeta: {
    alignItems: 'flex-end' as const,
  },
  templateCardCategory: {
    ...typography.caption,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  templateCardComplexity: {
    ...typography.micro,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  templateCardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  templateCardDescription: {
    ...typography.micro,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    flex: 1,
  },
  templateCardTags: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  templateCardTag: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  templateCardTagText: {
    ...typography.micro,
    fontSize: 9,
    lineHeight: 12,
    color: colors.textSecondary,
  },
  templateCardMoreTags: {
    ...typography.micro,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  templateCardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  templateCardMethod: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  templateCardMethodText: {
    ...typography.caption,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  templateCardPreviewButton: {
    padding: spacing.xs,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.xxl,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyStateSubtitle: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
  previewModal: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  previewHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  previewTitle: {
    ...typography.h2,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  previewCancelButton: {
    ...typography.title,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  previewUseButton: {
    ...typography.title,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  previewContent: {
    flex: 1,
    padding: spacing.lg,
  },
  previewTemplateHeader: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row' as const,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewTemplateIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  previewTemplateInfo: {
    flex: 1,
  },
  previewTemplateName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  previewTemplateDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  previewTemplateMeta: {
    flexDirection: 'row' as const,
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  previewMetaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  previewMetaText: {
    ...typography.caption,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  previewTagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  previewTag: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewTagText: {
    ...typography.micro,
    color: colors.textSecondary,
  },
  previewTabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewTab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: touchTarget.min,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  previewActiveTab: {
    backgroundColor: colors.accent,
  },
  previewTabText: {
    ...typography.body,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  previewActiveTabText: {
    color: colors.textInverse,
  },
  previewTabContent: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewSection: {
    marginBottom: spacing.lg,
  },
  previewSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  previewSectionTitle: {
    ...typography.h2,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  previewCopyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    padding: spacing.sm,
    minHeight: touchTarget.min,
  },
  previewCopyText: {
    ...typography.body,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  previewConfigItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  previewConfigLabel: {
    ...typography.body,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  previewConfigValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  previewCodeBlock: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  previewCodeText: {
    fontFamily: 'monospace',
    ...typography.caption,
    color: colors.textPrimary,
  },
  previewEmptyState: {
    alignItems: 'center' as const,
    paddingVertical: spacing.lg,
  },
  previewEmptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center' as const,
  },
  previewHelpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic' as const,
  },
}));

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  visible,
  template,
  onClose,
  onUseTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'query' | 'schema' | 'fallback'>('overview');
  const styles = useTemplateStyles();

  if (!template) return null;

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.previewModal}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.previewCancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Template Preview</Text>
          <TouchableOpacity onPress={() => onUseTemplate(template)}>
            <Text style={styles.previewUseButton}>Use Template</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.previewContent}>
          {/* Template Header */}
          <View style={styles.previewTemplateHeader}>
            <View style={[styles.previewTemplateIcon, { backgroundColor: styles.iconColors[template.color] }]}>
              <Ionicons name={template.icon as any} size={32} color={styles.selectedCategoryChipText.color} />
            </View>
            <View style={styles.previewTemplateInfo}>
              <Text style={styles.previewTemplateName}>{template.displayName}</Text>
              <Text style={styles.previewTemplateDescription}>{template.description}</Text>
              <View style={styles.previewTemplateMeta}>
                <View style={styles.previewMetaItem}>
                  <Ionicons name="layers-outline" size={16} color={styles.previewMetaText.color} />
                  <Text style={styles.previewMetaText}>{template.category}</Text>
                </View>
                <View style={styles.previewMetaItem}>
                  <Ionicons name="speedometer-outline" size={16} color={styles.previewMetaText.color} />
                  <Text style={styles.previewMetaText}>{template.complexity}</Text>
                </View>
                <View style={styles.previewMetaItem}>
                  <Ionicons name="code-outline" size={16} color={styles.previewMetaText.color} />
                  <Text style={styles.previewMetaText}>{template.httpMethod}</Text>
                </View>
              </View>
              <View style={styles.previewTagsContainer}>
                {template.tags.map((tag: string, index: number) => (
                  <View key={index} style={styles.previewTag}>
                    <Text style={styles.previewTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.previewTabContainer}>
            {['overview', 'query', 'schema', 'fallback'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.previewTab, activeTab === tab && styles.previewActiveTab]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text style={[styles.previewTabText, activeTab === tab && styles.previewActiveTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <View style={styles.previewTabContent}>
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Configuration</Text>
                <View style={styles.previewConfigItem}>
                  <Text style={styles.previewConfigLabel}>Function Name:</Text>
                  <Text style={styles.previewConfigValue}>{template.name}</Text>
                </View>
                <View style={styles.previewConfigItem}>
                  <Text style={styles.previewConfigLabel}>HTTP Method:</Text>
                  <Text style={styles.previewConfigValue}>{template.httpMethod}</Text>
                </View>
                <View style={styles.previewConfigItem}>
                  <Text style={styles.previewConfigLabel}>Endpoint:</Text>
                  <Text style={styles.previewConfigValue}>{template.endpointUrl}</Text>
                </View>
                <View style={styles.previewConfigItem}>
                  <Text style={styles.previewConfigLabel}>Result Transformer:</Text>
                  <Text style={styles.previewConfigValue}>{template.resultTransformer}</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'query' && (
            <View style={styles.previewTabContent}>
              <View style={styles.previewSection}>
                <View style={styles.previewSectionHeader}>
                  <Text style={styles.previewSectionTitle}>Query Template</Text>
                  {template.queryTemplate && (
                    <TouchableOpacity 
                      onPress={() => copyToClipboard(template.queryTemplate, 'Query template')}
                      style={styles.previewCopyButton}
                    >
                      <Ionicons name="copy-outline" size={16} color={styles.previewCopyText.color} />
                      <Text style={styles.previewCopyText}>Copy</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {template.queryTemplate ? (
                  <View style={styles.previewCodeBlock}>
                    <Text style={styles.previewCodeText}>{template.queryTemplate}</Text>
                  </View>
                ) : (
                  <View style={styles.previewEmptyState}>
                    <Ionicons name="information-circle-outline" size={24} color={styles.previewMetaText.color} />
                    <Text style={styles.previewEmptyText}>This template uses HTTP endpoints instead of query templates</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'schema' && (
            <View style={styles.previewTabContent}>
              <View style={styles.previewSection}>
                <View style={styles.previewSectionHeader}>
                  <Text style={styles.previewSectionTitle}>Parameters Schema</Text>
                  <TouchableOpacity 
                    onPress={() => copyToClipboard(formatJSON(template.parametersSchema), 'Parameters schema')}
                    style={styles.previewCopyButton}
                  >
                    <Ionicons name="copy-outline" size={16} color={styles.previewCopyText.color} />
                    <Text style={styles.previewCopyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.previewCodeBlock}>
                  <Text style={styles.previewCodeText}>{formatJSON(template.parametersSchema)}</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'fallback' && (
            <View style={styles.previewTabContent}>
              <View style={styles.previewSection}>
                <View style={styles.previewSectionHeader}>
                  <Text style={styles.previewSectionTitle}>Fallback Data</Text>
                  <TouchableOpacity 
                    onPress={() => copyToClipboard(formatJSON(template.fallbackData), 'Fallback data')}
                    style={styles.previewCopyButton}
                  >
                    <Ionicons name="copy-outline" size={16} color={styles.previewCopyText.color} />
                    <Text style={styles.previewCopyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.previewCodeBlock}>
                  <Text style={styles.previewCodeText}>{formatJSON(template.fallbackData)}</Text>
                </View>
                <Text style={styles.previewHelpText}>
                  🛡️ This data is returned when external services are unavailable
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const TemplateLibraryScreen: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  embedded = false,
  selectedTemplateId
}) => {
  const styles = useTemplateStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const categories = ['All', ...new Set(SYSTEM_TEMPLATES.map(t => t.category))];

  const filteredTemplates = SYSTEM_TEMPLATES.filter(template => {
    const matchesSearch = !searchQuery || 
      template.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleTemplatePress = (template: any) => {
    if (embedded && onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      setPreviewTemplate(template);
      setShowPreview(true);
    }
  };

  const handleUseTemplate = (template: any) => {
    setShowPreview(false);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <View style={[styles.container, embedded && styles.embeddedContainer]}>
      {!embedded && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Template Library</Text>
          <Text style={styles.headerSubtitle}>
            Choose from pre-built templates to quickly create powerful functions
          </Text>
        </View>
      )}

      {/* Search and Filter */}
      {!embedded && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={styles.previewMetaText.color} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search templates..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={[styles.categoryContainer, embedded && styles.embeddedCategoryContainer]}
        contentContainerStyle={styles.categoryContentContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.selectedCategoryChipText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Templates Grid */}
      <ScrollView style={styles.templatesContainer}>
        <View style={styles.templatesGrid}>
          {filteredTemplates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                embedded && selectedTemplateId === template.id && styles.selectedTemplateCard
              ]}
              onPress={() => handleTemplatePress(template)}
            >
              <View style={styles.templateCardHeader}>
                <View style={[styles.templateCardIcon, { backgroundColor: styles.iconColors[template.color] }]}>
                  <Ionicons name={template.icon as any} size={20} color={styles.selectedCategoryChipText.color} />
                </View>
                <View style={styles.templateCardMeta}>
                  <Text style={styles.templateCardCategory}>{template.category}</Text>
                  <Text style={styles.templateCardComplexity}>{template.complexity}</Text>
                </View>
              </View>
              
              <Text style={styles.templateCardTitle}>{template.displayName}</Text>
              <Text style={styles.templateCardDescription} numberOfLines={3}>
                {template.description}
              </Text>
              
              <View style={styles.templateCardTags}>
                {template.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} style={styles.templateCardTag}>
                    <Text style={styles.templateCardTagText}>{tag}</Text>
                  </View>
                ))}
                {template.tags.length > 2 && (
                  <Text style={styles.templateCardMoreTags}>+{template.tags.length - 2}</Text>
                )}
              </View>

              <View style={styles.templateCardFooter}>
                <View style={styles.templateCardMethod}>
                  <Ionicons name="code-outline" size={14} color={styles.previewMetaText.color} />
                  <Text style={styles.templateCardMethodText}>{template.httpMethod}</Text>
                </View>
                {!embedded && (
                  <TouchableOpacity 
                    style={styles.templateCardPreviewButton}
                    onPress={() => {
                      setPreviewTemplate(template);
                      setShowPreview(true);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color={styles.previewCopyText.color} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filteredTemplates.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={48} color={styles.emptyStateSubtitle.color} />
            <Text style={styles.emptyStateTitle}>No templates found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </ScrollView>

      <TemplatePreviewModal
        visible={showPreview}
        template={previewTemplate}
        onClose={() => setShowPreview(false)}
        onUseTemplate={handleUseTemplate}
      />
    </View>
  );
};

export default TemplateLibraryScreen;