import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Team } from '../types';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import { useTheme, useThemedStyles } from '../theme';

interface EditTeamContextModalProps {
  visible: boolean;
  team: Team | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditTeamContextModal: React.FC<EditTeamContextModalProps> = ({
  visible,
  team,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const [sharedTeamContext, setSharedTeamContext] = useState('');
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
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: '500' as const,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    saveButton: {
      backgroundColor: colors.accent,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center' as const,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    saveButtonText: {
      fontSize: 16,
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    teamInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
      backgroundColor: colors.bgCard,
      marginBottom: 16,
    },
    teamIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.bgHover,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 12,
    },
    teamDetails: {
      flex: 1,
    },
    teamName: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    teamDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    contextSection: {
      backgroundColor: colors.bgCard,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    inputContainer: {
      position: 'relative' as const,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.bgCard,
      minHeight: 120,
      textAlignVertical: 'top' as const,
    },
    characterCount: {
      position: 'absolute' as const,
      bottom: 8,
      right: 12,
      fontSize: 12,
      color: colors.textSecondary,
      backgroundColor: colors.bgCard,
      paddingHorizontal: 4,
    },
    infoSection: {
      backgroundColor: colors.bgCard,
      padding: 16,
    },
    infoItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginLeft: 8,
      flex: 1,
    },
  }));

  // Reset form when modal opens/closes or team changes
  useEffect(() => {
    if (visible && team) {
      // For now, we'll start with empty context since we don't store it on the team
      // In the future, we could extract it from one of the agents' effective_context
      setSharedTeamContext('');
    } else if (!visible) {
      setSharedTeamContext('');
    }
  }, [visible, team]);

  const handleSave = async () => {
    if (!team) return;

    setIsLoading(true);
    try {
      const response = await goGentAPI.updateTeamContext(
        team.id,
        sharedTeamContext.trim() || undefined
      );

      if (response.success) {
        AlertAPI.alert('Success', 'Team context updated successfully!');
        onSuccess();
        onClose();
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to update team context');
      }
    } catch (error) {
      console.error('Error updating team context:', error);
      AlertAPI.alert('Error', 'Failed to update team context');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSharedTeamContext('');
    onClose();
  };

  if (!team) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Edit Team Context</Text>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Team Info */}
        <View style={styles.teamInfo}>
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={24} color={colors.accent} />
          </View>
          <View style={styles.teamDetails}>
            <Text style={styles.teamName}>{team.name}</Text>
            {team.description && (
              <Text style={styles.teamDescription}>{team.description}</Text>
            )}
          </View>
        </View>

        {/* Context Input Section */}
        <View style={styles.contextSection}>
          <Text style={styles.sectionTitle}>Shared Team Context</Text>
          <Text style={styles.sectionDescription}>
            This context will be appended to each agent's individual template context.
            Use this to provide shared guidelines, project information, or team-specific instructions.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={sharedTeamContext}
              onChangeText={setSharedTeamContext}
              placeholder="Enter shared team context (e.g., project guidelines, company policies, specific requirements...)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.characterCount}>
              {sharedTeamContext.length}/2000
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={colors.accent} />
            <Text style={styles.infoText}>
              This context will be combined with each agent's template context during execution
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color={colors.statusSuccess} />
            <Text style={styles.infoText}>
              All agents in this team will receive the updated context
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditTeamContextModal;
