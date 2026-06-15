import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface DatePickerProps {
  label?: string;
  description?: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
  required?: boolean;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  description,
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  mode = 'date',
  required = false,
  error,
}) => {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const styles = useThemedStyles((colors) => ({
    container: {
      marginBottom: spacing.lg,
    },
    labelContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.xs,
    },
    label: {
      ...typography.title,
      color: colors.textPrimary,
    },
    required: {
      ...typography.title,
      color: colors.statusError,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    dateButton: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    dateButtonError: {
      borderColor: colors.statusError,
    },
    dateButtonPlaceholder: {
      backgroundColor: colors.bgSurface,
    },
    dateContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    calendarIcon: {
      marginRight: spacing.sm,
    },
    dateText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      flex: 1,
    },
    placeholderText: {
      color: colors.textSecondary,
    },
    clearButton: {
      marginLeft: spacing.sm,
    },
    errorText: {
      ...typography.body,
      color: colors.statusError,
      marginTop: spacing.xs,
    },
  }));

  const formatDate = (date: Date | null): string => {
    if (!date) return '';

    if (mode === 'date') {
      return date.toLocaleDateString();
    } else if (mode === 'time') {
      return date.toLocaleTimeString();
    } else {
      return date.toLocaleString();
    }
  };

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';

    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) {
      console.warn('Attempted to format invalid date for input:', date);
      return '';
    }

    // Format for HTML input type="date" (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShow(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    }

    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleWebDateChange = (dateString: string) => {
    if (dateString) {
      // Create date object with proper validation
      const selectedDate = new Date(dateString + 'T00:00:00');

      // Check if the date is valid
      if (!isNaN(selectedDate.getTime())) {
        onChange(selectedDate);
      } else {
        console.warn('Invalid date selected:', dateString);
        onChange(null);
      }
    } else {
      onChange(null);
    }
  };

  const handleClearDate = () => {
    onChange(null);
  };

  const displayValue = value ? formatDate(value) : placeholder;

  // Web-specific date input
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label && (
          <View style={styles.labelContainer}>
            <Text style={styles.label}>
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
          </View>
        )}

        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        <View style={[
          styles.dateButton,
          error && styles.dateButtonError,
          !value && styles.dateButtonPlaceholder
        ]}>
          <View style={styles.dateContent}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={value ? colors.accent : colors.textSecondary}
              style={styles.calendarIcon}
            />
            {/* @ts-ignore - Web-specific HTML input */}
            <input
              type="date"
              value={formatDateForInput(value)}
              onChange={(e: any) => handleWebDateChange(e.target.value)}
              placeholder={placeholder}
              min={minimumDate ? formatDateForInput(minimumDate) : undefined}
              max={maximumDate ? formatDateForInput(maximumDate) : undefined}
              style={{
                fontSize: 16,
                color: colors.textPrimary,
                flex: 1,
                border: 'none',
                outlineStyle: 'none',
                outlineWidth: 0,
                outlineColor: 'transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
              }}
            />
            {value && (
              <TouchableOpacity
                onPress={handleClearDate}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Native mobile date picker
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.dateButton,
          error && styles.dateButtonError,
          !value && styles.dateButtonPlaceholder
        ]}
        onPress={() => setShow(true)}
      >
        <View style={styles.dateContent}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={value ? colors.accent : colors.textSecondary}
            style={styles.calendarIcon}
          />
          <Text style={[
            styles.dateText,
            !value && styles.placeholderText
          ]}>
            {displayValue}
          </Text>
          {value && (
            <TouchableOpacity
              onPress={handleClearDate}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

// Utility function to format date for backend API calls
export const formatDateForAPI = (date: Date | null): string | undefined => {
  if (!date) return undefined;

  // Check if the date is valid before calling toISOString
  if (isNaN(date.getTime())) {
    console.warn('Attempted to format invalid date:', date);
    return undefined;
  }

  return date.toISOString();
};

// Utility function to parse date from backend response
export const parseDateFromAPI = (dateString: string | null): Date | null => {
  if (!dateString || dateString.trim() === '') return null;

  try {
    const parsedDate = new Date(dateString);

    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      console.warn('Failed to parse date - invalid date:', dateString);
      return null;
    }

    return parsedDate;
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
};

export default DatePicker;
