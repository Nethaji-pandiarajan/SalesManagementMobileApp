import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import CONFIG from '../config/config';

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    const emailVal = email.trim();
    if (!emailVal) {
      newErrors.email = 'Email or username is required';
      valid = false;
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
      const isUsername = /^[a-zA-Z0-9_]+$/.test(emailVal);
      if (!isEmail && !isUsername) {
        newErrors.email = 'Enter a valid email address or username';
        valid = false;
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const emailValue = email.trim().toLowerCase();
      const backendUrl = CONFIG.API_BASE_URL;

      console.log('🚀 Sending login to:', `${backendUrl}/login`);
      console.log('📧 Email:', emailValue);

      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password }),
      });

      const data = await response.json();
      console.log('📦 Response:', JSON.stringify(data));

      if (response.ok) {
        // Calling login() saves the token and updates global auth state.
        // App.tsx automatically switches to AppStack — no navigation.reset needed.
        await login(data.token, data.user);
      } else {
        setErrors(prev => ({ ...prev, password: data.error || 'Invalid credentials' }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors(prev => ({ ...prev, email: 'Network error. Make sure the server is running.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Main Logo Container */}
          <View style={styles.logoHeroContainer}>
            <Image
              source={require('../assets/logo_final.png')}
              style={styles.logoHero}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.salesManagementTitle}>Sales Management</Text>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <View style={styles.signUpRow}>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or 'admin'"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>⚠ {errors.email}</Text> : null}

            {/* Password Input */}
            <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
              />
            </View>
            {errors.password ? <Text style={styles.errorText}>⚠ {errors.password}</Text> : null}

            {/* Sign In Button with Loading */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.signInButtonText}>Sign In</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>Or sign in with</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIconBlue}>f</Text>
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  logoHeroContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoHero: {
    width: 120,
    height: 120,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  salesManagementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#087E66',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 20,
    marginBottom: 4,
    height: 50,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 10,
    marginLeft: 4,
  },
  signInButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    height: 50,
    marginTop: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  signInButtonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: '#087E66',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 11,
    color: '#94A3B8',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    height: 50,
    gap: 8,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EA4335',
  },
  socialIconBlue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1877F2',
  },
  socialText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
});

export default LoginScreen;
