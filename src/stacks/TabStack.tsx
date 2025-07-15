import { Alert, Image, ImageProps, StyleSheet, View } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { Settings, TrustedContacts, LiveStream, SafeZone, Premium, HeadsUp } from '../screens';
import { Images, Metrix, NavigationService, Utills } from '../config';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import LiveAudioStream from 'react-native-live-audio-stream';
import notifee, { EventType } from '@notifee/react-native';
import { CustomModal, CustomText, PrimaryButton } from '../components';
import BackgroundService from 'react-native-background-actions';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/reducers';
import Voice from '@react-native-voice/voice';
import { HomeActions } from '../redux/actions';
import { Environments } from '../services/config';
import { useHeartRateHook } from '../hooks';
import { HomeAPIS } from '../services/home';

const Tab = createMaterialBottomTabNavigator();
type TabStackType = {
  name: string;
  component: React.FC;
  active: ImageProps['source'];
  inActive: ImageProps['source'];
}[];

// Updated tab order: LiveStream(1), Contacts(2), SafeZones(3), Premium(4), Settings(5)
const tabsData: TabStackType = [
  {
    name: 'HeadsUp',
    component: HeadsUp,
    active: Images.HeadsUp,
    inActive: Images.HeadsUp,
  },
  {
    name: 'Safe Zones',
    component: SafeZone,
    active: Images.Map,
    inActive: Images.Map,
  },
  {
    name: 'LiveStream',
    component: LiveStream,
    active: Images.HomeActive,
    inActive: Images.HomeActive,
  },
  {
    name: 'Premium',
    component: Premium,
    active: Images.Premium,
    inActive: Images.Premium,
  },
  {
    name: 'Settings',
    component: Settings,
    active: Images.SettingsActive,
    inActive: Images.SettingsActive,
  },
];

export const TabStack: React.FC = ({ }) => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  const [isListening, setIsListening] = useState(false);
  const selectedModel = useSelector(
    (state: RootState) => state.home.selectedModel,
  );
  const userDetails = useSelector((state: RootState) => state.home.userDetails);
  const sw = useSelector((state: RootState) => state.home.safeWord?.isSafeWord);
  const sz = useSelector((state: RootState) => state.home.isSafeZone);
  const safeWord = useSelector(
    (state: RootState) => state.home.safeWord?.safeWord,
  );
  const [isSafeWord, setIsSafeWord] = useState(sw);
  const [isSafeZone, setIsSafeZone] = useState(sz);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const gender =
    userDetails?.user?.gender?.length == 0 ? 'male' : userDetails?.user?.gender;
  const audioNameString =
    userDetails?.user?.first_name +
    userDetails?.user?.last_name +
    '-' +
    gender +
    '-' +
    safeWord;
  const ws = useRef<WebSocket | null>(null);

  console.log('Current state ML MODEL', currentModel);
  console.log('Selected state ML MODEL', selectedModel);

  useEffect(() => {
    setCurrentModel(selectedModel);
  }, [selectedModel]);

  const startListening = async () => {
    try {
      console.log('Starting voice recognition...');
      await Voice.start('en-US');
      setIsListening(true);
    } catch (e) {
      console.error('Voice.start error:', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error('Voice.stop error:', e);
    }
  };

  useEffect(() => {
    setIsSafeWord(sw);
  }, [sw]);

  useEffect(() => {
    setIsSafeZone(sz);
  }, [sz]);

  useEffect(() => {
    // Voice event listeners
    const onSpeechStart = () => {
      console.log('Speech recognition started');
    };

    const onSpeechEnd = () => {
      console.log('Speech recognition ended. Restarting...');
      startListening();
    };

    const onSpeechResults = (e: any) => {
      const latestWordArray = e.value?.[0]?.split(' ');
      const latestWord = latestWordArray?.at(-1);
      console.log('Speech results:', latestWord);
      if (e.value) {
        setRecognizedText(e.value[0]);
        if (latestWord?.toLowerCase() == safeWord?.toLowerCase()) {
          setIsSafeWord(true);
        }
      }
    };

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;

    if (!isSafeWord) {
      startListening();
    }

    return () => {
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isSafeWord]);

  const onDisplayNotification = async (title: string, body: string) => {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });
    await notifee.displayNotification({
      title: title,
      body: body,
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
    });
  };

  const setupWebSocket = useCallback(() => {
    const socket = new WebSocket(currentModel);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      ws.current = socket;
      ws.current.send(audioNameString);
    };

    socket.onmessage = event => {
      console.log('Message from server:', event.data);
      const parsedData = JSON.parse(event.data);
      const isThreat = parsedData.threat_detected;
      const isNegativeSentiment = parsedData?.sentiment == 'negative';
      if (currentModel == Environments.Models.WHISPER_AND_SENTIMENT) {
        if (isNegativeSentiment) {
          console.log(
            `${isNegativeSentiment} is a threatening word. in sentimental Model`,
          );
          onDisplayNotification(
            'A New Threat Detected',
            'Start your live stream now',
          );
          setIsVisible(true);
        } else {
          console.log('No threat detected.');
        }
      } else if (isThreat) {
        console.log(`${isThreat} is a threatening word.`);
        onDisplayNotification(
          'A New Threat Detected',
          'Start your live stream now',
        );
        setIsVisible(true);
      } else {
        console.log('No threat detected.');
      }
    };

    socket.onerror = error => {
      console.error('WebSocket error', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      ws.current = null;
    };

    LiveAudioStream.init({
      sampleRate: 16000,
      bufferSize: 4096,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: '',
    });

    LiveAudioStream.on('data', data => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // console.log('Datttta Logging');
        ws.current.send(data);
      }
    });

    LiveAudioStream.start();
    setIsRecording(true);
    console.log('Live audio streaming started');

    // return () => {
    //   if (ws.current) {
    //     ws.current.close();
    //   }
    // };
  }, [currentModel]);

  // useEffect(() => {
  //   const cleanUp = setupWebSocket();
  //   handleNotificationPress();
  //   return cleanUp;
  // }, [setupWebSocket]);

  // Add this useEffect to monitor `isSafeWord`
  useEffect(() => {
    if (isSafeWord && !isSafeZone) {
      console.log('isSafeWord is true. Starting audio stream...');
      setupWebSocket(); // This will start WebSocket and audio streaming
    } else {
      console.log('isSafeWord is false. Stopping audio stream...');
      if (ws.current) {
        ws.current.close(); // Close WebSocket connection if it's open
        ws.current = null;
      }
      LiveAudioStream.stop(); // Stop audio stream
      setIsRecording(false);
    }

    // Cleanup when component unmounts or `isSafeWord` changes
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      LiveAudioStream.stop();
      setIsRecording(false);
    };
  }, [isSafeWord, isSafeZone, currentModel]);

  const startStreaming = useCallback(async () => {
    const options = {
      taskName: 'Audio Streaming',
      taskTitle: 'Streaming audio in background',
      taskDesc: 'Live audio stream',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#ff00ff',
      linkingURI: 'yourapp://home',
      parameters: {
        delay: 1000,
      },
    };

    const backgroundTask = async (taskData: any) => {
      ws.current = new WebSocket(currentModel);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        LiveAudioStream.init({
          sampleRate: 16000,
          bufferSize: 4096,
          channels: 1,
          bitsPerSample: 16,
          audioSource: 6,
          wavFile: '',
        });

        LiveAudioStream.on('data', data => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(data);
          }
        });

        LiveAudioStream.start();
        setIsRecording(true);
      };

      ws.current.onmessage = event => {
        console.log('Message from server: Background', event.data);
        const parsedData = JSON.parse(event.data);
        const isThreat = parsedData.threat_detected;
        console.log('Message from server:Background===', parsedData);
        if (isThreat) {
          console.log(`${isThreat} is a threatening word.`);
          setIsVisible(true);
        } else {
          console.log('No threat detected.');
        }
      };

      ws.current.onerror = error => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
        setIsRecording(false);
      };
    };

    if (isSafeWord && !isSafeZone) {
      await BackgroundService.start(backgroundTask, options);
    } else {
      await BackgroundService.stop();
    }
    const isServiceActive = await BackgroundService.isRunning();
    if (isServiceActive) {
      console.log('Background service is active.');
      onDisplayNotification('Rove', 'Rove is active');
      // Perform any other action if service is active
    } else {
      console.log('Background service is not active.');
      // Start or handle accordingly
    }
  }, [currentModel, isSafeZone]);

  useEffect(() => {
    startStreaming();
  }, [startStreaming]);

  const getIconSize = (iconName) => {
    switch (iconName) {
      case 'LiveStream':
        return { width: 25, height: 25 };
      case 'Safe Zones':
        return { width: 16, height: 27 };
      case 'HeadsUp':
        return { width: 27, height: 27 };
      case 'Premium':
        return { width: 27, height: 25 };
      case 'Settings':
        return { width: 22, height: 25 };
      default:
        return { width: 25, height: 25 };
    }
  };

  return (
    <>
      <PaperProvider
        theme={{
          ...MD3LightTheme,
          colors: {
            ...MD3LightTheme.colors,
            surface: Utills.selectedThemeColors().Base,
          }
        }}
      >
        <Tab.Navigator
          initialRouteName="LiveStream" 
          activeColor="#FFFFFF" // Active icon: white
          inactiveColor="#999999" // Inactive icon: gray
          barStyle={styles.barStyle}
          shifting={false}
          labeled={true}
          sceneAnimationEnabled={false}
          screenOptions={{
            tabBarShowLabel: true,
            tabBarLabelPosition: 'below-icon',
          }}
        >
          {tabsData?.map(item => (
            <Tab.Screen
              key={item?.name}
              name={item?.name}
              component={item?.component}
              options={{
                tabBarLabel: item?.name,
                tabBarIcon: ({ color, focused }) => {
                  const iconSize = getIconSize(item?.name);
                  return (
                    <Image
                      source={focused ? item?.active : item?.inActive}
                      resizeMode="contain"
                      style={{
                        tintColor: color,
                        width: Metrix.HorizontalSize(iconSize.width),
                        height: Metrix.VerticalSize(iconSize.height),
                      }}
                    />
                  );
                },
                tabBarLabelStyle: {
                  fontSize: Metrix.customFontSize(2),
                  fontWeight: '200',
                  color: '#fff', // optional: usually handled automatically
                  marginTop: Metrix.VerticalSize(6),
                  textAlign: 'center',
                },
                tabBarItemStyle: {
                  paddingVertical: Metrix.VerticalSize(8),
                  marginHorizontal: Metrix.HorizontalSize(2),
                  backgroundColor: 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                tabBarAllowFontScaling: false,
                tabBarHideOnKeyboard: false,
              }}
            />
          ))}
        </Tab.Navigator>

      </PaperProvider>

      <CustomModal
        visible={isVisible}
        smallModal
        onClose={() => setIsVisible(false)}>
        <CustomText.MediumText customStyle={{ letterSpacing: 0.9 }}>
          Are you being threatened ?
        </CustomText.MediumText>
        <View style={styles.modalButtonContainer}>
          <PrimaryButton
            title="Yes"
            customStyles={{ borderRadius: 10 }}
            width={'45%'}
            onPress={() => {
              setIsVisible(false);
              onDisplayNotification(
                'A New Threat Detected',
                'Start your live stream now',
              );
              NavigationService.navigate('LiveStream', { triggerFunction: true });
            }}
          />
          <PrimaryButton
            title="No"
            width={'45%'}
            customStyles={{ borderRadius: 10 }}
            onPress={() => setIsVisible(false)}
          />
        </View>
      </CustomModal>
    </>
  );
};

const styles = StyleSheet.create({
  barStyle: {
    backgroundColor: Utills.selectedThemeColors().Base,
    borderTopWidth: 0,
    height: Metrix.VerticalSize(110),
    paddingTop: Metrix.VerticalSize(15),
    // paddingHorizontal: Metrix.HorizontalSize(2),
    paddingBottom: Metrix.VerticalSize(15),
    shadowColor: Utills.selectedThemeColors().PrimaryTextColor,
    shadowOffset: {
      width: Metrix.HorizontalSize(3),
      height: Metrix.VerticalSize(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: Metrix.VerticalSize(20),
  },
  modalButtonContainer: {
    width: '75%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Metrix.VerticalSize(10),
  },
});
