import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  const [sharedTeamContext, setSharedTeamContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Team Info */}
        <View style={styles.teamInfo}>
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={24} color="#007AFF" />
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
              placeholderTextColor="#8E8E93"
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
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              This context will be combined with each agent's template context during execution
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color="#34C759" />
            <Text style={styles.infoText}>
              All agents in this team will receive the updated context
            </Text>
          </View>
        </View>
      </View>
    </Modal>
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
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 18,
  },
  contextSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});

export default EditTeamContextModal;
