import { Alert, Image, ImageProps, StyleSheet, View, AppState } from 'react-native';
import AudioSessionHelper from '../config/utills/AudioSessionManager'; 
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
import VoiceDetectionUI from '../components/VoiceDetectionUI';

// AudioSessionHelper imported above

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
  console.log('🚀 TabStack component rendering...');

  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [audioSessionActive, setAudioSessionActive] = useState(false);

  // Redux selectors with logging
  const selectedModel = useSelector((state: RootState) => state.home.selectedModel);
  const userDetails = useSelector((state: RootState) => state.home.userDetails);
  const sw = useSelector((state: RootState) => state.home.safeWord?.isSafeWord);
  const sz = useSelector((state: RootState) => state.home.isSafeZone);
  const safeWord = useSelector((state: RootState) => state.home.safeWord?.safeWord);

  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [voiceUIState, setVoiceUIState] = useState<'listening' | 'processing' | 'detected'>('listening');
  const [audioLevel, setAudioLevel] = useState(0.5);

  console.log('📊 Redux State Values:');
  console.log('  - selectedModel:', selectedModel);
  console.log('  - sw (isSafeWord from Redux):', sw);
  console.log('  - sz (isSafeZone from Redux):', sz);
  console.log('  - safeWord:', safeWord);
  console.log('  - userDetails available:', !!userDetails);

  const [isSafeWord, setIsSafeWord] = useState(sw);
  const [isSafeZone, setIsSafeZone] = useState(sz);
  const [currentModel, setCurrentModel] = useState(selectedModel);

  const gender = userDetails?.user?.gender?.length == 0 ? 'male' : userDetails?.user?.gender;
  const audioNameString = userDetails?.user?.first_name + userDetails?.user?.last_name + '-' + gender + '-' + safeWord;

  console.log('🎭 Computed Values:');
  console.log('  - gender:', gender);
  console.log('  - audioNameString:', audioNameString);
  console.log('  - Local isSafeWord state:', isSafeWord);
  console.log('  - Local isSafeZone state:', isSafeZone);
  console.log('  - currentModel:', currentModel);
  console.log('  - appState:', appState);

  const ws = useRef<WebSocket | null>(null);
  const shouldBeListening = useRef(false);

  console.log('Current state ML MODEL', currentModel);
  console.log('Selected state ML MODEL', selectedModel);

  // Audio Session Management Functions
  const activateAudioSession = async () => {
    try {
      console.log('🎤 Activating audio session...');
      await AudioSessionHelper.activateForRecording();
      setAudioSessionActive(true);
      console.log('✅ Audio session activated successfully');
    } catch (error) {
      console.error('❌ Failed to activate audio session:', error);
    }
  };

  const deactivateAudioSession = async () => {
    try {
      console.log('🔇 Deactivating audio session...');
      await AudioSessionHelper.deactivate();
      setAudioSessionActive(false);
      console.log('✅ Audio session deactivated successfully - other apps can use mic');
    } catch (error) {
      console.error('❌ Failed to deactivate audio session:', error);
    }
  };

  // AppState Change Handler
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      console.log('📱 App state changing from', appState, 'to', nextAppState);
      setAppState(nextAppState);

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App going to background - releasing audio resources');
        
        // Stop all audio-related activities
        try {
          if (isListening) {
            await stopListening();
          }
          
          if (isRecording) {
            LiveAudioStream.stop();
            setIsRecording(false);
            console.log('🔇 LiveAudioStream stopped due to background');
          }

          if (ws.current) {
            ws.current.close();
            ws.current = null;
            console.log('🔌 WebSocket closed due to background');
          }

          // Release audio session so other apps can use microphone
          await deactivateAudioSession();

          // Remember that we should be listening when app becomes active again
          shouldBeListening.current = isSafeWord && !isSafeZone;
          console.log('💾 Remembered listening state:', shouldBeListening.current);

        } catch (error) {
          console.error('❌ Error stopping services in background:', error);
        }
      } else if (nextAppState === 'active' && appState !== 'active') {
        console.log('📱 App becoming active - restoring audio resources if needed');
        
        // Small delay to ensure app is fully active
        setTimeout(async () => {
          if (shouldBeListening.current) {
            console.log('🔄 Restoring audio services...');
            
            // Reactivate audio session
            await activateAudioSession();
            
            // Restart WebSocket and audio streaming if conditions are met
            if (isSafeWord && !isSafeZone && currentModel) {
              setupWebSocket();
            }
            
            // Restart voice recognition if it was active
            if (isSafeWord && safeWord) {
              startListening();
            }
          }
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [appState, isSafeWord, isSafeZone, currentModel, safeWord, isListening, isRecording]);

  useEffect(() => {
    console.log('📡 selectedModel changed, updating currentModel from', currentModel, 'to', selectedModel);
    setCurrentModel(selectedModel);
  }, [selectedModel]);

  const startListening = async () => {
    try {
      console.log('🎤 Starting voice recognition...');
      
      // Only start if app is in foreground
      if (appState !== 'active') {
        console.log('⏸️ App not active, skipping voice recognition start');
        return;
      }

      // Ensure audio session is active before starting voice recognition
      if (!audioSessionActive) {
        await activateAudioSession();
      }

      await Voice.start('en-US');
      setIsListening(true);
      console.log('✅ Voice recognition started successfully');
    } catch (e) {
      console.error('❌ Voice.start error:', e);
    }
  };

  const stopListening = async () => {
    try {
      console.log('🔇 Stopping voice recognition...');
      await Voice.stop();
      setIsListening(false);
      console.log('✅ Voice recognition stopped successfully');
    } catch (e) {
      console.error('❌ Voice.stop error:', e);
    }
  };

  useEffect(() => {
    console.log('🔄 Redux sw changed from', isSafeWord, 'to', sw);
    setIsSafeWord(sw);
  }, [sw]);

  useEffect(() => {
    console.log('🔄 Redux sz changed from', isSafeZone, 'to', sz);
    setIsSafeZone(sz);
  }, [sz]);

  // Voice Recognition Logic with AppState awareness
  useEffect(() => {
    console.log('🎤 Setting up Voice Recognition...');
    console.log('  - Current isSafeWord:', isSafeWord);
    console.log('  - Current safeWord:', safeWord);
    console.log('  - App State:', appState);

    // Voice event listeners
    const onSpeechStart = () => {
      console.log('🎤 Speech recognition started');
    };

    const onSpeechEnd = () => {
      console.log('🎤 Speech recognition ended. Restarting...');
      // Only restart if app is active and conditions are met
      if (isSafeWord && safeWord && appState === 'active') {
        startListening();
      }
    };

    const onSpeechResults = (e: any) => {
      console.log('🎤 Raw speech results:', e);

      // Only process speech if app is active
      if (appState !== 'active') {
        console.log('⏸️ App not active, ignoring speech results');
        return;
      }

      // Show UI only when we have actual speech to process
      if (e.value && e.value[0] && isSafeWord && safeWord) {
        setShowVoiceUI(true);
        setVoiceUIState('processing');
        console.log('🎨 Showing Voice UI - processing speech...');
      }

      const latestWordArray = e.value?.[0]?.split(' ');
      const latestWord = latestWordArray?.at(-1);

      console.log('🎤 SPEECH ANALYSIS:');
      console.log('  - Full sentence:', e.value?.[0]);
      console.log('  - Word array:', latestWordArray);
      console.log('  - Latest word:', latestWord);
      console.log('  - Target safe word:', safeWord);

      if (e.value) {
        setRecognizedText(e.value[0]);
        console.log('📝 Updated recognizedText to:', e.value[0]);

        const cleanLatestWord = latestWord?.toLowerCase().trim();
        const cleanSafeWord = safeWord?.toLowerCase().trim();

        console.log('🧹 CLEANED COMPARISON:');
        console.log('  - Clean latest word:', `"${cleanLatestWord}"`);
        console.log('  - Clean safe word:', `"${cleanSafeWord}"`);

        if (cleanLatestWord === cleanSafeWord) {
          console.log('🚨🚨🚨 SAFE WORD DETECTED! 🚨🚨🚨');
          
          setVoiceUIState('detected');
          dispatch(HomeActions.setThreatDetected(true));

          setTimeout(() => {
            setShowVoiceUI(false);
            stopListening();
          }, 2000);

        } else {
          if (e.value?.[0]?.toLowerCase().trim().includes(cleanSafeWord)) {
            console.log('🔍 PARTIAL MATCH DETECTED in full sentence!');
            
            setVoiceUIState('detected');
            dispatch(HomeActions.setThreatDetected(true));

            setTimeout(() => {
              setShowVoiceUI(false);
              stopListening();
            }, 2000);
          } else {
            setTimeout(() => {
              setShowVoiceUI(false);
            }, 1000);
          }
        }
      } else {
        setTimeout(() => {
          setShowVoiceUI(false);
        }, 500);
      }
    };

    console.log('🔗 Attaching voice event listeners...');
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;

    // Only start listening if app is active and conditions are met
    if (isSafeWord && safeWord && appState === 'active') {
      console.log('✅ Starting voice listening (app is active)...');
      startListening();
    } else {
      console.log('❌ Not starting voice listening because:');
      if (!isSafeWord) console.log('  - isSafeWord is false');
      if (!safeWord) console.log('  - safeWord is empty/null');
      if (appState !== 'active') console.log('  - app is not active');
      setShowVoiceUI(false);
      stopListening();
    }

    return () => {
      console.log('🧹 Cleaning up voice recognition...');
      setShowVoiceUI(false);
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isSafeWord, safeWord, appState]);

  useEffect(() => {
    if (showVoiceUI && voiceUIState === 'listening') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showVoiceUI, voiceUIState]);

  const onDisplayNotification = async (title: string, body: string) => {
    console.log('🔔 Displaying notification:', { title, body });
    try {
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
      console.log('✅ Notification displayed successfully');
    } catch (error) {
      console.error('❌ Notification error:', error);
    }
  };

  const setupWebSocket = useCallback(() => {
    console.log('🌐 SETTING UP WEBSOCKET...');
    console.log('  - currentModel URL:', currentModel);
    console.log('  - audioNameString:', audioNameString);
    console.log('  - App State:', appState);

    if (!currentModel) {
      console.error('❌ No currentModel provided, cannot setup WebSocket');
      return;
    }

    // Don't setup WebSocket if app is not active
    if (appState !== 'active') {
      console.log('⏸️ App not active, skipping WebSocket setup');
      return;
    }

    const socket = new WebSocket(currentModel);

    socket.onopen = async () => {
      console.log('✅ WebSocket connection opened successfully');
      ws.current = socket;

      // Ensure audio session is active before starting audio stream
      if (!audioSessionActive) {
        await activateAudioSession();
      }

      console.log('📤 Sending audioNameString to server:', audioNameString);
      ws.current.send(audioNameString);
      console.log('✅ AudioNameString sent successfully');

      // Start audio streaming
      try {
        LiveAudioStream.init({
          sampleRate: 16000,
          bufferSize: 4096,
          channels: 1,
          bitsPerSample: 16,
          audioSource: 6,
          wavFile: '',
        });
        console.log('✅ LiveAudioStream initialized successfully');

        LiveAudioStream.on('data', data => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN && appState === 'active') {
            ws.current.send(data);
          }
        });

        LiveAudioStream.start();
        setIsRecording(true);
        console.log('🎤 Live audio streaming started');
      } catch (audioError) {
        console.error('❌ LiveAudioStream error:', audioError);
      }
    };

    socket.onmessage = event => {
      console.log('📥 RAW MESSAGE FROM SERVER:', event.data);

      // Only process messages if app is active
      if (appState !== 'active') {
        console.log('⏸️ App not active, ignoring server message');
        return;
      }

      try {
        const parsedData = JSON.parse(event.data);
        console.log('📊 PARSED SERVER DATA:', parsedData);

        const isThreat = parsedData.threat_detected;
        const isNegativeSentiment = parsedData?.sentiment == 'negative';
        const detectedText = parsedData?.text || parsedData?.transcript || '';

        console.log('🔍 THREAT ANALYSIS:');
        console.log('  - isThreat:', isThreat);
        console.log('  - isNegativeSentiment:', isNegativeSentiment);
        console.log('  - detectedText:', detectedText);

        // Check if the detected text contains the safe word
        if (detectedText && safeWord) {
          const cleanDetectedText = detectedText.toLowerCase().trim();
          const cleanSafeWord = safeWord.toLowerCase().trim();
          const textWords = cleanDetectedText.split(' ').map(word => word.trim());
          const containsSafeWord = textWords.includes(cleanSafeWord) || cleanDetectedText.includes(cleanSafeWord);

          if (containsSafeWord) {
            console.log('🚨🚨🚨 SAFE WORD DETECTED VIA WEBSOCKET! 🚨🚨🚨');
            dispatch(HomeActions.setThreatDetected(true));
            onDisplayNotification('Safe Word Detected', 'Starting emergency live stream...');
            return;
          }
        }

        if (currentModel == Environments.Models.WHISPER_AND_SENTIMENT) {
          if (isNegativeSentiment) {
            console.log('🚨 NEGATIVE SENTIMENT DETECTED!');
            onDisplayNotification('A New Threat Detected', 'Start your live stream now');
            setIsVisible(true);
          }
        } else if (isThreat) {
          console.log('🚨 THREAT DETECTED!');
          onDisplayNotification('A New Threat Detected', 'Start your live stream now');
          setIsVisible(true);
        }
      } catch (parseError) {
        console.error('❌ Error parsing server message:', parseError);
      }
    };

    socket.onerror = error => {
      console.error('❌ WebSocket error:', error);
    };

    socket.onclose = (event) => {
      console.log('🔌 WebSocket connection closed');
      ws.current = null;
      
      // Stop audio streaming when WebSocket closes
      try {
        LiveAudioStream.stop();
        setIsRecording(false);
      } catch (error) {
        console.log('⚠️ Error stopping LiveAudioStream on WebSocket close:', error);
      }
    };
  }, [currentModel, audioNameString, safeWord, dispatch, appState, audioSessionActive]);

  // Main control useEffect with AppState awareness
  useEffect(() => {
    console.log('🔧 MAIN CONTROL USEEFFECT TRIGGERED');
    console.log('  - isSafeWord:', isSafeWord);
    console.log('  - isSafeZone:', isSafeZone);
    console.log('  - currentModel:', currentModel);
    console.log('  - appState:', appState);
    console.log('  - Condition check:', isSafeWord && !isSafeZone && appState === 'active');

    if (isSafeWord && !isSafeZone && appState === 'active') {
      console.log('✅ CONDITIONS MET - Starting WebSocket and audio stream...');
      setupWebSocket();
    } else {
      console.log('❌ CONDITIONS NOT MET - Stopping services...');
      console.log('  - Reasons:');
      if (!isSafeWord) console.log('    * isSafeWord is false');
      if (isSafeZone) console.log('    * isSafeZone is true');
      if (appState !== 'active') console.log('    * app is not active');

      if (ws.current) {
        console.log('🔌 Closing existing WebSocket...');
        ws.current.close();
        ws.current = null;
      }

      try {
        LiveAudioStream.stop();
        setIsRecording(false);
      } catch (error) {
        console.log('⚠️ Error stopping LiveAudioStream:', error);
      }

      // If app is going to background, release audio session
      if (appState !== 'active') {
        deactivateAudioSession();
      }
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleanup function called');
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      try {
        LiveAudioStream.stop();
        setIsRecording(false);
      } catch (error) {
        console.log('⚠️ Cleanup error:', error);
      }
    };
  }, [isSafeWord, isSafeZone, currentModel, setupWebSocket, appState]);

  // Initialize audio session when component mounts
  useEffect(() => {
    if (isSafeWord && !isSafeZone && appState === 'active') {
      activateAudioSession();
    }

    // Cleanup audio session when component unmounts
    return () => {
      deactivateAudioSession();
    };
  }, []);

  const startStreaming = useCallback(async () => {
    console.log('🎬 StartStreaming callback called');
    console.log('  - appState:', appState);

    // Don't start background service if app is not active
    if (appState !== 'active') {
      console.log('⏸️ App not active, skipping background service start');
      return;
    }

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
      console.log('🎬 Background task started');
      // Note: Background tasks have limitations on audio access
      // Consider if this background service is actually needed
    };

    if (isSafeWord && !isSafeZone && appState === 'active') {
      console.log('🚀 Starting background service...');
      await BackgroundService.start(backgroundTask, options);
    } else {
      console.log('🛑 Stopping background service...');
      await BackgroundService.stop();
    }
  }, [currentModel, isSafeZone, isSafeWord, appState]);

  useEffect(() => {
    console.log('🎬 StartStreaming useEffect triggered');
    if (appState === 'active') {
      startStreaming();
    }
  }, [startStreaming, appState]);

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

  console.log('🎨 Rendering TabStack UI...');

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
          activeColor="#FFFFFF"
          inactiveColor="#999999"
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
                  color: '#fff',
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
        onClose={() => {
          console.log('🔄 Modal closed');
          setIsVisible(false);
        }}>
        <CustomText.MediumText customStyle={{ letterSpacing: 0.9 }}>
          Are you being threatened ?
        </CustomText.MediumText>
        <View style={styles.modalButtonContainer}>
          <PrimaryButton
            title="Yes"
            customStyles={{ borderRadius: 10 }}
            width={'45%'}
            onPress={() => {
              console.log('🚨 User confirmed threat - starting stream...');
              setIsVisible(false);
              onDisplayNotification('A New Threat Detected', 'Start your live stream now');
              NavigationService.navigate('LiveStream', { triggerFunction: true });
            }}
          />
          <PrimaryButton
            title="No"
            width={'45%'}
            customStyles={{ borderRadius: 10 }}
            onPress={() => {
              console.log('✅ User denied threat - closing modal');
              setIsVisible(false);
            }}
          />
        </View>
      </CustomModal>

      <VoiceDetectionUI
        visible={showVoiceUI}
        isListening={voiceUIState === 'listening'}
        audioLevel={audioLevel}
        onAnimationComplete={() => {
          console.log('Voice UI animation completed');
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  barStyle: {
    backgroundColor: Utills.selectedThemeColors().Base,
    borderTopWidth: 0,
    height: Metrix.VerticalSize(110),
    paddingTop: Metrix.VerticalSize(15),
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