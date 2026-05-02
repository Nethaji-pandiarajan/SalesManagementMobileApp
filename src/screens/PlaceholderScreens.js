import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PlaceholderScreen = ({ title }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Coming Soon...</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 10 },
});

export const SalesScreen = () => <PlaceholderScreen title="Sales" />;
export const ProductManagementScreen = () => <PlaceholderScreen title="Product Management" />;
export const UserManagementScreen = () => <PlaceholderScreen title="User Management" />;
export const SupplyManagementScreen = () => <PlaceholderScreen title="Supply Management" />;
export const AdminSalesReportsScreen = () => <PlaceholderScreen title="Sales Reports" />;
export const AdminEODScreen = () => <PlaceholderScreen title="EOD Reconciliation" />;
