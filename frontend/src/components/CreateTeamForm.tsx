import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';
import { goGentAPI } from '../api/client';
import { TeamFormData, TeamFormErrors } from '../types';
import { AlertAPI } from './CustomAlert';

interface CreateTeamFormProps {
  visible: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({
  visible,
  onClose,
  onTeamCreated,
}) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    maxTokensPerDay: 10000,
  });

  const [errors, setErrors] = useState<TeamFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    cancelButton: {
      padding: 8,
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.accent,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    saveButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 70,
      alignItems: 'center' as const,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginLeft: 8,
    },
    fieldContainer: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    textArea: {
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minHeight: 80,
    },
    inputError: {
      borderColor: colors.statusError,
      backgroundColor: '#FFF5F5',
    },
    errorText: {
      fontSize: 14,
      color: colors.statusError,
      marginTop: 4,
    },
    helpText: {
      fontSize: 14,
      color: '#6B6B6B',
      marginTop: 4,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right' as const,
      marginTop: 4,
    },
    infoSection: {
      marginBottom: 20,
    },
    infoContainer: {
      flexDirection: 'row' as const,
      backgroundColor: colors.bgHover,
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    infoText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
      marginLeft: 8,
      flex: 1,
    },
  }));

  const validateForm = (): boolean => {
    const newErrors: TeamFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Team name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (formData.maxTokensPerDay < 1000) {
      newErrors.maxTokensPerDay = 'Max tokens per day must be at least 1,000';
    } else if (formData.maxTokensPerDay > 1000000) {
      newErrors.maxTokensPerDay = 'Max tokens per day cannot exceed 1,000,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await goGentAPI.createTeam(formData);

      if (response.success) {
        AlertAPI.alert('Success', 'Team created successfully!');
        handleClose();
        onTeamCreated();
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      AlertAPI.alert('Error', 'Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      maxTokensPerDay: 10000,
    });
    setErrors({});
    setIsLoading(false);
    onClose();
  };

  const updateField = (field: keyof TeamFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Team</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Team Name */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Team Information</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Team Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter team name"
                placeholderTextColor={colors.textSecondary}
                maxLength={50}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                placeholder="Optional team description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {formData.description?.length || 0}/200
              </Text>
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          </View>

          {/* Token Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="speedometer" size={18} color={colors.statusWarning} />
              <Text style={styles.sectionTitle}>Token Management</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Max Tokens Per Day *</Text>
              <TextInput
                style={[styles.input, errors.maxTokensPerDay && styles.inputError]}
                value={formData.maxTokensPerDay.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  updateField('maxTokensPerDay', value);
                }}
                placeholder="10000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>
                Maximum tokens all agents in this team can use per day combined
              </Text>
              {errors.maxTokensPerDay && <Text style={styles.errorText}>{errors.maxTokensPerDay}</Text>}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={20} color={colors.accent} />
              <Text style={styles.infoText}>
                Teams help organize agents and manage token usage collectively.
                You can assign agents to teams and control all team agents together.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateTeamForm;
