import { useContext, useEffect, useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Download, Plus, RefreshCcw, Trash } from '../components/Icon'
import API_URL from '../constants/API'
import { OrganizationContext } from '../contexts/OrganizationContext'
import cn from '../utils/cn'
import downloadFile from '../utils/downloadFile'
import pickFile from '../utils/pickFile'
import requestStoragePermission from '../utils/requestStoragePermission'

const DocumentsScreen = () => {
  const { organization } = useContext(OrganizationContext)

  const [documents, setDocuments] = useState([])

  const fetchDocuments = async () => {
    if (!organization) {
      setDocuments(() => [])
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/organization/${organization.id}/documents/`
      )
      const data = await response.json()
      setDocuments(() => data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [organization])

  const uploadFile = async () => {
    const file = await pickFile()

    if (!file) return

    try {
      const formData = new FormData()
      formData.set('organization', organization.id)
      formData.set('name', file.name)
      formData.set('b64', file.base64)
      formData.set('mime', file.mimeType ?? 'application/octet-stream')

      const response = await fetch(`${API_URL}/document/`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setDocuments((old) => [...old, data])
    } catch (error) {
      console.error(error)
    }
  }

  const deleteFile = async (id) => {
    try {
      await fetch(`${API_URL}/document/${id}/`, {
        method: 'DELETE',
      })
      fetchDocuments()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <SafeAreaView style={cn('flex-1 bg-gray-100')}>
      <View style={cn('flex-1 h-0 flex flex-col items-stretch gap-2 p-4')}>
        {!organization && (
          <View style={cn('flex-1 flex items-center justify-center')}>
            <Text>Выберите организацию</Text>
          </View>
        )}

        {organization && (
          <>
            <Text style={cn('text-lg text-center')}>
              Документы организации {organization.name}
            </Text>

            <View style={cn('flex flex-row items-center justify-center gap-2')}>
              <TouchableOpacity
                style={cn('bg-blue-600 p-2 rounded-xl self-center text-white')}
                onPress={uploadFile}>
                <Plus
                  size={20}
                  color='#fff'
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={cn('bg-blue-600 p-2 rounded-xl self-center text-white')}
                onPress={fetchDocuments}>
                <RefreshCcw
                  size={20}
                  color='#fff'
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={documents}
              keyExtractor={(i) => i.id}
              contentContainerStyle={cn(
                'flex flex-col items-stretch gap-2 p-2'
              )}
              renderItem={(i) => (
                <View
                  style={cn(
                    'border border-blue-600 rounded-xl p-2',
                    'flex flex-col items-stretch justify-between gap-2'
                  )}>
                  <View style={cn('flex flex-col items-stretch')}>
                    <Text style={cn('text-lg')}>Название: {i.item.name}</Text>
                    <Text style={cn('text-base')}>
                      Индексация:{' '}
                      {i.item.is_embeddings_complete
                        ? 'завершена'
                        : 'в процессе'}
                    </Text>
                  </View>

                  <View
                    style={cn('flex flex-row items-center justify-end gap-2')}>
                    <TouchableOpacity
                      style={cn(
                        'bg-green-600 p-2 rounded-xl self-center text-white'
                      )}
                      onPress={async () => {
                        const canDownload = await requestStoragePermission()
                        if (!canDownload) {
                          alert('Нет разрешения на сохранение файла')
                          return
                        }

                        downloadFile(
                          `${API_URL}/document/${i.item.id}/download`,
                          i.item.name
                        )
                      }}>
                      <Download
                        size={20}
                        color='#fff'
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={cn(
                        'bg-red-600 p-2 rounded-xl self-center text-white'
                      )}
                      onPress={() => deleteFile(i.item.id)}>
                      <Trash
                        size={20}
                        color='#fff'
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

export default DocumentsScreen
