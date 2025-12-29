import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import tw from 'twrnc'

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start()
  }, [fadeAnim, scaleAnim])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ])
    ).start()
  }, [progressAnim])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={tw`flex-1 bg-white justify-center items-center`}>
      <Animated.View
        style={[
          tw`items-center`,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <Animated.Image
          source={require('../assets/my_icon.jpg')}
          style={[tw`w-24 h-24 rounded-full mb-6`]}
        />
        <Animated.Text
          style={[
            tw`text-3xl font-bold text-gray-800`,
            {
              opacity: fadeAnim,
            },
          ]}>
          DocuMind
        </Animated.Text>
      </Animated.View>

      <View style={tw`absolute bottom-20 w-4/5`}>
        <View style={tw`h-1 bg-gray-200 rounded-full overflow-hidden`}>
          <Animated.View
            style={[
              tw`h-full bg-blue-500 rounded-full`,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>
    </View>
  )
}
