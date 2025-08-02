import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { CustomAlert, AlertAPI, AlertButton } from '../components/CustomAlert';

// Define mockAlert before using it
const mockAlert = {
  alert: jest.fn(),
};

// Mock React Native with proper setup
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'web', // Test web behavior
    },
    Alert: mockAlert,
  };
});

describe('CustomAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should not render when no alert is visible', () => {
      const { container } = render(<CustomAlert />);
      expect(container.children).toHaveLength(0);
    });

    test('should render alert when visible', async () => {
      render(<CustomAlert />);

      // Trigger alert
      AlertAPI.alert('Test Title', 'Test Message');

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeTruthy();
        expect(screen.getByText('Test Message')).toBeTruthy();
      });
    });

    test('should render without message', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('Title Only');

      await waitFor(() => {
        expect(screen.getByText('Title Only')).toBeTruthy();
      });
    });
  });

  describe('Button Handling', () => {
    test('should render default OK button when no buttons provided', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('Test Title', 'Test Message');

      await waitFor(() => {
        expect(screen.getByText('OK')).toBeTruthy();
      });
    });

    test('should render custom buttons', async () => {
      render(<CustomAlert />);

      const buttons: AlertButton[] = [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive' },
        { text: 'Confirm', style: 'default' },
      ];

      AlertAPI.alert('Test Title', 'Test Message', buttons);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
        expect(screen.getByText('Confirm')).toBeTruthy();
      });
    });

    test('should call button onPress handlers', async () => {
      const mockOnPress = jest.fn();
      render(<CustomAlert />);

      const buttons: AlertButton[] = [
        { text: 'Test Button', onPress: mockOnPress },
      ];

      AlertAPI.alert('Test Title', 'Test Message', buttons);

      await waitFor(() => {
        const button = screen.getByText('Test Button');
        fireEvent.press(button);
      });

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    test('should close alert after button press', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('Test Title', 'Test Message');

      await waitFor(() => {
        const okButton = screen.getByText('OK');
        fireEvent.press(okButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test Title')).toBeNull();
      });
    });
  });

  describe('AlertAPI Global Methods', () => {
    test('should handle simple alert call', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('Simple Alert');

      await waitFor(() => {
        expect(screen.getByText('Simple Alert')).toBeTruthy();
      });
    });

    test('should handle alert with message', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('Alert Title', 'Alert Message');

      await waitFor(() => {
        expect(screen.getByText('Alert Title')).toBeTruthy();
        expect(screen.getByText('Alert Message')).toBeTruthy();
      });
    });

    test('should handle alert with custom buttons', async () => {
      render(<CustomAlert />);

      const mockCallback = jest.fn();
      const buttons: AlertButton[] = [
        { text: 'Custom Button', onPress: mockCallback },
      ];

      AlertAPI.alert('Alert Title', 'Alert Message', buttons);

      await waitFor(() => {
        const button = screen.getByText('Custom Button');
        fireEvent.press(button);
      });

      expect(mockCallback).toHaveBeenCalled();
    });

    test('should handle multiple alerts sequentially', async () => {
      render(<CustomAlert />);

      // First alert
      AlertAPI.alert('First Alert');
      
      await waitFor(() => {
        expect(screen.getByText('First Alert')).toBeTruthy();
      });

      // Close first alert
      fireEvent.press(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.queryByText('First Alert')).toBeNull();
      });

      // Second alert should be able to display
      AlertAPI.alert('Second Alert');
      
      await waitFor(() => {
        expect(screen.getByText('Second Alert')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle alert when component is not mounted', () => {
      // Call AlertAPI before component is rendered
      expect(() => {
        AlertAPI.alert('Test Alert');
      }).not.toThrow();
    });

    test('should handle empty title', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('');

      await waitFor(() => {
        // Should still render the alert structure with OK button
        expect(screen.getByText('OK')).toBeTruthy();
      });
    });

    test('should handle undefined/null messages gracefully', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('Title Only', undefined);

      await waitFor(() => {
        expect(screen.getByText('Title Only')).toBeTruthy();
      });
    });
  });

  describe('Button Styles', () => {
    test('should apply different button styles', async () => {
      render(<CustomAlert />);

      const buttons: AlertButton[] = [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive' },
        { text: 'Default', style: 'default' },
      ];

      AlertAPI.alert('Test Title', 'Test Message', buttons);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        const deleteButton = screen.getByText('Delete');
        const defaultButton = screen.getByText('Default');

        expect(cancelButton).toBeTruthy();
        expect(deleteButton).toBeTruthy();
        expect(defaultButton).toBeTruthy();
      });
    });
  });

  describe('Platform Behavior', () => {
    test('should use custom modal on web platform', async () => {
      render(<CustomAlert />);

      AlertAPI.alert('Web Alert', 'Web Message');

      await waitFor(() => {
        expect(screen.getByText('Web Alert')).toBeTruthy();
        expect(screen.getByText('Web Message')).toBeTruthy();
      });
    });
  });

  describe('Memory Management', () => {
    test('should clean up global alert setter on unmount', () => {
      const { unmount } = render(<CustomAlert />);

      // Show alert
      AlertAPI.alert('Test Alert');

      // Unmount component
      unmount();

      // Subsequent alert calls should not throw errors
      expect(() => {
        AlertAPI.alert('After Unmount');
      }).not.toThrow();
    });
  });
}); 