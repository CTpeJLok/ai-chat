import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'

const downloadFile = async (url, filename) => {
  if (Platform.OS === 'web') {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  try {
    const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory
    const fileUri = dir + filename

    const { uri } = await FileSystem.downloadAsync(url, fileUri)

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri)
      } else {
        console.log('Sharing not available; file saved to', uri)
      }
    } catch (err) {
      console.log('Share failed:', err)
    }

    return uri
  } catch (err) {
    console.log('Download failed:', err)
    throw err
  }
}

export default downloadFile
