import React from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';

LogBox.ignoreAllLogs();
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ShopsScreen from './src/screens/ShopsScreen';
import BillingScreen from './src/screens/BillingScreen';
import AddShopScreen from './src/screens/AddShopScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ReconciliationScreen from './src/screens/ReconciliationScreen';
import {
  SalesScreen,
} from './src/screens/PlaceholderScreens';
import UserListScreen from './src/screens/UserListScreen';
import AddUserScreen from './src/screens/AddUserScreen';
import SupplyManagementScreen from './src/screens/SupplyManagementScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminVehicleListScreen from './src/screens/admin/AdminVehicleListScreen';
import VehicleListScreen from './src/screens/VehicleListScreen';
import AddVehicleScreen from './src/screens/AddVehicleScreen';
import CategoryListScreen from './src/screens/CategoryListScreen';
import AddCategoryScreen from './src/screens/AddCategoryScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import UserSalesAudit from './src/screens/UserSalesAudit';
import PreorderScreen from './src/screens/PreorderScreen';
import PreorderDetailScreen from './src/screens/PreorderDetailScreen';
import ShopManagementScreen from './src/screens/admin/ShopManagementScreen';
import AreaManagementScreen from './src/screens/admin/AreaManagementScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { isLoggedIn, isLoading, userData } = useAuth();

  const isAdmin = userData?.role === 'admin' || userData?.role_id === 1 || userData?.role_id === 3 || userData?.role_name?.toLowerCase() === 'admin';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#087E66" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isLoggedIn ? (
          // === APP SCREENS (back button stays within app, never reaches Login) ===
          <>
            {isAdmin ? (
              <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            ) : (
              <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                initialParams={{ username: userData?.email?.split('@')[0] || 'User' }}
              />
            )}
            <Stack.Screen name="AdminVehicleList" component={AdminVehicleListScreen} />
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="Shops" component={ShopsScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
            <Stack.Screen name="AddShop" component={AddShopScreen} />
            <Stack.Screen name="Sales" component={SalesScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Reconciliation" component={ReconciliationScreen} />
            <Stack.Screen name="UserSalesAudit" component={UserSalesAudit} />
            <Stack.Screen name="Preorder" component={PreorderScreen} />
            <Stack.Screen name="PreorderDetail" component={PreorderDetailScreen} />
            <Stack.Screen name="Vehicles" component={VehicleListScreen} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            {/* Product Management Screens */}
            <Stack.Screen name="ProductManagement" component={CategoryListScreen} />
            <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />

            {/* Admin Specific Routes */}
            <Stack.Screen name="UserManagement" component={UserListScreen} />
            <Stack.Screen name="AddUser" component={AddUserScreen} initialParams={{ user: null }} />
            <Stack.Screen name="SupplyManagement" component={SupplyManagementScreen} />
            <Stack.Screen name="ShopManagement" component={ShopManagementScreen} />
            <Stack.Screen name="AreaManagement" component={AreaManagementScreen} />
            <Stack.Screen name="AdminSalesReports" component={ReportsScreen} />
            <Stack.Screen name="AdminEOD" component={ReconciliationScreen} />
          </>
        ) : (
          // === AUTH SCREENS (Login only) ===
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default App;
