import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import {
  navigationItems,
  getAllNavigationItems,
  getVisibleNavigationItems,
  NavigationItem,
  routeToPathMap
} from '../navigation/navigationConfig';

// NavigationItem interface is now imported from navigationConfig

interface ResponsiveNavigationProps {
  isSidebarLayout: boolean;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({ isSidebarLayout }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Agents', 'Configure'])); // Default expanded
  const { isAuthenticated } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const visibleItems = getVisibleNavigationItems(isAuthenticated);

  const styles = useThemedStyles((colors) => ({
    // Mobile Header
    mobileHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.navBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.navBorder,
    },
    hamburgerButton: {
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.bgHover,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    mobileTitle: {
      ...typography.h2,
      color: colors.navItemText,
      flex: 1,
      textAlign: 'center' as const,
    },
    spacer: {
      width: 40,
    },

    // Modal
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.navBorder,
    },
    modalTitle: {
      ...typography.h1,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.bgSurface,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    modalContent: {
      flex: 1,
      paddingTop: spacing.lg,
    },
    modalItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minHeight: touchTarget.min,
    },
    modalItemActive: {
      backgroundColor: colors.navItemActive,
    },
    modalItemText: {
      ...typography.title,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginLeft: spacing.md,
      flex: 1,
    },
    modalItemTextActive: {
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    modalGroupItem: {
      backgroundColor: colors.bgSurface,
    },
    modalGroupItemActiveChild: {
      backgroundColor: colors.bgHover,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },
    modalGroupTextActiveChild: {
      color: colors.accent,
      fontWeight: '600' as const,
    },
    modalSubItem: {
      paddingLeft: spacing.lg,
      backgroundColor: colors.bgCard,
      borderLeftWidth: 3,
      borderLeftColor: colors.borderLight,
    },
    modalSubItemText: {
      fontSize: 15,
      fontWeight: '400' as const,
    },
    subItemIndent: {
      width: 16,
      height: 1,
    },
    modalFooter: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.navBorder,
      backgroundColor: colors.bgCard,
    },

    // Sidebar
    sidebar: {
      width: 280,
      backgroundColor: colors.navBg,
      borderRightWidth: 1,
      borderRightColor: colors.navBorder,
    },
    sidebarHeader: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.navBorder,
    },
    sidebarTitle: {
      ...typography.display,
      color: colors.navItemText,
      marginBottom: spacing.xs,
    },
    sidebarSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    sidebarContent: {
      flex: 1,
      paddingTop: spacing.lg,
    },
    sidebarItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
      borderRadius: radius.md,
      minHeight: touchTarget.min,
    },
    sidebarItemActive: {
      backgroundColor: colors.navItemActive,
    },
    sidebarItemText: {
      fontSize: 15,
      fontWeight: '500' as const,
      color: colors.navItemText,
      marginLeft: spacing.md,
    },
    sidebarItemTextActive: {
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    sidebarGroupItem: {
      backgroundColor: colors.bgSurface,
    },
    sidebarGroupItemActiveChild: {
      backgroundColor: colors.bgHover,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },
    sidebarGroupTextActiveChild: {
      color: colors.accent,
      fontWeight: '600' as const,
    },
    sidebarSubItem: {
      paddingLeft: spacing.xxl,
      marginLeft: spacing.lg,
      backgroundColor: colors.bgCard,
      borderLeftWidth: 2,
      borderLeftColor: colors.borderLight,
    },
    sidebarSubItemText: {
      ...typography.body,
      fontWeight: '400' as const,
    },
    sidebarFooter: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.navBorder,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    themeToggle: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.bgHover,
      gap: spacing.sm,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    themeToggleText: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    sidebarFooterText: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
  }));

  const handleNavigate = (screenName: string) => {
    navigation.navigate(screenName as never);
    setShowMobileMenu(false);

    // Update URL for web
    if (typeof window !== 'undefined' && window.history) {
      const path = routeToPathMap[screenName];
      if (path) {
        window.history.pushState({}, '', path);
      }
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const isCurrentRoute = (routeName: string) => {
    return route.name === routeName;
  };

  // Theme toggle button component
  const ThemeToggleButton = () => (
    <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={16}
        color={colors.textSecondary}
      />
      <Text style={styles.themeToggleText}>
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </Text>
    </TouchableOpacity>
  );

  // Mobile Hamburger Menu
  const renderMobileMenu = () => (
    <>
      {/* Header with Hamburger Button */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setShowMobileMenu(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.mobileTitle}>
          {getAllNavigationItems(visibleItems).find(item => isCurrentRoute(item.name))?.title || 'GoGent'}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* Mobile Menu Modal */}
      <Modal
        visible={showMobileMenu}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMobileMenu(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Navigation</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMobileMenu(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {visibleItems.map((item) => {
              return (
                <View key={item.name}>
                  {/* Parent/Group Item */}
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      isCurrentRoute(item.name) && styles.modalItemActive,
                      item.children && styles.modalGroupItem,
                      item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.modalGroupItemActiveChild
                    ]}
                    onPress={() => {
                      if (item.children) {
                        toggleGroup(item.name);
                      } else {
                        handleNavigate(item.name);
                      }
                    }}
                  >
                    <Ionicons
                      name={isCurrentRoute(item.name) ? item.iconFocused : item.icon}
                      size={24}
                      color={isCurrentRoute(item.name) ? colors.textInverse : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? colors.accent : colors.accent}
                    />
                    <Text style={[
                      styles.modalItemText,
                      isCurrentRoute(item.name) && styles.modalItemTextActive,
                      item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.modalGroupTextActiveChild
                    ]}>
                      {item.title}
                    </Text>
                    {item.children && (
                      <Ionicons
                        name={expandedGroups.has(item.name) ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color={isCurrentRoute(item.name) ? colors.textInverse : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? colors.accent : colors.textSecondary}
                      />
                    )}
                    {isCurrentRoute(item.name) && !item.children && (
                      <Ionicons name="checkmark" size={20} color={colors.textInverse} />
                    )}
                  </TouchableOpacity>

                  {/* Child Items */}
                  {item.children && expandedGroups.has(item.name) && item.children.map((child) => {
                    const isChildCurrent = isCurrentRoute(child.name);
                    return (
                      <TouchableOpacity
                        key={child.name}
                        style={[
                          styles.modalItem,
                          styles.modalSubItem,
                          isChildCurrent && styles.modalItemActive
                        ]}
                        onPress={() => handleNavigate(child.name)}
                      >
                        <View style={styles.subItemIndent} />
                        <Ionicons
                          name={isChildCurrent ? child.iconFocused : child.icon}
                          size={20}
                          color={isChildCurrent ? colors.textInverse : colors.accent}
                        />
                        <Text style={[
                          styles.modalItemText,
                          styles.modalSubItemText,
                          isChildCurrent && styles.modalItemTextActive
                        ]}>
                          {child.title}
                        </Text>
                        {isChildCurrent && (
                          <Ionicons name="checkmark" size={18} color={colors.textInverse} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <ThemeToggleButton />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );

  // Sidebar for larger screens
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>GoGent</Text>
        <Text style={styles.sidebarSubtitle}>AI Multi-Variation Platform</Text>
      </View>

      <ScrollView style={styles.sidebarContent}>
        {visibleItems.map((item) => {
          return (
            <View key={item.name}>
              {/* Parent/Group Item */}
              <TouchableOpacity
                style={[
                  styles.sidebarItem,
                  isCurrentRoute(item.name) && styles.sidebarItemActive,
                  item.children && styles.sidebarGroupItem,
                  item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.sidebarGroupItemActiveChild
                ]}
                onPress={() => {
                  if (item.children) {
                    toggleGroup(item.name);
                  } else {
                    handleNavigate(item.name);
                  }
                }}
              >
                <Ionicons
                  name={isCurrentRoute(item.name) ? item.iconFocused : item.icon}
                  size={20}
                  color={isCurrentRoute(item.name) ? colors.textInverse : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? colors.accent : colors.accent}
                />
                <Text style={[
                  styles.sidebarItemText,
                  isCurrentRoute(item.name) && styles.sidebarItemTextActive,
                  item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.sidebarGroupTextActiveChild
                ]}>
                  {item.title}
                </Text>
                {item.children && (
                  <Ionicons
                    name={expandedGroups.has(item.name) ? "chevron-down" : "chevron-forward"}
                    size={16}
                    color={isCurrentRoute(item.name) ? colors.textInverse : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? colors.accent : colors.textSecondary}
                  />
                )}
              </TouchableOpacity>

              {/* Child Items */}
              {item.children && expandedGroups.has(item.name) && item.children.map((child) => {
                const isChildCurrent = isCurrentRoute(child.name);
                return (
                  <TouchableOpacity
                    key={child.name}
                    style={[
                      styles.sidebarItem,
                      styles.sidebarSubItem,
                      isChildCurrent && styles.sidebarItemActive
                    ]}
                    onPress={() => handleNavigate(child.name)}
                  >
                    <View style={styles.subItemIndent} />
                    <Ionicons
                      name={isChildCurrent ? child.iconFocused : child.icon}
                      size={18}
                      color={isChildCurrent ? colors.textInverse : colors.accent}
                    />
                    <Text style={[
                      styles.sidebarItemText,
                      styles.sidebarSubItemText,
                      isChildCurrent && styles.sidebarItemTextActive
                    ]}>
                      {child.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <ThemeToggleButton />
        <Text style={styles.sidebarFooterText}>GoGent v1.0</Text>
      </View>
    </View>
  );

  return isSidebarLayout ? renderSidebar() : renderMobileMenu();
};
