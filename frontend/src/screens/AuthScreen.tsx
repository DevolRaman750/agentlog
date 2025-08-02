import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { AlertAPI } from '../components/CustomAlert';
import { webInputStyles } from '../styles/containers';

type AuthFlow = 'welcome' | 'account-info' | 'connect-email' | 'change-password' | 'login' | 'register';

const AuthScreen: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    login, 
    register, 
    logout,
    createTemporaryUser,
    connectTemporaryToEmail,
    changePassword,
    clearAllData
  } = useAuth();

  const [currentFlow, setCurrentFlow] = useState<AuthFlow>('welcome');
  const [tempPassword, setTempPassword] = useState<string>('');
  const [linkTempAccount, setLinkTempAccount] = useState<boolean>(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    // Load temporary password if it exists
    const loadTempPassword = async () => {
      try {
        const tempPass = await AsyncStorage.getItem('temp_password');
        if (tempPass) {
          setTempPassword(tempPass);
        }
      } catch (error) {
        console.warn('Could not retrieve temp password:', error);
      }
    };

    loadTempPassword();

    // If user is already authenticated, show account info
    if (user && isAuthenticated) {
      setCurrentFlow('account-info');
    }
  }, [user, isAuthenticated]);

  const handleCreateTemporaryUser = async () => {
    try {
      await createTemporaryUser();
      
      // Get the temporary password after creation
      const tempPass = await AsyncStorage.getItem('temp_password');
      if (tempPass) {
        setTempPassword(tempPass);
      }
    } catch (error) {
      console.error('Failed to create temporary user:', error);
      AlertAPI.alert('Error', `Failed to create temporary account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleConnectToEmail = async () => {
    if (!email || !newPassword || !confirmPassword) {
      AlertAPI.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      AlertAPI.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      AlertAPI.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await connectTemporaryToEmail(email, newPassword);
      AlertAPI.alert(
        '✅ Account Connected!',
        `Your temporary account has been connected to ${email}.\n\nYou can now login using:\n• Email: ${email}\n• Password: Your new password\n\nYour data is now permanently saved!`,
        [{ text: 'Great!', onPress: () => setCurrentFlow('account-info') }]
      );
      
      // Clear form
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Enhanced detection for email already exists scenarios
      console.log('Connect email error details:', { error, errorMessage });
      
      const isEmailExistsError = errorMessage.toLowerCase().includes('email already exists') || 
                                errorMessage.toLowerCase().includes('already registered') ||
                                errorMessage.toLowerCase().includes('email is already in use') ||
                                errorMessage.toLowerCase().includes('status code 400') ||
                                errorMessage.toLowerCase().includes('email already taken') ||
                                errorMessage.toLowerCase().includes('user already exists') ||
                                errorMessage.toLowerCase().includes('bad request') ||
                                (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exists'));
      
      if (isEmailExistsError) {
        AlertAPI.alert(
          '📧 Email Already Registered',
          `The email "${email}" is already registered with an existing account.\n\nWould you like to sign in with this email instead? Your temporary data will be preserved.`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Sign In', 
              onPress: () => {
                // Use setTimeout to ensure the alert closes before state updates
                setTimeout(() => {
                  // Pre-fill the email in login form and switch to login
                  setUsername(email); // Use email as username
                  setPassword(''); // Clear password for user to enter
                  setCurrentFlow('login');
                }, 100);
              }
            }
          ]
        );
      } else {
        // Show generic error for other cases
        AlertAPI.alert('Error', errorMessage);
      }
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      AlertAPI.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      AlertAPI.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      AlertAPI.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      AlertAPI.alert(
        '✅ Password Changed!',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => setCurrentFlow('account-info') }]
      );
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      AlertAPI.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      AlertAPI.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(username, password);
      setCurrentFlow('account-info');
    } catch (error) {
      AlertAPI.alert('Login Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      AlertAPI.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      AlertAPI.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      AlertAPI.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      if (linkTempAccount && tempPassword) {
        // Link existing temporary account to email
        await connectTemporaryToEmail(email, password);
        AlertAPI.alert('Success', 'Your temporary account has been linked to your email!');
      } else {
        // Create new account
        await register(username, email, password);
      }
      setCurrentFlow('account-info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Enhanced detection for email already exists scenarios (for both linking and registration)
      console.log('Register/Link error details:', { error, errorMessage, linkTempAccount });
      
      const isEmailExistsError = errorMessage.toLowerCase().includes('email already exists') || 
                                errorMessage.toLowerCase().includes('already registered') ||
                                errorMessage.toLowerCase().includes('email is already in use') ||
                                errorMessage.toLowerCase().includes('status code 400') ||
                                errorMessage.toLowerCase().includes('email already taken') ||
                                errorMessage.toLowerCase().includes('user already exists') ||
                                errorMessage.toLowerCase().includes('bad request') ||
                                (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exists'));
      
      if (isEmailExistsError) {
        AlertAPI.alert(
          '📧 Email Already Registered',
          `The email "${email}" is already registered with an existing account.\n\nWould you like to sign in with this email instead?${linkTempAccount ? ' Your temporary data will be preserved.' : ''}`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Sign In', 
              onPress: () => {
                // Use setTimeout to ensure the alert closes before state updates
                setTimeout(() => {
                  // Pre-fill the email in login form and switch to login
                  setUsername(email); // Use email as username
                  setPassword(''); // Clear password for user to enter
                  setCurrentFlow('login');
                }, 100);
              }
            }
          ]
        );
      } else {
        // Show generic error for other cases
        AlertAPI.alert(linkTempAccount ? 'Account Linking Failed' : 'Registration Failed', errorMessage);
      }
    }
  };

  const renderAccountInfo = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={user?.is_temporary ? "time-outline" : "person-circle"} 
          size={60} 
          color={user?.is_temporary ? "#FF9500" : "#34C759"} 
        />
        <Text style={styles.headerTitle}>
          {user?.is_temporary ? "Temporary Account" : "Your Account"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {user?.username || "Unknown User"}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: user?.is_temporary ? "#FF9500" : "#34C759" }]}>
            {user?.is_temporary ? "Temporary (Data not permanently saved)" : "Connected Account"}
          </Text>
        </View>
        
        {user?.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        )}
        
        {user?.is_temporary && tempPassword && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Temp Password:</Text>
            <Text style={[styles.infoValue, styles.passwordText]}>{tempPassword}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsSection}>
        {user?.is_temporary ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => setCurrentFlow('connect-email')}
            >
              <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Connect to Email</Text>
            </TouchableOpacity>
            
            <Text style={styles.helpText}>
              💡 Connect your account to an email to save your data permanently and login from any device.
            </Text>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setCurrentFlow('change-password')}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Change Password</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={() => {
            AlertAPI.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: async () => {
                  await logout();
                  setCurrentFlow('welcome');
                }}
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.linkButton]}
          onPress={() => setCurrentFlow(user?.is_temporary ? 'login' : 'register')}
        >
          <Text style={styles.linkButtonText}>
            {user?.is_temporary ? 'Already have an account? Login' : 'Create Another Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnectEmail = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentFlow('account-info')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect to Email</Text>
        <Text style={styles.headerSubtitle}>
          Save your account permanently
        </Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Choose a new password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleConnectToEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Connect Account</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          ✨ After connecting, you'll be able to login with your email and new password from any device.
        </Text>
      </View>
    </View>
  );

  const renderChangePassword = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentFlow('account-info')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <Text style={styles.headerSubtitle}>
          Update your account password
        </Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Update Password</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLogin = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentFlow(user ? 'account-info' : 'welcome')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Login</Text>
        <Text style={styles.headerSubtitle}>
          Sign in with your email and password
        </Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Login</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          💡 Use the email address you connected to your account and the password you set when linking.
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.linkButton]}
          onPress={() => setCurrentFlow('register')}
        >
          <Text style={styles.linkButtonText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRegister = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentFlow(user ? 'account-info' : 'welcome')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>
          Register a new account
        </Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Choose a password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
          />
        </View>

        {/* Check if there's an existing temp account to link */}
        {tempPassword && (
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setLinkTempAccount(!linkTempAccount)}
          >
            <Ionicons 
              name={linkTempAccount ? "checkbox" : "square-outline"} 
              size={24} 
              color="#007AFF" 
            />
            <Text style={styles.checkboxLabel}>
              Link this account to my existing temporary account
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.linkButton]}
          onPress={() => setCurrentFlow('login')}
        >
          <Text style={styles.linkButtonText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="rocket" size={60} color="#007AFF" />
        <Text style={styles.headerTitle}>Welcome to GoGent</Text>
        <Text style={styles.headerSubtitle}>
          Choose how you'd like to get started
        </Text>
        
        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Debug: Auth={isAuthenticated ? 'Yes' : 'No'}, User={user?.username || 'None'}, Loading={loading ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <View style={styles.formSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => {
            handleCreateTemporaryUser();
            setCurrentFlow('account-info');
          }}
        >
          <Ionicons name="flash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Continue with Temporary Account</Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>
          🚀 Get started immediately with a temporary account. You can link it to an email later.
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setCurrentFlow('login')}
        >
          <Ionicons name="log-in-outline" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Login to Existing Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setCurrentFlow('register')}
        >
          <Ionicons name="person-add-outline" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Create New Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          💡 Temporary accounts are perfect for trying out the app without commitment.
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.linkButton]}
          onPress={async () => {
            await clearAllData();
            AlertAPI.alert('Reset Complete', 'All stored data has been cleared.');
          }}
        >
          <Text style={styles.linkButtonText}>🧹 Start Fresh (Clear All Data)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentFlow = () => {
    switch (currentFlow) {
      case 'welcome':
        return renderWelcome();
      case 'connect-email':
        return renderConnectEmail();
      case 'change-password':
        return renderChangePassword();
      case 'login':
        return renderLogin();
      case 'register':
        return renderRegister();
      default:
        return renderAccountInfo();
    }
  };

  return (
    <ScrollView 
      style={styles.scrollContainer} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {renderCurrentFlow()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 2,
    textAlign: 'right',
  },
  passwordText: {
    fontFamily: 'monospace',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionsSection: {
    gap: 16,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...webInputStyles,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  logoutButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  linkButton: {
    backgroundColor: 'transparent',
    padding: 12,
  },
  linkButtonText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  debugInfo: {
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export default AuthScreen; 