import { Feather } from '@expo/vector-icons'
import * as Lucide from 'lucide-react'
import { Platform } from 'react-native'

const make = (lucideName, featherName) => {
  const Comp = ({ size, color, ...rest }) => {
    if (Platform.OS === 'web') {
      const L = Lucide[lucideName]
      if (!L) return null
      return (
        <L
          size={size}
          color={color}
          {...rest}
        />
      )
    }

    return (
      <Feather
        name={featherName}
        size={size ?? 24}
        color={color}
        {...rest}
      />
    )
  }

  return Comp
}

export const Bot = make('Bot', 'cpu')
export const Check = make('Check', 'check')
export const Menu = make('Menu', 'menu')
export const Plus = make('Plus', 'plus')
export const Send = make('Send', 'send')
export const User = make('User', 'user')
export const X = make('X', 'x')
export const Download = make('Download', 'download')
export const RefreshCcw = make('RefreshCcw', 'refresh-cw')
export const Trash = make('Trash', 'trash-2')
export const Building2 = make('Building2', 'home')
export const File = make('File', 'file')
export const MessageCircle = make('MessageCircle', 'message-circle')

export default {
  Bot,
  Check,
  Menu,
  Plus,
  Send,
  User,
  X,
  Download,
  RefreshCcw,
  Trash,
  Building2,
  File,
  MessageCircle,
}
