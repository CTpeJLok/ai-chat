import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import tw from 'twrnc'
import { Building2, File, MessageCircle } from './components/Icon'
import SplashScreen from './components/SplashScreen'
import { OrganizationProvider } from './contexts/OrganizationContext'
import ChatScreen from './screens/ChatScreen'
import DocumentsScreen from './screens/DocumentsScreen'
import OrganizationsScreen from './screens/OrganizationsScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <OrganizationProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: tw`bg-white h-16`,
            tabBarLabelStyle: tw`text-base`,
          }}>
          <Tab.Screen
            name='Chat'
            component={ChatScreen}
            options={{
              tabBarLabel: 'Чат',
              tabBarIcon: ({ color, size }) => (
                <MessageCircle
                  size={size}
                  color={color}
                />
              ),
            }}
          />

          <Tab.Screen
            name='Organizations'
            component={OrganizationsScreen}
            options={{
              tabBarLabel: 'Организации',
              tabBarIcon: ({ color, size }) => (
                <Building2
                  size={size}
                  color={color}
                />
              ),
            }}
          />

          <Tab.Screen
            name='Documents'
            component={DocumentsScreen}
            options={{
              tabBarLabel: 'Документы',
              tabBarIcon: ({ color, size }) => (
                <File
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </OrganizationProvider>
  )
}
