import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TeamMemoryViewer } from '../components/TeamMemoryViewer';
import { Team } from '../types';

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock the API client
jest.mock('../api/client', () => ({
  goGentAPI: {
    getTeamMemory: jest.fn(),
    searchTeamMemory: jest.fn(),
    clearTeamMemory: jest.fn(),
  },
}));

// Mock the auth context
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true,
  }),
}));

describe('TeamMemoryViewer', () => {
  const mockTeam: Team = {
    id: 'test-team-id',
    userId: 'test-user-id',
    name: 'Test Team',
    description: 'A test team for memory testing',
    maxTokensPerDay: 100000,
    tokensUsedToday: 5000,
    tokensResetDate: '2024-01-01',
    agentCount: 3,
    activeAgentCount: 2,
    totalExecutions: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    memorySizeBytes: 1024,
    memoryUpdatedAt: '2024-01-01T04:00:00Z',
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock API response to be synchronous
    const { goGentAPI } = require('../api/client');
    goGentAPI.getTeamMemory.mockResolvedValue({
      success: true,
      data: null,
    });
  });

  it('renders without crashing', () => {
    render(<TeamMemoryViewer team={mockTeam} onClose={mockOnClose} />);
    // If it renders without crashing, the test passes
    expect(true).toBe(true);
  });

  it('has a close button with testID', async () => {
    render(<TeamMemoryViewer team={mockTeam} onClose={mockOnClose} />);
    await waitFor(() => {
      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toBeTruthy();
    });
  });

  it('calls onClose when close button is pressed', async () => {
    render(<TeamMemoryViewer team={mockTeam} onClose={mockOnClose} />);
    await waitFor(() => {
      const closeButton = screen.getByTestId('close-button');
      fireEvent.press(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('has search input', async () => {
    render(<TeamMemoryViewer team={mockTeam} onClose={mockOnClose} />);
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search team memory...');
      expect(searchInput).toBeTruthy();
    });
  });

  it('has filter buttons', async () => {
    render(<TeamMemoryViewer team={mockTeam} onClose={mockOnClose} />);
    await waitFor(() => {
      // Check for filter buttons by looking for their text content
      const allButton = screen.getByText('All');
      const workflowButton = screen.getByText('Workflow');
      const sessionButton = screen.getByText('Session');
      const persistentButton = screen.getByText('Persistent');
      
      expect(allButton).toBeTruthy();
      expect(workflowButton).toBeTruthy();
      expect(sessionButton).toBeTruthy();
      expect(persistentButton).toBeTruthy();
    });
  });
});

