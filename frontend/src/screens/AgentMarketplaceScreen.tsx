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
import AgentResumeModal from '../components/AgentResumeModal';
import { useResponsive } from '../context/ResponsiveContext';
import { MarketplaceAgent, FunctionDefinition } from '../types/marketplace';
import { generateMarketplaceAgents } from '../data/marketplaceAgents';

// Remove static width, use screenWidth from useResponsive instead

interface FilterState {
  category: string[];
  functions: string[];
  experience: string[];
  searchTerm: string;
}

const AgentMarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { screenWidth, isSidebarLayout } = useResponsive();
  
  const [agents] = useState<MarketplaceAgent[]>(generateMarketplaceAgents());
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    functions: [],
    experience: [],
    searchTerm: '',
  });

  // Get unique filter options from agents
  const filterOptions = useMemo(() => {
    const categories = [...new Set(agents.map(agent => agent.category))];
    const functionGroups = [...new Set(
      agents.flatMap(agent => agent.capabilities.functionGroups)
    )];
    const experienceLevels = [...new Set(agents.map(agent => agent.experienceLevel))];
    
    return { categories, functionGroups, experienceLevels };
  }, [agents]);

  // Filter agents based on current filters
  const filteredAgents = useMemo(() => {
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
  }, [agents, filters]);

  const handleAgentSelect = (agent: MarketplaceAgent) => {
    setSelectedAgent(agent);
    setShowResumeModal(true);
  };

  const handleHireAgent = (agent: MarketplaceAgent) => {
    // Navigate to create agent form with comprehensive pre-filled data
    const nameParts = agent.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
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
    
    navigation.navigate('Agents', {
      prefilledAgent: {
        // Basic Info
        firstName,
        lastName,
        templateId: agent.templateId,
        
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
    setShowResumeModal(false);
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
            Find the perfect AI agent for your team
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search agents by name, role, or skills..."
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
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} available
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
          <Text style={styles.filterSectionTitle}>Role Category</Text>
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
          <Text style={styles.filterSectionTitle}>Available Integrations</Text>
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
          <Text style={styles.filterSectionTitle}>Experience Level</Text>
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

  return (
    <ScreenContainer
      enableScrolling={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {renderHeader()}
      {renderFilters()}
      {renderAgentGrid()}

      {/* Agent Resume Modal */}
      <AgentResumeModal
        visible={showResumeModal}
        agent={selectedAgent}
        onClose={() => setShowResumeModal(false)}
        onHire={selectedAgent ? () => handleHireAgent(selectedAgent) : undefined}
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