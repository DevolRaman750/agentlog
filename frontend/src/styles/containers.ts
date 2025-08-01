import { StyleSheet } from 'react-native';

export const containerStyles = StyleSheet.create({
  // Main app background
  appBackground: {
    backgroundColor: '#F2F2F7',
  },

  // Primary content containers (main sections)
  primaryContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E1E5EA',
  },

  // Secondary containers (subsections, cards)
  secondaryContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E8ECEF',
  },

  // Nested containers (inside other containers)
  nestedContainer: {
    backgroundColor: '#FBFCFD',
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F3F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // List item containers
  listItemContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#EBEEF2',
  },

  // Modal containers
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  // Input/form containers
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Special purpose containers
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  // Status/info containers
  statusContainer: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },

  // Spacing utilities
  sectionSpacer: {
    height: 24, // Larger gap between major sections
  },

  containerSpacer: {
    height: 16, // Medium gap between containers
  },

  itemSpacer: {
    height: 8, // Small gap between items
  },
});

// Enhanced shadow presets for different importance levels
export const shadowPresets = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  dramatic: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Color variations for different container types
export const containerColors = {
  primary: '#FFFFFF',
  secondary: '#FBFCFD', 
  nested: '#F8F9FA',
  muted: '#F1F3F4',
  background: '#F2F2F7',
  
  // Border colors with better contrast
  borders: {
    subtle: '#F0F3F6',
    light: '#E8ECEF',
    medium: '#E1E5EA',
    strong: '#D1D5DB',
  }
}; 