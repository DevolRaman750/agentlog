import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useToast } from '../context/ToastContext';
import { useThemedStyles } from '../theme';
import type { DocumentationStackParamList } from '../navigation/DocumentationNavigator';

// Import documentation data
import documentationIndex from '../data/documentation/index.json';
import overviewData from '../data/documentation/overview.json';
import teamsData from '../data/documentation/teams.json';
import agentsData from '../data/documentation/agents.json';
import templatesData from '../data/documentation/templates.json';
import executionsData from '../data/documentation/executions.json';
import functionsData from '../data/documentation/functions.json';
import apiKeysData from '../data/documentation/api-keys.json';
import gettingStartedData from '../data/documentation/getting-started.json';

interface DocumentationSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  order: number;
  file: string;
}

interface DocumentationData {
  version: string;
  lastUpdated: string;
  sections: DocumentationSection[];
  metadata: {
    appName: string;
    tagline: string;
    description: string;
  };
}

type DocumentationScreenRouteProp = RouteProp<DocumentationStackParamList, keyof DocumentationStackParamList>;

const DocumentationScreen: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<DocumentationSection | null>(null);
  const [sectionContent, setSectionContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<DocumentationScreenRouteProp>();
  const { showSuccess, showError } = useToast();
  const { width } = Dimensions.get('window');

  const documentation = documentationIndex as DocumentationData;

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    searchButton: {
      padding: 8,
    },
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      marginHorizontal: 16,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    mainContainer: {
      flex: 1,
    },
    welcomeSection: {
      padding: 20,
      backgroundColor: colors.bgCard,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    welcomeDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    sectionGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionCardMargin: {
      marginRight: 16,
    },
    sectionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
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
    sectionFooter: {
      alignItems: 'flex-end' as const,
    },
    footer: {
      padding: 20,
      alignItems: 'center' as const,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    contentContainer: {
      flex: 1,
    },
    contentSection: {
      marginBottom: 24,
    },
    heroSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 18,
      color: colors.accent,
      marginBottom: 16,
    },
    heroContent: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
    },
    highlightsContainer: {
      gap: 16,
    },
    highlightItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    highlightIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgHover,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 12,
    },
    highlightText: {
      flex: 1,
    },
    highlightTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    highlightDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    topologySection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
    },
    sectionHeader: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    sectionContent: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
    },
    conceptsContainer: {
      gap: 20,
    },
    conceptCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: 20,
    },
    conceptIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    conceptContent: {
      flex: 1,
    },
    conceptTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    conceptDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    conceptDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    examplesContainer: {
      marginBottom: 16,
    },
    examplesTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    exampleItem: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 4,
    },
    conceptActions: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
    workflowSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
    },
    stepsContainer: {
      gap: 24,
    },
    stepItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    stepNumber: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 16,
    },
    stepNumberText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    stepDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    stepDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    stepAction: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    stepActionText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.textInverse,
    },
    benefitsSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
    },
    benefitsContainer: {
      gap: 20,
    },
    benefitCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: 20,
    },
    benefitIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    benefitCategory: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    benefitItems: {
      gap: 8,
    },
    benefitItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    benefitItemText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    ctaSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
    },
    ctaTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    ctaSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center' as const,
    },
    ctaContent: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
      textAlign: 'center' as const,
    },
    ctaActions: {
      gap: 16,
    },
    ctaButton: {
      padding: 20,
      borderRadius: 16,
      alignItems: 'center' as const,
    },
    ctaButtonText: {
      fontSize: 18,
      fontWeight: '600' as const,
      marginTop: 8,
      marginBottom: 4,
    },
    ctaButtonDescription: {
      fontSize: 14,
    },
    defaultSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
    },
    overviewSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    featuresSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    featuresContainer: {
      gap: 16,
      marginTop: 16,
    },
    featureCard: {
      backgroundColor: colors.bgSurface,
      padding: 20,
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 16,
    },
    featureTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 6,
      flex: 1,
    },
    featureDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      flex: 1,
    },
    walkthroughSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    walkthroughSteps: {
      gap: 20,
      marginTop: 20,
    },
    walkthroughStep: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    stepIndicator: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 16,
      marginTop: 4,
    },
    stepNumberTextAlt: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    stepDetailsAlt: {
      flex: 1,
    },
    stepSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    stepActionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.bgHover,
      borderRadius: 8,
      alignSelf: 'flex-start' as const,
      marginTop: 8,
    },
    stepActionTextAlt: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '500' as const,
      marginRight: 6,
    },
    useCasesSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    useCasesContainer: {
      gap: 16,
      marginTop: 16,
    },
    useCaseCard: {
      backgroundColor: colors.bgSurface,
      padding: 20,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusSuccess,
    },
    useCaseTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    useCaseDescription: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: 8,
    },
    useCaseExample: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
      marginBottom: 12,
    },
    useCaseSteps: {
      marginTop: 8,
    },
    useCaseStep: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 4,
    },
    bestPracticesSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    practicesContainer: {
      gap: 16,
      marginTop: 16,
    },
    practiceItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: `${colors.statusWarning}15`,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusWarning,
    },
    practiceIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    practiceText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
      flex: 1,
    },
    troubleshootingSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    troubleshootingContainer: {
      gap: 20,
      marginTop: 16,
    },
    troubleshootingItem: {
      backgroundColor: `${colors.statusError}15`,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusError,
    },
    problemHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    problemTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginLeft: 8,
      flex: 1,
    },
    solutionsTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    solutionText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: 4,
    },
    quickStartSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    quickStartSteps: {
      gap: 20,
      marginTop: 20,
    },
    quickStartStep: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: colors.bgHover,
      padding: 20,
      borderRadius: 16,
    },
    quickStartIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.statusSuccess,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 16,
    },
    quickStartNumber: {
      color: colors.textInverse,
      fontSize: 18,
      fontWeight: '700' as const,
    },
    quickStartContent: {
      flex: 1,
    },
    quickStartTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    quickStartDescription: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: 6,
    },
    quickStartDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    quickStartTime: {
      fontSize: 12,
      color: colors.statusSuccess,
      fontWeight: '600' as const,
      marginBottom: 12,
    },
    quickStartButton: {
      backgroundColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: 'flex-start' as const,
    },
    quickStartButtonText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600' as const,
    },
  }));

  // Handle initial section loading from route parameters
  useEffect(() => {
    const sectionId = (route.params as any)?.section;
    if (sectionId && sectionId !== selectedSection?.id) {
      const targetSection = documentation.sections.find(s => s.id === sectionId);
      if (targetSection) {
        loadSectionContent(targetSection);
      }
    }
  }, [route.params]);

  // Filter sections based on search
  const filteredSections = documentation.sections.filter(section =>
    searchQuery === '' ||
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.order - b.order);

  // Create a content map for easy lookup
  const contentMap = {
    'overview': overviewData,
    'teams': teamsData,
    'agents': agentsData,
    'templates': templatesData,
    'executions': executionsData,
    'functions': functionsData,
    'api-keys': apiKeysData,
    'getting-started': gettingStartedData,
  };

  const loadSectionContent = (section: DocumentationSection) => {
    setIsLoading(true);
    try {
      const content = contentMap[section.id as keyof typeof contentMap];
      if (!content) {
        throw new Error(`Content not found for section: ${section.id}`);
      }
      setSectionContent(content);
      setSelectedSection(section);
      showSuccess('Documentation Loaded', `${section.title} documentation loaded successfully`);
    } catch (error) {
      console.error('Failed to load documentation section:', error);
      showError('Load Error', `Failed to load ${section.title} documentation`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (link: string, type: 'navigate' | 'external' = 'navigate') => {
    if (type === 'external') {
      Linking.openURL(link);
    } else if (link.startsWith('/documentation/')) {
      const sectionId = link.replace('/documentation/', '');
      const routeNameMap: Record<string, keyof DocumentationStackParamList> = {
        'overview': 'DocumentationOverview',
        'getting-started': 'DocumentationGettingStarted',
        'agents': 'DocumentationAgents',
        'teams': 'DocumentationTeams',
        'templates': 'DocumentationTemplates',
        'executions': 'DocumentationExecutions',
        'functions': 'DocumentationFunctions',
        'api-keys': 'DocumentationApiKeys',
      };

      const routeName = routeNameMap[sectionId];
      if (routeName) {
        (navigation as any).navigate(routeName);
      } else {
        const targetSection = documentation.sections.find(s => s.id === sectionId);
        if (targetSection) {
          loadSectionContent(targetSection);
        }
      }
    } else {
      try {
        (navigation as any).navigate(link);
      } catch (error) {
        console.warn('Navigation failed:', error);
        showError('Navigation Error', 'Could not navigate to the requested page');
      }
    }
  };

  const renderSectionGrid = () => {
    const isTablet = width > 768;
    const numColumns = isTablet ? 3 : 2;
    const cardWidth = isTablet ? (width - 60) / 3 : (width - 48) / 2;

    return (
      <View style={styles.sectionGrid}>
        {filteredSections.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionCard,
              { width: cardWidth },
              index % numColumns !== numColumns - 1 && styles.sectionCardMargin
            ]}
            onPress={() => loadSectionContent(section)}
            activeOpacity={0.7}
          >
            <View style={[styles.sectionIcon, { backgroundColor: section.color }]}>
              <Ionicons name={section.icon as any} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDescription}>{section.description}</Text>
            <View style={styles.sectionFooter}>
              <Ionicons name="arrow-forward" size={16} color={section.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (!sectionContent) return null;

    return (
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {sectionContent.sections?.map((section: any) => (
          <View key={section.id} style={styles.contentSection}>
            {renderContentSection(section)}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderContentSection = (section: any) => {
    switch (section.type) {
      case 'hero':
        return renderHeroSection(section);
      case 'overview':
        return renderOverviewSection(section);
      case 'topology':
        return renderTopologySection(section);
      case 'workflow':
        return renderWorkflowSection(section);
      case 'benefits':
        return renderBenefitsSection(section);
      case 'features':
        return renderFeaturesSection(section);
      case 'walkthrough':
        return renderWalkthroughSection(section);
      case 'usecases':
      case 'examples':
        return renderUseCasesSection(section);
      case 'bestpractices':
        return renderBestPracticesSection(section);
      case 'troubleshooting':
        return renderTroubleshootingSection(section);
      case 'quickstart':
        return renderQuickStartSection(section);
      case 'cta':
        return renderCTASection(section);
      default:
        return renderDefaultSection(section);
    }
  };

  const renderHeroSection = (section: any) => (
    <View style={styles.heroSection}>
      <Text style={styles.heroTitle}>{section.title}</Text>
      <Text style={styles.heroSubtitle}>{section.subtitle}</Text>
      <Text style={styles.heroContent}>{section.content}</Text>

      {section.highlights && (
        <View style={styles.highlightsContainer}>
          {section.highlights.map((highlight: any, index: number) => (
            <View key={index} style={styles.highlightItem}>
              <View style={styles.highlightIcon}>
                <Ionicons name={highlight.icon} size={20} color={styles.heroSubtitle.color} />
              </View>
              <View style={styles.highlightText}>
                <Text style={styles.highlightTitle}>{highlight.title}</Text>
                <Text style={styles.highlightDescription}>{highlight.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderTopologySection = (section: any) => (
    <View style={styles.topologySection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>

      <View style={styles.conceptsContainer}>
        {section.concepts?.map((concept: any) => (
          <TouchableOpacity
            key={concept.id}
            style={styles.conceptCard}
            onPress={() => {
              if (concept.actions && concept.actions.length > 0) {
                handleNavigation(concept.actions[0].link, concept.actions[0].type);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.conceptIcon, { backgroundColor: concept.color }]}>
              <Ionicons name={concept.icon} size={28} color="#FFFFFF" />
            </View>

            <View style={styles.conceptContent}>
              <Text style={styles.conceptTitle}>{concept.title}</Text>
              <Text style={styles.conceptDescription}>{concept.description}</Text>
              <Text style={styles.conceptDetails}>{concept.details}</Text>

              {concept.examples && (
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>Examples:</Text>
                  {concept.examples.map((example: string, index: number) => (
                    <Text key={index} style={styles.exampleItem}>• {example}</Text>
                  ))}
                </View>
              )}

              {concept.actions && (
                <View style={styles.conceptActions}>
                  {concept.actions.map((action: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.actionButton, { borderColor: concept.color }]}
                      onPress={() => handleNavigation(action.link, action.type)}
                    >
                      <Text style={[styles.actionButtonText, { color: concept.color }]}>
                        {action.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWorkflowSection = (section: any) => (
    <View style={styles.workflowSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>

      <View style={styles.stepsContainer}>
        {section.steps?.map((step: any, index: number) => (
          <View key={index} style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
              <Text style={styles.stepNumberText}>{step.number}</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
              <Text style={styles.stepDetails}>{step.details}</Text>

              {step.action && (
                <TouchableOpacity
                  style={[styles.stepAction, { backgroundColor: step.color }]}
                  onPress={() => handleNavigation(step.action.link, step.action.type)}
                >
                  <Text style={styles.stepActionText}>{step.action.title}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderBenefitsSection = (section: any) => (
    <View style={styles.benefitsSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>

      <View style={styles.benefitsContainer}>
        {section.benefits?.map((benefit: any, index: number) => (
          <View key={index} style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: benefit.color }]}>
              <Ionicons name={benefit.icon} size={24} color="#FFFFFF" />
            </View>

            <Text style={styles.benefitCategory}>{benefit.category}</Text>

            <View style={styles.benefitItems}>
              {benefit.items.map((item: string, itemIndex: number) => (
                <View key={itemIndex} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={benefit.color} />
                  <Text style={styles.benefitItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCTASection = (section: any) => (
    <View style={styles.ctaSection}>
      <Text style={styles.ctaTitle}>{section.title}</Text>
      <Text style={styles.ctaSubtitle}>{section.subtitle}</Text>
      <Text style={styles.ctaContent}>{section.content}</Text>

      <View style={styles.ctaActions}>
        {section.actions?.map((action: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.ctaButton,
              action.primary ? { backgroundColor: action.color } : { borderColor: action.color, borderWidth: 2 }
            ]}
            onPress={() => handleNavigation(action.link, action.type)}
          >
            <Ionicons
              name={action.icon}
              size={20}
              color={action.primary ? "#FFFFFF" : action.color}
            />
            <Text style={[
              styles.ctaButtonText,
              action.primary ? { color: "#FFFFFF" } : { color: action.color }
            ]}>
              {action.title}
            </Text>
            <Text style={[
              styles.ctaButtonDescription,
              action.primary ? { color: "#FFFFFF" } : { color: action.color }
            ]}>
              {action.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOverviewSection = (section: any) => (
    <View style={styles.overviewSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>
    </View>
  );

  const renderFeaturesSection = (section: any) => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <View style={styles.featuresContainer}>
        {section.items?.map((feature: any, index: number) => (
          <View key={index} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: styles.heroSubtitle.color }]}>
              <Ionicons name={feature.icon} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderWalkthroughSection = (section: any) => (
    <View style={styles.walkthroughSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      {section.subtitle && <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>}

      <View style={styles.walkthroughSteps}>
        {section.steps?.map((step: any, index: number) => (
          <View key={index} style={styles.walkthroughStep}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
            <View style={styles.stepDetails}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
              {step.details && <Text style={styles.stepSubtext}>{step.details}</Text>}
              {step.action && (
                <TouchableOpacity
                  style={styles.stepActionButton}
                  onPress={() => handleNavigation(step.action.path, step.action.type)}
                >
                  <Text style={styles.stepActionText}>{step.action.label}</Text>
                  <Ionicons name="arrow-forward" size={16} color={styles.heroSubtitle.color} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUseCasesSection = (section: any) => (
    <View style={styles.useCasesSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>

      <View style={styles.useCasesContainer}>
        {(section.cases || section.items)?.map((useCase: any, index: number) => (
          <View key={index} style={styles.useCaseCard}>
            <Text style={styles.useCaseTitle}>{useCase.title}</Text>
            <Text style={styles.useCaseDescription}>{useCase.description}</Text>
            {useCase.example && <Text style={styles.useCaseExample}>Example: {useCase.example}</Text>}
            {useCase.steps && (
              <View style={styles.useCaseSteps}>
                {useCase.steps.map((step: string, stepIndex: number) => (
                  <Text key={stepIndex} style={styles.useCaseStep}>• {step}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderBestPracticesSection = (section: any) => (
    <View style={styles.bestPracticesSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>

      <View style={styles.practicesContainer}>
        {section.tips?.map((tip: string, index: number) => (
          <View key={index} style={styles.practiceItem}>
            <View style={styles.practiceIcon}>
              <Ionicons name="bulb" size={20} color={styles.practiceItem.borderLeftColor} />
            </View>
            <Text style={styles.practiceText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTroubleshootingSection = (section: any) => (
    <View style={styles.troubleshootingSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>

      <View style={styles.troubleshootingContainer}>
        {section.problems?.map((problem: any, index: number) => (
          <View key={index} style={styles.troubleshootingItem}>
            <View style={styles.problemHeader}>
              <Ionicons name="warning" size={20} color={styles.troubleshootingItem.borderLeftColor} />
              <Text style={styles.problemTitle}>{problem.issue}</Text>
            </View>
            <Text style={styles.solutionsTitle}>Solutions:</Text>
            {problem.solutions.map((solution: string, solIndex: number) => (
              <Text key={solIndex} style={styles.solutionText}>• {solution}</Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );

  const renderQuickStartSection = (section: any) => (
    <View style={styles.quickStartSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>

      <View style={styles.quickStartSteps}>
        {section.steps?.map((step: any, index: number) => (
          <View key={index} style={styles.quickStartStep}>
            <View style={styles.quickStartIcon}>
              <Text style={styles.quickStartNumber}>{index + 1}</Text>
            </View>
            <View style={styles.quickStartContent}>
              <Text style={styles.quickStartTitle}>{step.title}</Text>
              <Text style={styles.quickStartDescription}>{step.description}</Text>
              {step.details && <Text style={styles.quickStartDetails}>{step.details}</Text>}
              {step.time && <Text style={styles.quickStartTime}>⏱️ {step.time}</Text>}
              {step.action && (
                <TouchableOpacity
                  style={styles.quickStartButton}
                  onPress={() => handleNavigation(step.action.path, step.action.type)}
                >
                  <Text style={styles.quickStartButtonText}>{step.action.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDefaultSection = (section: any) => (
    <View style={styles.defaultSection}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      {section.subtitle && <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>}
      {section.content && <Text style={styles.sectionContent}>{section.content}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectedSection ? (
          <>
            <TouchableOpacity
              onPress={() => {
                setSelectedSection(null);
                setSectionContent(null);
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={styles.heroSubtitle.color} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedSection.title}</Text>
          </>
        ) : (
          <>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Documentation</Text>
              <Text style={styles.headerSubtitle}>{documentation.metadata.tagline}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={styles.searchButton}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={24} color={styles.heroSubtitle.color} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Search Bar */}
      {showSearch && !selectedSection && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={styles.loadingText.color} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documentation..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading documentation...</Text>
        </View>
      ) : selectedSection ? (
        renderContent()
      ) : (
        <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>{documentation.metadata.appName}</Text>
            <Text style={styles.welcomeDescription}>{documentation.metadata.description}</Text>
          </View>

          {/* Sections Grid */}
          {renderSectionGrid()}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Documentation v{documentation.version} • Updated {documentation.lastUpdated}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default DocumentationScreen;
