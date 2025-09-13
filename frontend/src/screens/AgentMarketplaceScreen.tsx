import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import AgentMarketplaceCard from '../components/AgentMarketplaceCard';
import TeamMarketplaceCard from '../components/TeamMarketplaceCard';
import AgentResumeModal from '../components/AgentResumeModal';
import TeamResumeModal from '../components/TeamResumeModal';
import SuccessTooltip from '../components/SuccessTooltip';
import { useResponsive } from '../context/ResponsiveContext';
import { MarketplaceAgent, MarketplaceTeam, FunctionDefinition } from '../types/marketplace';
import { generateMarketplaceAgents } from '../data/marketplaceAgents';
import { generateMarketplaceTeams } from '../data/marketplaceTeams';
import { goGentAPI } from '../api/client';

// Remove static width, use screenWidth from useResponsive instead

interface FilterState {
  category: string[];
  functions: string[];
  experience: string[];
  searchTerm: string;
}

type MarketplaceView = 'agents' | 'teams';

const AgentMarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { screenWidth, isSidebarLayout } = useResponsive();
  
  const [agents] = useState<MarketplaceAgent[]>(generateMarketplaceAgents());
  const [teams] = useState<MarketplaceTeam[]>(generateMarketplaceTeams());
  const [currentView, setCurrentView] = useState<MarketplaceView>('teams');
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<MarketplaceTeam | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessTooltip, setShowSuccessTooltip] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    functions: [],
    experience: [],
    searchTerm: '',
  });

  // Get unique filter options from agents and teams
  const filterOptions = useMemo(() => {
    if (currentView === 'agents') {
      const categories = [...new Set(agents.map(agent => agent.category))];
      const functionGroups = [...new Set(
        agents.flatMap(agent => agent.capabilities.functionGroups)
      )];
      const experienceLevels = [...new Set(agents.map(agent => agent.experienceLevel))];
      
      return { categories, functionGroups, experienceLevels };
    } else {
      const categories = [...new Set(teams.map(team => team.category))];
      const integrations = [...new Set(
        teams.flatMap(team => team.capabilities.integrations)
      )];
      const teamSizes = [...new Set(teams.map(team => `${team.teamSize} agents`))];
      
      return { 
        categories, 
        functionGroups: integrations, 
        experienceLevels: teamSizes 
      };
    }
  }, [agents, teams, currentView]);

  // Filter agents based on current filters
  const filteredAgents = useMemo(() => {
    if (currentView !== 'agents') return [];
    
    return agents.filter(agent => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          agent.name.toLowerCase().includes(searchLower) ||
          agent.role.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower) ||
          agent.capabilities.specialties.some((specialty: string) => 
            specialty.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category.length > 0 && !filters.category.includes(agent.category)) {
        return false;
      }

      // Function groups filter
      if (filters.functions.length > 0) {
        const hasRequiredFunction = filters.functions.some(requiredFunc =>
          agent.capabilities.functionGroups.includes(requiredFunc)
        );
        if (!hasRequiredFunction) return false;
      }

      // Experience level filter
      if (filters.experience.length > 0 && !filters.experience.includes(agent.experienceLevel)) {
        return false;
      }

      return true;
    });
  }, [agents, filters, currentView]);

  // Filter teams based on current filters
  const filteredTeams = useMemo(() => {
    if (currentView !== 'teams') return [];
    
    return teams.filter(team => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          team.name.toLowerCase().includes(searchLower) ||
          team.description.toLowerCase().includes(searchLower) ||
          team.capabilities.overview.some((item: string) => 
            item.toLowerCase().includes(searchLower)
          ) ||
          team.capabilities.coverage.some((item: string) => 
            item.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category.length > 0 && !filters.category.includes(team.category)) {
        return false;
      }

      // Integration filter (mapped to functions)
      if (filters.functions.length > 0) {
        const hasRequiredIntegration = filters.functions.some(requiredFunc =>
          team.capabilities.integrations.includes(requiredFunc)
        );
        if (!hasRequiredIntegration) return false;
      }

      // Team size filter (mapped to experience)
      if (filters.experience.length > 0) {
        const teamSizeString = `${team.teamSize} agents`;
        if (!filters.experience.includes(teamSizeString)) {
          return false;
        }
      }

      return true;
    });
  }, [teams, filters, currentView]);

  const handleAgentSelect = (agent: MarketplaceAgent) => {
    setSelectedAgent(agent);
    setShowResumeModal(true);
  };

  const handleTeamSelect = (team: MarketplaceTeam) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const handleHireAgent = (agent: MarketplaceAgent) => {
    // Navigate to create agent form with comprehensive pre-filled data
    
    // Improved name extraction logic
    const nameParts = agent.name.split(/[\s-]+/); // Split on spaces and hyphens
    let firstName = nameParts[0] || '';
    let lastName = nameParts.slice(1).join(' ') || '';
    
    // If no lastName after splitting, create one based on the agent type
    if (!lastName && firstName) {
      // Extract meaningful lastName from compound names like "CodeAnalyst-Prime-7"
      if (firstName.includes('-')) {
        const parts = firstName.split('-');
        firstName = parts[0];
        lastName = parts.slice(1).join('-');
      } else {
        // For single words, add a meaningful suffix based on role
        lastName = agent.role.split(' ')[0] || 'Agent';
      }
    }

    // Map marketplace template IDs to actual system template IDs
    const getSystemTemplateId = (marketplaceTemplateId: string, experienceLevel: string) => {
      // Mapping from marketplace template IDs to system template IDs
      const templateMapping: { [key: string]: string } = {
        'template-code-analyst': 'template-intern-swe',
        'template-autonomous-swe': 'template-software-engineer',
        'template-weather-comms': 'template-weatherman',
        'template-intern-swe': 'template-intern-swe',
        'template-software-engineer': 'template-software-engineer',
        'template-weatherman': 'template-weatherman',
      };

      // If exact mapping exists, use it
      if (templateMapping[marketplaceTemplateId]) {
        return templateMapping[marketplaceTemplateId];
      }

      // Otherwise, map based on experience level and role
      if (experienceLevel === 'Expert' || experienceLevel === 'Senior') {
        return 'template-software-engineer';
      } else if (experienceLevel === 'Junior' || experienceLevel === 'Mid-Level') {
        return 'template-intern-swe';
      }

      // Default fallback
      return 'template-intern-swe';
    };
    
    // Set intelligent defaults based on agent experience level
    const getAgentDefaults = (experienceLevel: string) => {
      switch (experienceLevel) {
        case 'Expert':
          return {
            maxTokensPerDay: 20000,
            heartbeatMinutes: 3, // More frequent monitoring for expert agents
          };
        case 'Senior':
          return {
            maxTokensPerDay: 15000,
            heartbeatMinutes: 5,
          };
        case 'Mid-Level':
          return {
            maxTokensPerDay: 10000,
            heartbeatMinutes: 7,
          };
        case 'Junior':
          return {
            maxTokensPerDay: 8000,
            heartbeatMinutes: 10, // Less frequent for junior agents
          };
        default:
          return {
            maxTokensPerDay: 10000,
            heartbeatMinutes: 5,
          };
      }
    };

    const defaults = getAgentDefaults(agent.experienceLevel);
    const systemTemplateId = getSystemTemplateId(agent.templateId, agent.experienceLevel);
    
    // Show success tooltip
    setSuccessMessage(`Agent "${agent.name}" ready to be created!`);
    setShowSuccessTooltip(true);
    setShowResumeModal(false);
    
    // Navigate to AgentsScreen with prefilled data after a short delay
    setTimeout(() => {
      navigation.navigate('Agents', {
        prefilledAgent: {
          // Basic Info
          firstName,
          lastName,
          templateId: systemTemplateId,
          
          // Operational Parameters (intelligent defaults)
          maxTokensPerDay: defaults.maxTokensPerDay,
          heartbeatMinutes: defaults.heartbeatMinutes,
          lifecycleStatus: 'STANDBY' as any, // Start in standby mode
          
          // Additional metadata for the form
          description: agent.description,
          functionGroups: agent.capabilities.functionGroups,
          
          // Marketplace-specific info
          marketplaceAgent: {
            role: agent.role,
            category: agent.category,
            experienceLevel: agent.experienceLevel,
            modelConfig: agent.modelConfig,
            apiRequirements: agent.apiRequirements,
            highlights: agent.highlights,
          }
        }
      });
    }, 1000);
  };

  const handleHireTeam = async (team: MarketplaceTeam, sharedTeamContext?: string) => {
    try {
      // Create the team with all agents via API
      const teamCreateRequest = {
        name: team.name,
        description: team.description,
        maxTokensPerDay: team.agents.reduce((total, agent) => total + agent.defaultConfig.maxTokensPerDay, 0),
        teamConfigId: team.teamConfigId,
        sharedTeamContext: sharedTeamContext || undefined,
        agents: team.agents.map(agent => ({
          firstName: agent.name.split(' ')[0] || agent.role.split(' ')[0],
          lastName: agent.name.split(' ').slice(1).join(' ') || 'Agent',
          templateId: agent.templateId,
          maxTokensPerDay: agent.defaultConfig.maxTokensPerDay,
          heartbeatMinutes: agent.defaultConfig.heartbeatMinutes,
          lifecycleStatus: agent.defaultConfig.lifecycleStatus
        }))
      };

      // Make the API call to create the team with agents
      const response = await goGentAPI.createTeamWithAgents(teamCreateRequest);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create team');
      }
      
      // Show success tooltip
      setSuccessMessage(`Team "${team.name}" successfully created with ${team.agents.length} agents in standby mode!`);
      setShowSuccessTooltip(true);
      setShowTeamModal(false);
      
      // Navigate to AgentsScreen after a short delay to show the tooltip
      setTimeout(() => {
        navigation.navigate('Agents');
      }, 1000);
    } catch (error) {
      console.error('Failed to create team:', error);
      // Handle error - show alert or toast
    }
  };

  const toggleFilter = (filterType: keyof FilterState, value: string) => {
    if (filterType === 'searchTerm') return;
    
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: [],
      functions: [],
      experience: [],
      searchTerm: '',
    });
  };

  const getGridLayout = useMemo(() => {
    const itemGap = 16; // Gap between items
    const minCardWidth = 280; // Minimum card width to prevent clipping
    
    // Calculate available width (accounting for container padding)
    const containerPadding = 32; // 16px on each side
    const availableWidth = screenWidth - containerPadding;
    
    // Calculate how many cards can fit with minimum width
    const maxCardsPerRow = Math.floor((availableWidth + itemGap) / (minCardWidth + itemGap));
    const numColumns = Math.max(1, Math.min(3, maxCardsPerRow));
    
    // Calculate item width to fill available space
    const totalGapWidth = (numColumns - 1) * itemGap;
    const itemWidth = (availableWidth - totalGapWidth) / numColumns;
    
    return { 
      numColumns, 
      itemWidth: Math.floor(itemWidth),
      availableWidth,
      itemGap
    };
  }, [screenWidth]);

  const renderFilterChip = (label: string, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[styles.filterChip, isSelected && styles.filterChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.title}>Agent Marketplace</Text>
          <Text style={styles.subtitle}>
            {currentView === 'agents' 
              ? 'Find the perfect AI agent for your team'
              : 'Deploy complete AI teams with coordinated agents'
            }
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={24} color="#007AFF" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[styles.viewToggleButton, currentView === 'agents' && styles.viewToggleButtonActive]}
          onPress={() => setCurrentView('agents')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={currentView === 'agents' ? '#FFFFFF' : '#007AFF'} 
          />
          <Text style={[styles.viewToggleText, currentView === 'agents' && styles.viewToggleTextActive]}>
            Individual Agents
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleButton, currentView === 'teams' && styles.viewToggleButtonActive]}
          onPress={() => setCurrentView('teams')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={currentView === 'teams' ? '#FFFFFF' : '#007AFF'} 
          />
          <Text style={[styles.viewToggleText, currentView === 'teams' && styles.viewToggleTextActive]}>
            Complete Teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={currentView === 'agents' 
            ? "Search agents by name, role, or skills..."
            : "Search teams by name, description, or capabilities..."
          }
          value={filters.searchTerm}
          onChangeText={(text) => setFilters(prev => ({ ...prev, searchTerm: text }))}
          placeholderTextColor="#8E8E93"
        />
        {filters.searchTerm.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
          >
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count and Actions */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsLeft}>
          <Text style={styles.resultsCount}>
            {currentView === 'agents' 
              ? `${filteredAgents.length} agent${filteredAgents.length !== 1 ? 's' : ''} available`
              : `${filteredTeams.length} team${filteredTeams.length !== 1 ? 's' : ''} available`
            }
          </Text>
          {(filters.category.length > 0 || filters.functions.length > 0 || 
            filters.experience.length > 0 || filters.searchTerm.length > 0) && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Create Agent from Scratch Button */}
        <TouchableOpacity
          style={styles.createAgentButton}
          onPress={() => navigation.navigate('Agents')}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.createAgentButtonText}>Create Agent from Scratch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        {/* Categories */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>
            {currentView === 'agents' ? 'Role Category' : 'Team Category'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChipsContainer}>
              {filterOptions.categories.map(category =>
                renderFilterChip(
                  category,
                  filters.category.includes(category),
                  () => toggleFilter('category', category)
                )
              )}
            </View>
          </ScrollView>
        </View>

        {/* Function Groups */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>
            {currentView === 'agents' ? 'Available Integrations' : 'Team Integrations'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChipsContainer}>
              {filterOptions.functionGroups.map(functionGroup =>
                renderFilterChip(
                  functionGroup,
                  filters.functions.includes(functionGroup),
                  () => toggleFilter('functions', functionGroup)
                )
              )}
            </View>
          </ScrollView>
        </View>

        {/* Experience Levels */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>
            {currentView === 'agents' ? 'Experience Level' : 'Team Size'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChipsContainer}>
              {filterOptions.experienceLevels.map(level =>
                renderFilterChip(
                  level,
                  filters.experience.includes(level),
                  () => toggleFilter('experience', level)
                )
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderAgentGrid = () => {
    const { numColumns, itemWidth, itemGap } = getGridLayout;
    
    // Create rows of agents based on numColumns
    const rows: MarketplaceAgent[][] = [];
    for (let i = 0; i < filteredAgents.length; i += numColumns) {
      rows.push(filteredAgents.slice(i, i + numColumns));
    }
    
    return (
      <View style={styles.agentGrid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map((agent, colIndex) => (
              <View 
                key={agent.id} 
                style={[
                  styles.gridItem,
                  {
                    width: itemWidth,
                    marginRight: colIndex < row.length - 1 ? itemGap : 0,
                  }
                ]}
              >
                <AgentMarketplaceCard
                  agent={agent}
                  onPress={() => handleAgentSelect(agent)}
                  style={{ width: '100%' }}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderTeamGrid = () => {
    const { numColumns, itemWidth, itemGap } = getGridLayout;
    
    // Create rows of teams based on numColumns
    const rows: MarketplaceTeam[][] = [];
    for (let i = 0; i < filteredTeams.length; i += numColumns) {
      rows.push(filteredTeams.slice(i, i + numColumns));
    }
    
    return (
      <View style={styles.agentGrid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map((team, colIndex) => (
              <View 
                key={team.id} 
                style={[
                  styles.gridItem,
                  {
                    width: itemWidth,
                    marginRight: colIndex < row.length - 1 ? itemGap : 0,
                  }
                ]}
              >
                <TeamMarketplaceCard
                  team={team}
                  onPress={() => handleTeamSelect(team)}
                  style={{ width: '100%' }}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer
      enableScrolling={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {renderHeader()}
      {renderFilters()}
      {currentView === 'agents' ? renderAgentGrid() : renderTeamGrid()}

      {/* Agent Resume Modal */}
      <AgentResumeModal
        visible={showResumeModal}
        agent={selectedAgent}
        onClose={() => setShowResumeModal(false)}
        onHire={selectedAgent ? () => handleHireAgent(selectedAgent) : undefined}
      />

      {/* Team Resume Modal */}
      <TeamResumeModal
        visible={showTeamModal}
        team={selectedTeam}
        onClose={() => setShowTeamModal(false)}
        onHire={selectedTeam ? (sharedTeamContext) => handleHireTeam(selectedTeam, sharedTeamContext) : undefined}
      />

      {/* Success Tooltip */}
      <SuccessTooltip
        visible={showSuccessTooltip}
        message={successMessage}
        onHide={() => setShowSuccessTooltip(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewToggleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  clearSearchButton: {
    marginLeft: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultsCount: {
    fontSize: 16,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  createAgentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createAgentButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  agentGrid: {
    padding: 16,
    paddingTop: 12,
    minHeight: 200, // Ensure minimum height for better layout
    overflow: 'hidden', // Prevent horizontal overflow
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
    flexWrap: 'nowrap', // Prevent wrapping to maintain grid structure
    overflow: 'hidden', // Prevent cards from overflowing
  },
  gridItem: {
    flexShrink: 0, // Prevent shrinking to maintain card width
    // marginBottom handled by gridRow marginBottom
  },
});

export default AgentMarketplaceScreen;