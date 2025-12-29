import { useContext, useEffect, useState } from 'react'
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bot, Menu, Plus, Send, User, X } from '../components/Icon'
import { OrganizationContext } from '../contexts/OrganizationContext'
import cn from '../utils/cn'

import API_URL from '../constants/API'

const ChatScreen = () => {
  const { organization } = useContext(OrganizationContext)

  const [chats, setChats] = useState([])
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])

  const [newMessage, setNewMessage] = useState('')

  const fetchChats = async (isOrgChanged) => {
    if (!organization) {
      setChats(() => [])
      setChat(() => null)
      setMessages(() => [])
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/organization/${organization.id}/chats/`
      )
      const data = await response.json()
      setChats(() => data)
      setChat((old) => (isOrgChanged ? data[0] : old))
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchChats(true)
  }, [organization])

  const createChat = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: organization.id,
        }),
      })
      const data = await response.json()
      setChats((old) => [...old, data])
      setChat(() => data)
      setIsShowSelectChat(() => false)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMessages = async () => {
    if (!chat) {
      setMessages(() => [])
      return
    }

    try {
      const response = await fetch(`${API_URL}/chat/${chat.id}/messages/`)
      const data = await response.json()
      setMessages(() => data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [chat])

  const sendMessage = async () => {
    if (!newMessage) return

    try {
      setMessages((old) => [
        {
          id: -2,
          role: 'assistant',
          role_name: 'ПользовательМодель',
          text: '',
        },
        {
          id: -1,
          role: 'user',
          role_name: 'Пользователь',
          text: newMessage,
        },
        ...old,
      ])
      setNewMessage(() => '')

      const res = await fetch(`${API_URL}/chat/${chat.id}/message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newMessage,
        }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const decoded = decoder.decode(value, { stream: true })
        const events = decoded.split('\n\n')

        for (const e of events) {
          if (e.startsWith('data: ')) {
            const data = JSON.parse(e.slice('data: '.length))
            if (data.text) {
              setMessages((old) =>
                old.map((i) =>
                  i.id === -2 ? { ...i, text: (i.text ?? '') + data.text } : i
                )
              )
            }
          }
        }
      }

      fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((old) => old.filter((i) => i.id !== -2))
    }
  }

  const [isShowSelectChat, setIsShowSelectChat] = useState(false)

  useEffect(() => {
    if (isShowSelectChat) fetchChats()
  }, [isShowSelectChat])

  return (
    <SafeAreaView style={cn('flex-1 bg-gray-100')}>
      <View style={cn('flex-1 justify-center items-center')}>
        {!organization && <Text>Выберите организацию</Text>}

        {organization && chats.length === 0 && (
          <TouchableOpacity
            style={cn('bg-blue-600 p-4 rounded-xl')}
            onPress={createChat}>
            <Text style={cn('text-white text-base')}>Создать чат</Text>
          </TouchableOpacity>
        )}

        {organization && chats.length > 0 && (
          <View style={cn('flex-1 w-full p-2 flex flex-col items-stretch')}>
            <View
              style={[
                cn(
                  'bg-blue-600 p-4 rounded-t-xl flex flex-row items-center justify-between'
                ),
                { elevation: 5 },
                { boxShadow: '0 4px 6px rgba(0,0,0,0.25)' },
              ]}>
              <TouchableOpacity
                style={cn('text-white')}
                onPress={() => setIsShowSelectChat((old) => !old)}>
                {isShowSelectChat && (
                  <X
                    size={20}
                    color='#fff'
                  />
                )}
                {!isShowSelectChat && (
                  <Menu
                    size={20}
                    color='#fff'
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={cn('text-white')}
                onPress={createChat}>
                <Plus
                  size={20}
                  color='#fff'
                />
              </TouchableOpacity>
            </View>

            {isShowSelectChat && (
              <View
                style={[
                  cn(
                    'bg-white p-2 flex-1 h-0 rounded-b-xl flex flex-col items-stretch gap-2'
                  ),
                  { elevation: 5 },
                  { boxShadow: '0 4px 6px rgba(0,0,0,0.25)' },
                ]}>
                <Text style={cn('text-center text-xl')}>Выберите чат</Text>

                <FlatList
                  data={chats}
                  keyExtractor={(i) => i.id}
                  contentContainerStyle={cn(
                    'flex flex-col items-stretch gap-2 p-2'
                  )}
                  renderItem={(i) => (
                    <TouchableOpacity
                      style={[
                        cn(
                          'flex flex-row items-center justify-between gap-2',
                          'border border-blue-600 p-2 rounded-xl text-black'
                        ),
                        { elevation: 5 },
                        { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
                      ]}
                      onPress={() => {
                        setChat(() => i.item)
                        setIsShowSelectChat(() => false)
                      }}>
                      <View>
                        <Text style={cn('text-black text-lg')}>
                          {i.item.id}
                        </Text>
                        <Text style={cn('text-black text-base')}>
                          {i.item.created_at}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {!isShowSelectChat && (
              <>
                <FlatList
                  inverted
                  data={messages}
                  keyExtractor={(i) => i.id}
                  style={[
                    cn('bg-white p-2'),
                    {
                      borderLeftWidth: 1,
                      borderRightWidth: 1,
                      borderColor: '#e2e8f0',
                    },
                  ]}
                  contentContainerStyle={cn('p-2')}
                  renderItem={(i) => (
                    <View
                      key={i.item.id}
                      style={cn(
                        'flex flex-row items-end gap-2 mb-4',
                        i.item.role === 'user' && 'justify-end'
                      )}>
                      <View
                        style={cn(
                          `h-10 w-10 min-w-10 rounded-full flex items-center justify-center`,
                          i.item.role === 'assistant' && 'bg-gray-200'
                        )}>
                        {i.item.role === 'assistant' && <Bot size={20} />}
                      </View>

                      <View style={cn('flex-1 w-0 flex flex-row')}>
                        <View
                          style={[
                            cn(
                              'max-w-full bg-gray-100 p-4 rounded-xl',
                              i.item.role === 'user' && 'ml-auto'
                            ),
                            { elevation: 5 },
                            { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
                          ]}>
                          <Text
                            style={cn(
                              'text-base truncate',
                              i.item.role === 'user' && 'text-right'
                            )}>
                            {i.item.text}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={cn(
                          `h-10 w-10 min-w-10 rounded-full flex items-center justify-center`,
                          i.item.role === 'user' && 'bg-gray-200'
                        )}>
                        {i.item.role === 'user' && <User size={20} />}
                      </View>
                    </View>
                  )}
                />

                <View
                  style={[
                    cn(
                      'bg-white p-2 rounded-b-xl border-t border-gray-200 flex flex-row items-stretch gap-2'
                    ),
                    { elevation: 5 },
                    { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
                  ]}>
                  <TextInput
                    style={cn(
                      'border border-gray-200 rounded-xl py-1 px-2 flex-1 w-0 text-base'
                    )}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    onKeyPress={(nativeEvent) => {
                      if (nativeEvent.key === 'Enter') sendMessage()
                    }}
                  />

                  <TouchableOpacity
                    style={cn(
                      'bg-blue-600 p-2 rounded-xl text-white text-base'
                    )}
                    onPress={sendMessage}>
                    <Send
                      size={20}
                      color='#fff'
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default ChatScreen
