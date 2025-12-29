import { PermissionsAndroid, Platform } from 'react-native'

async function requestStoragePermission() {
  if (Platform.OS === 'android') {
    try {
      // Запрашиваем оба разрешения
      const permissions = await PermissionsAndroid.requestMultiple(
        [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ],
        {
          title: 'Разрешения для приложения',
          message: 'Приложению нужны разрешения для работы с файлами',
          buttonNeutral: 'Спросить позже',
          buttonNegative: 'Отмена',
          buttonPositive: 'Ок',
        }
      )

      const allGranted = Object.values(permissions).every(
        (perm) => perm === PermissionsAndroid.RESULTS.GRANTED
      )
      return allGranted
    } catch (err) {
      console.warn(err)
      return false
    }
  } else {
    return true // iOS разрешение не требуется
  }
}

export default requestStoragePermission
