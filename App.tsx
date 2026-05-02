import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ShopsScreen from './src/screens/ShopsScreen';
import BillingScreen from './src/screens/BillingScreen';
import AddShopScreen from './src/screens/AddShopScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ReconciliationScreen from './src/screens/ReconciliationScreen';
import { SalesScreen } from './src/screens/PlaceholderScreens';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="Shops" component={ShopsScreen} />
          <Stack.Screen name="Billing" component={BillingScreen} />
          <Stack.Screen name="AddShop" component={AddShopScreen} />
          <Stack.Screen name="Sales" component={SalesScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Reconciliation" component={ReconciliationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
