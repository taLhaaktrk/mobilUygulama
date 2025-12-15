import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Zamanlayıcı" }} />
        <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: "Raporlar" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
