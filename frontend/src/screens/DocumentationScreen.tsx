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
import { useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerTitle: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 2,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.md,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    searchButton: {
      padding: spacing.sm,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    searchIcon: {
      marginRight: spacing.md,
    },
    searchInput: {
      flex: 1,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    loadingText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    mainContainer: {
      flex: 1,
    },
    welcomeSection: {
      padding: spacing.md,
      backgroundColor: colors.bgCard,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    welcomeTitle: {
      ...typography.display,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    welcomeDescription: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    sectionGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    sectionCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionCardMargin: {
      marginRight: spacing.lg,
    },
    sectionIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sectionDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    sectionFooter: {
      alignItems: 'flex-end' as const,
    },
    footer: {
      padding: spacing.lg,
      alignItems: 'center' as const,
    },
    footerText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    contentContainer: {
      flex: 1,
    },
    contentSection: {
      marginBottom: spacing.xl,
    },
    heroSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    heroTitle: {
      ...typography.display,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    heroSubtitle: {
      ...typography.h2,
      fontWeight: '400' as const,
      color: colors.accent,
      marginBottom: spacing.lg,
    },
    heroContent: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
    highlightsContainer: {
      gap: spacing.lg,
    },
    highlightItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    highlightIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.bgHover,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.md,
    },
    highlightText: {
      flex: 1,
    },
    highlightTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    highlightDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    topologySection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionHeader: {
      ...typography.h1,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sectionSubtitle: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    sectionContent: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
    conceptsContainer: {
      gap: spacing.lg,
    },
    conceptCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing.md,
    },
    conceptIcon: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    conceptContent: {
      flex: 1,
    },
    conceptTitle: {
      ...typography.h1,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    conceptDescription: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    conceptDetails: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    examplesContainer: {
      marginBottom: spacing.lg,
    },
    examplesTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    exampleItem: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.xs,
    },
    conceptActions: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    actionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    actionButtonText: {
      ...typography.label,
    },
    workflowSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    stepsContainer: {
      gap: spacing.xl,
    },
    stepItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    stepNumber: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.lg,
    },
    stepNumberText: {
      ...typography.title,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    stepDescription: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    stepDetails: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    stepAction: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    stepActionText: {
      ...typography.label,
      color: colors.textInverse,
    },
    benefitsSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    benefitsContainer: {
      gap: spacing.lg,
    },
    benefitCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing.md,
    },
    benefitIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    benefitCategory: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    benefitItems: {
      gap: spacing.sm,
    },
    benefitItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    benefitItemText: {
      ...typography.body,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
    },
    ctaSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    ctaTitle: {
      ...typography.h1,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center' as const,
    },
    ctaSubtitle: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: 'center' as const,
    },
    ctaContent: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.xl,
      textAlign: 'center' as const,
    },
    ctaActions: {
      gap: spacing.lg,
    },
    ctaButton: {
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center' as const,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    ctaButtonText: {
      ...typography.h2,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    ctaButtonDescription: {
      ...typography.body,
    },
    defaultSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    overviewSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    featuresSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    featuresContainer: {
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    featureCard: {
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.lg,
    },
    featureTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      flex: 1,
    },
    featureDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      flex: 1,
    },
    walkthroughSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    walkthroughSteps: {
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    walkthroughStep: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    stepIndicator: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.lg,
      marginTop: spacing.xs,
    },
    stepNumberTextAlt: {
      ...typography.title,
      color: colors.textInverse,
    },
    stepDetailsAlt: {
      flex: 1,
    },
    stepSubtext: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    stepActionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgHover,
      borderRadius: radius.md,
      alignSelf: 'flex-start' as const,
      marginTop: spacing.sm,
      minHeight: touchTarget.min,
    },
    stepActionTextAlt: {
      ...typography.label,
      color: colors.accent,
      marginRight: spacing.xs,
    },
    useCasesSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    useCasesContainer: {
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    useCaseCard: {
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusSuccess,
    },
    useCaseTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    useCaseDescription: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: spacing.sm,
    },
    useCaseExample: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
      marginBottom: spacing.md,
    },
    useCaseSteps: {
      marginTop: spacing.sm,
    },
    useCaseStep: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.xs,
    },
    bestPracticesSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    practicesContainer: {
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    practiceItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: `${colors.statusWarning}15`,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusWarning,
    },
    practiceIcon: {
      marginRight: spacing.md,
      marginTop: 2,
    },
    practiceText: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 20,
      flex: 1,
    },
    troubleshootingSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    troubleshootingContainer: {
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    troubleshootingItem: {
      backgroundColor: `${colors.statusError}15`,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusError,
    },
    problemHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    problemTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
      flex: 1,
    },
    solutionsTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    solutionText: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: spacing.xs,
    },
    quickStartSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    quickStartSteps: {
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    quickStartStep: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: colors.bgHover,
      padding: spacing.md,
      borderRadius: radius.lg,
    },
    quickStartIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.statusSuccess,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.lg,
    },
    quickStartNumber: {
      ...typography.h2,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    quickStartContent: {
      flex: 1,
    },
    quickStartTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    quickStartDescription: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: spacing.xs,
    },
    quickStartDetails: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.sm,
    },
    quickStartTime: {
      ...typography.caption,
      color: colors.statusSuccess,
      fontWeight: '600' as const,
      marginBottom: spacing.md,
    },
    quickStartButton: {
      backgroundColor: colors.accent,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      alignSelf: 'flex-start' as const,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    quickStartButtonText: {
      ...typography.label,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    inverse: {
      color: colors.textInverse,
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
              <Ionicons name={section.icon as any} size={24} color={styles.inverse.color} />
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
              <Ionicons name={concept.icon} size={28} color={styles.inverse.color} />
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
              <Ionicons name={benefit.icon} size={24} color={styles.inverse.color} />
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
              color={action.primary ? styles.inverse.color : action.color}
            />
            <Text style={[
              styles.ctaButtonText,
              action.primary ? { color: styles.inverse.color } : { color: action.color }
            ]}>
              {action.title}
            </Text>
            <Text style={[
              styles.ctaButtonDescription,
              action.primary ? { color: styles.inverse.color } : { color: action.color }
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
              <Ionicons name={feature.icon} size={24} color={styles.inverse.color} />
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
