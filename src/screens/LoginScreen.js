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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from '../components/CustomButton';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email.trim().toLowerCase() === 'user') {
      navigation.navigate('Dashboard', { username: email.trim() });
    } else {
      alert('Invalid Username. Please use "user" to sign in.');
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
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                showSoftInputOnFocus={true}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <CustomButton
              title="Sign in"
              onPress={handleLogin}
              style={styles.signInButton}
              textStyle={styles.signInButtonText}
            />

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
  signUpText: {
    fontSize: 13,
    color: '#64748B',
  },
  signUpLink: {
    fontSize: 13,
    color: '#087E66',
    fontWeight: '700',
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
    marginBottom: 10,
    height: 50,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: -5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0, // Let flex and height handle centering
  },
  signInButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    height: 50,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
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
