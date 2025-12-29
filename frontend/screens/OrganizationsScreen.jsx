import { useContext, useEffect, useState } from 'react'
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Check, Plus } from '../components/Icon'
import API_URL from '../constants/API'
import { OrganizationContext } from '../contexts/OrganizationContext'
import cn from '../utils/cn'

const OrganizationsScreen = ({ navigation }) => {
  const { fetchOrganizations, organizations, organization, setOrganization } =
    useContext(OrganizationContext)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const [newName, setNewName] = useState('')

  const createOrganization = async () => {
    try {
      const response = await fetch(`${API_URL}/organization/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
        }),
      })
      const data = await response.json()
      setNewName(() => '')
      fetchOrganizations().then(() => setOrganization(() => data))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <SafeAreaView style={cn('flex-1')}>
      <View style={cn('flex-1 h-0 flex flex-col items-stretch gap-2 p-4')}>
        <Text style={cn('text-lg text-center')}>Выберите организацию</Text>

        <View style={cn('flex flex-row items-center gap-2 p-2')}>
          <TextInput
            style={[
              cn(
                'bg-white border border-gray-200 rounded-xl py-1 px-2 flex-1 w-0 text-base'
              ),
              { elevation: 5 },
              { boxShadow: '0 4px 6px rgba(0,0,0,0.25)' },
            ]}
            value={newName}
            onChangeText={setNewName}
            onKeyPress={(nativeEvent) => {
              if (nativeEvent.key === 'Enter') createOrganization()
            }}
            placeholder='Введите название'
          />
          <TouchableOpacity onPress={createOrganization}>
            <Plus size={20} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={organizations}
          keyExtractor={(i) => i.id}
          contentContainerStyle={cn('flex flex-col items-stretch gap-2 p-2')}
          renderItem={(i) => (
            <TouchableOpacity
              style={[
                cn(
                  'flex flex-row items-center justify-between gap-2',
                  'border border-blue-600 p-2 rounded-xl text-black bg-white'
                ),
                { elevation: 5 },
                { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
              ]}
              onPress={() => {
                setOrganization(() => i.item)
                navigation.navigate('Chat')
              }}>
              <View>
                <Text style={cn('text-black text-lg')}>{i.item.name}</Text>
              </View>

              {i.item.id != organization.id && <Check size={20} />}
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

export default OrganizationsScreen
