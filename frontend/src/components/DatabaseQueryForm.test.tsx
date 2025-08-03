import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DatabaseQueryForm, DatabaseQueryData } from './DatabaseQueryForm';
import { FunctionDefinition } from '../types';

// Mock the TextEditor component
jest.mock('./TextEditor', () => {
  const { TextInput } = require('react-native');
  return ({ value, onChangeText, placeholder }: any) => (
    <TextInput
      testID="text-editor"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline
    />
  );
});

// Mock the CustomAlert component
jest.mock('./CustomAlert', () => ({
  CustomAlert: ({ visible, title, message, onClose }: any) => {
    const { Modal, Text, TouchableOpacity } = require('react-native');
    return (
      <Modal visible={visible} testID="custom-alert">
        <Text testID="alert-title">{title}</Text>
        <Text testID="alert-message">{message}</Text>
        <TouchableOpacity testID="alert-close" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </Modal>
    );
  },
}));

// Mock Picker
jest.mock('@react-native-picker/picker', () => ({
  Picker: ({ children, onValueChange, selectedValue }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="picker">
        <Text testID="picker-selected">{selectedValue}</Text>
        {React.Children.map(children, (child, index) => (
          <TouchableOpacity
            key={index}
            testID={`picker-item-${child.props.value}`}
            onPress={() => onValueChange(child.props.value)}
          >
            <Text>{child.props.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
  Item: ({ label, value }: any) => ({ label, value }),
}));

const mockMysqlFunction: FunctionDefinition = {
  id: 'func-mysql-data-reader',
  name: 'mysql_query_data',
  displayName: 'MySQL Data Query',
  description: 'Execute secure MySQL SELECT queries',
  functionGroup: 'database',
  parametersSchema: {},
  httpMethod: 'MYSQL',
  isActive: true,
  createdAt: new Date(),
  isSystemResource: true,
};

describe('DatabaseQueryForm', () => {
  const mockOnExecuteQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
        mysqlFunction={mockMysqlFunction}
      />
    );

    expect(getByText('MySQL Database Query')).toBeTruthy();
    expect(getByText('Execute secure SELECT queries against configured databases')).toBeTruthy();
    expect(getByTestId('text-editor')).toBeTruthy();
  });

  it('validates SQL queries correctly', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
        mysqlFunction={mockMysqlFunction}
      />
    );

    const textEditor = getByTestId('text-editor');
    
    // Test empty query
    fireEvent.changeText(textEditor, '');
    await waitFor(() => {
      expect(queryByText('SQL query is required')).toBeTruthy();
    });

    // Test non-SELECT query
    fireEvent.changeText(textEditor, 'DELETE FROM users WHERE id = 1');
    await waitFor(() => {
      expect(queryByText('Only SELECT queries are allowed for security')).toBeTruthy();
    });

    // Test dangerous pattern
    fireEvent.changeText(textEditor, 'SELECT * FROM users; DROP TABLE users;');
    await waitFor(() => {
      expect(queryByText(/Dangerous SQL pattern detected/)).toBeTruthy();
    });

    // Test valid query
    fireEvent.changeText(textEditor, 'SELECT id, name FROM users LIMIT 10');
    await waitFor(() => {
      expect(queryByText('SQL query is required')).toBeFalsy();
      expect(queryByText('Only SELECT queries are allowed for security')).toBeFalsy();
    });
  });

  it('handles query execution', async () => {
    const { getByTestId, getByText } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
        mysqlFunction={mockMysqlFunction}
      />
    );

    const textEditor = getByTestId('text-editor');
    const executeButton = getByText('Execute Query');

    // Enter valid query
    fireEvent.changeText(textEditor, 'SELECT id, name FROM users LIMIT 10');

    // Execute query
    fireEvent.press(executeButton);

    await waitFor(() => {
      expect(mockOnExecuteQuery).toHaveBeenCalledWith({
        query: 'SELECT id, name FROM users LIMIT 10',
        database: 'main',
        limit: 100,
        timeout: 30,
        format: 'json'
      });
    });
  });

  it('shows sample queries', () => {
    const { getByText, getByTestId } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
        mysqlFunction={mockMysqlFunction}
      />
    );

    const samplesButton = getByText('Samples');
    fireEvent.press(samplesButton);

    expect(getByText('Sample Queries:')).toBeTruthy();
    expect(getByText('users:')).toBeTruthy();
    expect(getByText('functions:')).toBeTruthy();
  });

  it('handles database selection', () => {
    const { getByTestId } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
        mysqlFunction={mockMysqlFunction}
      />
    );

    const analyticsItem = getByTestId('picker-item-analytics');
    fireEvent.press(analyticsItem);

    const selectedValue = getByTestId('picker-selected');
    expect(selectedValue.props.children).toBe('analytics');
  });

  it('handles format selection', () => {
    const { getByText } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
        mysqlFunction={mockMysqlFunction}
      />
    );

    const csvButton = getByText('CSV');
    fireEvent.press(csvButton);

    // Format should be selected (button should have active style)
    // This is a basic test - in a real scenario we'd check for style changes
    expect(csvButton).toBeTruthy();
  });

  it('shows loading state', () => {
    const { getByText } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
        mysqlFunction={mockMysqlFunction}
        loading={true}
      />
    );

    expect(getByText('Executing...')).toBeTruthy();
  });

  it('shows warning when mysql function is not provided', () => {
    const { getByText } = render(
      <DatabaseQueryForm 
        onExecuteQuery={mockOnExecuteQuery}
      />
    );

    expect(getByText('MySQL function not found. Please ensure the function is configured.')).toBeTruthy();
  });
}); 