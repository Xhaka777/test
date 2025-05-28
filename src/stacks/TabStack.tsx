import {Alert, Image, ImageProps, StyleSheet, View} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import {Settings, TrustedContacts, LiveStream, SafeZone} from '../screens';
import {Images, Metrix, NavigationService, Utills} from '../config';
import {MD3LightTheme, PaperProvider} from 'react-native-paper';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import LiveAudioStream from 'react-native-live-audio-stream';
import notifee, {EventType} from '@notifee/react-native';
import {CustomModal, CustomText, PrimaryButton} from '../components';
import BackgroundService from 'react-native-background-actions';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../redux/reducers';
import Voice from '@react-native-community/voice';
import {HomeActions} from '../redux/actions';
import {Environments} from '../services/config';
import {useHeartRateHook} from '../hooks';

const Tab = createMaterialBottomTabNavigator();
type TabStackType = {
  name: string;
  component: React.FC;
  active: ImageProps['source'];
  inActive: ImageProps['source'];
}[];

const tabsData: TabStackType = [
  {
    name: 'LiveStream',
    component: LiveStream,
    active: Images.HomeActive,
    inActive: Images.HomeActive,
  },
  {
    name: 'Safe Zones',
    component: SafeZone,
    active: Images.Map,
    inActive: Images.Map,
  },
  {
    name: 'Contacts',
    component: TrustedContacts,
    active: Images.People,
    inActive: Images.People,
  },
  {
    name: 'Settings',
    component: Settings,
    active: Images.SettingsActive,
    inActive: Images.SettingsActive,
  },
];

export const TabStack: React.FC = ({}) => {
  const selectedModel = useSelector(
    (state: RootState) => state.home.selectedModel,
  );
  const userDetails = useSelector((state: RootState) => state.home.userDetails);
  const sw = useSelector((state: RootState) => state.home.safeWord?.isSafeWord);
  const sz = useSelector((state: RootState) => state.home.isSafeZone);
  const safeWord = useSelector(
    (state: RootState) => state.home.safeWord?.safeWord,
  );
  const averageHeartRate = 75; // Example average heart rate
  const [isVisible, setIsVisible] = useState(false);
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
  const {heartRate, loading, error, refresh} = useHeartRateHook();

  useEffect(() => {
    setCurrentModel(selectedModel);
  }, [selectedModel]);

  const threatDetected = () => {
    console.log('Threat Detected');
    onDisplayNotification(
      'A New Threat Detected',
      'Start your live stream now',
    );
    setIsVisible(true);
  };

  const startListening = async () => {
    try {
      console.log('Starting voice recognition...');
      await Voice.start('en-US');
    } catch (e) {
      console.error('Voice.start error:', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
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
      // const isThreat = parsedData.threat_detected;
      const isNegativeSentiment = parsedData?.sentiment == 'negative';
      if (isNegativeSentiment) {
        if (heartRate != undefined || heartRate != null) {
          if (heartRate > averageHeartRate) {
            console.log('Elevated Heart rate is normal');
            threatDetected();
          } else {
            console.log('Heart rate is normal.so the threat did not detected');
          }
        } else {
          console.log('Heart rate data is not available.', heartRate);
          threatDetected();
        }
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
      console.log('Live audio is streaming========>>>');
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(data);
      }
    });

    LiveAudioStream.start();
    // console.log('Live audio streaming started');
  }, [currentModel]);

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
    }

    // Cleanup when component unmounts or `isSafeWord` changes
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      LiveAudioStream.stop();
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
          console.log('Live audio is streaming========>>> 1');
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(data);
          }
        });

        LiveAudioStream.start();
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
      };
    };

    if (isSafeWord && !isSafeZone) {
      await BackgroundService.start(backgroundTask, options);
    } else {
      console.log('In BG');
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

  return (
    <>
      <PaperProvider theme={MD3LightTheme}>
        <Tab.Navigator
          activeColor={Utills.selectedThemeColors().PrimaryTextColor}
          inactiveColor={Utills.selectedThemeColors().DotGrey}
          barStyle={styles.barStyle}
          shifting>
          {tabsData?.map(item => (
            <Tab.Screen
              key={item?.name}
              name={item?.name}
              component={item?.component}
              options={{
                tabBarLabel: item?.name,
                tabBarIcon: ({color, focused}) => (
                  <Image
                    source={focused ? item?.active : item?.inActive}
                    resizeMode="contain"
                    style={{
                      tintColor: color,
                      width: Metrix.HorizontalSize(20),
                      height: Metrix.VerticalSize(20),
                    }}
                  />
                ),
              }}
            />
          ))}
        </Tab.Navigator>
      </PaperProvider>

      <CustomModal
        visible={isVisible}
        smallModal
        onClose={() => setIsVisible(false)}>
        <CustomText.MediumText customStyle={{letterSpacing: 0.9}}>
          Are you being threatened ?
        </CustomText.MediumText>
        <View style={styles.modalButtonContainer}>
          <PrimaryButton
            title="Yes"
            customStyles={{borderRadius: 10}}
            width={'45%'}
            onPress={() => {
              setIsVisible(false);
              onDisplayNotification(
                'A New Threat Detected',
                'Start your live stream now',
              );
              NavigationService.navigate('LiveStream', {triggerFunction: true});
            }}
          />
          <PrimaryButton
            title="No"
            width={'45%'}
            customStyles={{borderRadius: 10}}
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
    borderTopWidth: 1,
    borderColor: Utills.selectedThemeColors().PrimaryOpacity,
    // borderWidth: 1,
    // borderColor: '#FFFFFF',
    height: Metrix.VerticalSize(90),
    // justifyContent: 'flex-end',
    paddingTop: Metrix.VerticalSize(10),
    // paddingHorizontal: Metrix.VerticalSize(20),
    // borderTopRightRadius: Metrix.VerticalSize(40),
    // borderTopLeftRadius: Metrix.VerticalSize(40),
    shadowColor: Utills.selectedThemeColors().PrimaryTextColor,
    shadowOffset: {
      width: Metrix.HorizontalSize(3),
      height: Metrix.VerticalSize(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,

    elevation: Metrix.VerticalSize(20),
    // ...Metrix.createShadow,
  },
  modalButtonContainer: {
    width: '75%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Metrix.VerticalSize(10),
  },
});
