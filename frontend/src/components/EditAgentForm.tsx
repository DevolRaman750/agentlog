import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import AgentAvatar from './AgentAvatar';
import { Agent, AgentFormData, AgentFormErrors, LifecycleStatus, ExecutionTemplate } from '../types';
import { containerStyles, shadowPresets, textInputStyles, containerColors } from '../styles/containers';

interface EditAgentFormProps {
  agent: Agent;
  onSuccess: () => void;
  onCancel: () => void;
}

interface TooltipProps {
  title: string;
  content: string;
  visible: boolean;
  onClose: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({ title, content, visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.tooltipOverlay} onPress={onClose}>
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.tooltipTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.tooltipContent}>{content}</Text>
      </View>
    </TouchableOpacity>
  </Modal>
);

const EditAgentForm: React.FC<EditAgentFormProps> = ({ agent, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<AgentFormData>({
    firstName: agent.firstName,
    lastName: agent.lastName,
    templateId: agent.templateId,
    maxTokensPerDay: agent.maxTokensPerDay,
    heartbeatMinutes: agent.heartbeatMinutes,
    lifecycleStatus: agent.lifecycleStatus,
  });

  const [templates, setTemplates] = useState<ExecutionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<AgentFormErrors>({});

  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAgentTooltip, setShowAgentTooltip] = useState(false);
  const [showTemplateTooltip, setShowTemplateTooltip] = useState(false);
  const [showHeartbeatTooltip, setShowHeartbeatTooltip] = useState(false);
  const [showTokensTooltip, setShowTokensTooltip] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await goGentAPI.getTemplates();
      if (response.success && response.data?.templates) {
        setTemplates(response.data.templates);
      } else {
        AlertAPI.alert('Error', 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      AlertAPI.alert('Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: AgentFormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.templateId) {
      newErrors.templateId = 'Archetype template selection is required';
    }

    if (formData.maxTokensPerDay < 1000) {
      newErrors.maxTokensPerDay = 'Minimum 1,000 tokens per day';
    }

    if (formData.heartbeatMinutes < 5) {
      newErrors.heartbeatMinutes = 'Minimum 5 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await goGentAPI.updateAgent(agent.id, formData);
      
      if (response.success) {
        AlertAPI.alert('Success', 'Agent updated successfully!', [
          { text: 'OK', onPress: onSuccess }
        ]);
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      AlertAPI.alert('Error', 'Failed to update agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getStatusInfo = (status: LifecycleStatus): { description: string; color: string; icon: string } => {
    switch (status) {
      case 'STANDBY':
        return {
          description: 'Testing mode - Logs actions but doesn\'t execute them',
          color: '#ffc107',
          icon: 'pause-circle'
        };
      case 'ACTIVE':
        return {
          description: 'Fully operational - Executes tasks according to schedule',
          color: '#28a745',
          icon: 'play-circle'
        };
      case 'PAUSED':
        return {
          description: 'Temporarily stopped - Can be resumed anytime',
          color: '#6c757d',
          icon: 'stop-circle'
        };
      case 'KILLED':
        return {
          description: 'Permanently disabled - Cannot be reactivated',
          color: '#dc3545',
          icon: 'close-circle'
        };
      default:
        return { description: '', color: '#6c757d', icon: 'help-circle' };
    }
  };

  const hasChanges = (): boolean => {
    return (
      formData.firstName !== agent.firstName ||
      formData.lastName !== agent.lastName ||
      formData.templateId !== agent.templateId ||
      formData.maxTokensPerDay !== agent.maxTokensPerDay ||
      formData.heartbeatMinutes !== agent.heartbeatMinutes ||
      formData.lifecycleStatus !== agent.lifecycleStatus
    );
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);
  const statusInfo = getStatusInfo(formData.lifecycleStatus);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="pencil" size={28} color="#007AFF" />
          <Text style={styles.title}>Edit Agent</Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Agent Overview Tooltip */}
        <View style={styles.overviewSection}>
          <TouchableOpacity 
            style={styles.overviewHeader}
            onPress={() => setShowAgentTooltip(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.overviewTitle}>About Agent Editing</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Character Preview */}
        <View style={styles.characterPreview}>
          <View style={styles.previewHeader}>
            <Ionicons name="sparkles" size={20} color="#007AFF" />
            <Text style={styles.previewTitle}>Character Profile</Text>
          </View>
          <View style={styles.previewContent}>
            <AgentAvatar 
              agent={{
                firstName: formData.firstName || agent.firstName,
                lastName: formData.lastName || agent.lastName,
                lifecycleStatus: formData.lifecycleStatus,
                templateName: selectedTemplate?.name || agent.templateName
              }} 
              size="xl" 
              showStatus={true}
              animated={true}
            />
            <View style={styles.previewText}>
              <Text style={styles.previewName}>
                {formData.firstName} {formData.lastName}
              </Text>
              <Text style={styles.previewRole}>
                {selectedTemplate?.name || agent.templateName}
              </Text>
              <Text style={styles.previewChanges}>
                {hasChanges() ? '✨ Changes pending' : '✓ All saved'}
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[textInputStyles.base, errors.firstName && styles.inputError]}
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
                placeholder="Enter first name"
                placeholderTextColor="#999"
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>
            
            <View style={styles.inputColumn}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[textInputStyles.base, errors.lastName && styles.inputError]}
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
                placeholder="Enter last name"
                placeholderTextColor="#999"
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>
          </View>
        </View>

        {/* Template Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Archetype Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateTooltip(true)}>
              <Ionicons name="help-circle-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.selectorButton, errors.templateId && styles.inputError]}
            onPress={() => setShowTemplateModal(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorMain}>
                <Text style={styles.selectorLabel}>Selected Archetype Template</Text>
                <Text style={selectedTemplate ? styles.selectorValue : styles.selectorPlaceholder}>
                  {selectedTemplate ? selectedTemplate.name : 'Choose an archetype template'}
                </Text>
                {selectedTemplate && (
                  <Text style={styles.selectorDescription} numberOfLines={2}>
                    {selectedTemplate.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </View>
          </TouchableOpacity>
          {errors.templateId && <Text style={styles.errorText}>{errors.templateId}</Text>}
        </View>

        {/* Behavior Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Behavior Settings</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Heartbeat (min) *</Text>
                <TouchableOpacity onPress={() => setShowHeartbeatTooltip(true)}>
                  <Ionicons name="help-circle-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[textInputStyles.base, errors.heartbeatMinutes && styles.inputError]}
                value={formData.heartbeatMinutes.toString()}
                onChangeText={(value) => updateFormData('heartbeatMinutes', parseInt(value) || 5)}
                placeholder="5"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {errors.heartbeatMinutes && <Text style={styles.errorText}>{errors.heartbeatMinutes}</Text>}
            </View>
            
            <View style={styles.inputColumn}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Max Tokens/Day *</Text>
                <TouchableOpacity onPress={() => setShowTokensTooltip(true)}>
                  <Ionicons name="help-circle-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[textInputStyles.base, errors.maxTokensPerDay && styles.inputError]}
                value={formData.maxTokensPerDay.toString()}
                onChangeText={(value) => updateFormData('maxTokensPerDay', parseInt(value) || 10000)}
                placeholder="10000"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {errors.maxTokensPerDay && <Text style={styles.errorText}>{errors.maxTokensPerDay}</Text>}
            </View>
          </View>
        </View>

        {/* Lifecycle Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Lifecycle Status</Text>
            <TouchableOpacity onPress={() => setShowStatusTooltip(true)}>
              <Ionicons name="help-circle-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.selectorButton}
            onPress={() => setShowStatusModal(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorMain}>
                <Text style={styles.selectorLabel}>Current Status</Text>
                <View style={styles.statusIndicator}>
                  <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
                  <Text style={[styles.selectorValue, { color: statusInfo.color }]}>
                    {formData.lifecycleStatus}
                  </Text>
                </View>
                <Text style={styles.selectorDescription} numberOfLines={2}>
                  {statusInfo.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            (!hasChanges() || isSubmitting) && styles.saveButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={!hasChanges() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Template Selection Modal */}
      <Modal visible={showTemplateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Archetype Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.templateCard,
                  formData.templateId === item.id && styles.templateCardSelected
                ]}
                onPress={() => {
                  updateFormData('templateId', item.id);
                  setShowTemplateModal(false);
                }}
              >
                <View style={styles.templateCardHeader}>
                  <Text style={styles.templateCardName}>{item.name}</Text>
                  <View style={[
                    styles.templateBadge,
                    { backgroundColor: item.isPublic ? '#007AFF' : '#28a745' }
                  ]}>
                    <Text style={styles.templateBadgeText}>
                      {item.isPublic ? 'Public' : 'Private'}
                    </Text>
                  </View>
                  {formData.templateId === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.templateCardDescription} numberOfLines={3}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal visible={showStatusModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalList}>
            {(['STANDBY', 'ACTIVE', 'PAUSED', 'KILLED'] as LifecycleStatus[]).map((status) => {
              const info = getStatusInfo(status);
              const isSelected = formData.lifecycleStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusCard, isSelected && styles.statusCardSelected]}
                  onPress={() => {
                    updateFormData('lifecycleStatus', status);
                    setShowStatusModal(false);
                  }}
                >
                  <View style={styles.statusCardContent}>
                    <Ionicons name={info.icon as any} size={28} color={info.color} />
                    <View style={styles.statusCardText}>
                      <Text style={[styles.statusCardName, { color: info.color }]}>
                        {status}
                      </Text>
                      <Text style={styles.statusCardDescription}>
                        {info.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Tooltips */}
      <Tooltip
        title="Agent Editing"
        content="You're editing an existing agent. Changes to the template selection will affect how the agent behaves in future executions. The agent will maintain its execution history and current token usage."
        visible={showAgentTooltip}
        onClose={() => setShowAgentTooltip(false)}
      />

      <Tooltip
                  title="Archetype Templates"
        content="Templates define what your agent does and how it behaves. Changing the template will update the agent's capabilities and behavior for future executions. System templates are pre-built and maintained by the platform."
        visible={showTemplateTooltip}
        onClose={() => setShowTemplateTooltip(false)}
      />

      <Tooltip
        title="Heartbeat Cadence"
        content="How often your agent checks for work and potentially executes. Minimum is 5 minutes. More frequent heartbeats consume more resources but provide faster response times. Consider your use case when setting this."
        visible={showHeartbeatTooltip}
        onClose={() => setShowHeartbeatTooltip(false)}
      />

      <Tooltip
        title="Token Budget"
        content="Daily limit for AI model token usage. Prevents runaway costs. Agent stops executing when limit is reached and resets at midnight UTC. Recommended: 10,000+ for active agents, 50,000+ for heavy workloads."
        visible={showTokensTooltip}
        onClose={() => setShowTokensTooltip(false)}
      />

      <Tooltip
        title="Lifecycle Status"
        content="Controls agent behavior: STANDBY (testing/logging only), ACTIVE (full execution), PAUSED (temporarily stopped), KILLED (permanently disabled). Use STANDBY to test agent behavior safely."
        visible={showStatusTooltip}
        onClose={() => setShowStatusTooltip(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: containerColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: containerColors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    ...shadowPresets.small,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  overviewSection: {
    marginBottom: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    ...shadowPresets.small,
  },
  overviewTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  characterPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  previewRole: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  previewChanges: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    ...shadowPresets.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputColumn: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  selectorButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorMain: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  selectorDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    ...shadowPresets.small,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadowPresets.small,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: containerColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  modalList: {
    padding: 20,
    gap: 12,
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...shadowPresets.small,
  },
  templateCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  templateCardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  templateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  templateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  templateCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...shadowPresets.small,
  },
  statusCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusCardText: {
    flex: 1,
  },
  statusCardName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxWidth: '90%',
    ...shadowPresets.medium,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tooltipTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  tooltipContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default EditAgentForm; 