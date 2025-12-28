import * as DocumentPicker from 'expo-document-picker'

async function pickFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  })

  if (result.canceled) return null

  return result.assets[0]
}

export default pickFile
