import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngineEx,
  RenderModeType,
  VideoSourceType,
  createAgoraRtcEngine,
  RtcSurfaceView,
  RecorderState,
  MediaRecorderContainerFormat,
  MediaRecorderStreamType,
} from 'react-native-agora';
import Config from '../../../config/agora.config';
import { askMediaAccess } from '../../../config/utills/permissions';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
  Text,
} from 'react-native';
import {
  FontType,
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import { LiveStreamProps } from '../../propTypes';
import { CustomText, ModeSelector, RoundImageContainer } from '../../../components';
import { deviceHeight, deviceWidth, normalizeFont } from '../../../config/metrix';
import { HomeAPIS } from '../../../services/home';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/reducers';
import RNFS from 'react-native-fs';
import { createThumbnail } from 'react-native-create-thumbnail';
import { HomeActions } from '../../../redux/actions';
import { useFocusEffect, useIsFocused, useRoute } from '@react-navigation/native';
import { Environments } from '../../../services/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ProtectionScheduleModal } from '../../../components/ProtectionScheduleModal';
import { set } from 'lodash';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import LiveStreamContent from '../../../components/Livestream/LiveStreamContent';
import LiveStreamModeSelector from '../../../components/Livestream/LiveStreamModeSelector';

const { width: screenWidth } = Dimensions.get('window');

export const LiveStream: React.FC<LiveStreamProps> = ({ }) => {
  const dispatch = useDispatch();

  // NEW: Tutorial state selectors
  const tutorialCompleted = useSelector((state: RootState) => state.home.tutorialCompleted);
  const isFirstTime = useSelector((state: RootState) => state.user.isFirstTime);

  // NEW: Add state for trusted contacts
  const [trustedContacts, setTrustedContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const isFocus = useIsFocused();
  const layout = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const userDetails = useSelector((state: RootState) => state.home.userDetails);
  const [engine, setEngine] = useState<IRtcEngineEx | undefined>(undefined);
  const [startPreview, setStartPreview] = useState(false);
  const [joinChannelSuccess, setJoinChannelSuccess] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [startSecondCamera, setStartSecondCamera] = useState(false);
  const [publishSecondCamera, setPublishSecondCamera] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [incident_id, setIncident_id] = useState('');
  const [state, setState] = useState({
    appId: Config.appId,
    enableVideo: true,
    channelId: Config.channelId,
    token: Config.token,
    uid: Config.uid,
    token2: Config.token,
    uid2: 99,
    storagePath: `${Platform.OS === 'android'
      ? RNFS.ExternalCachesDirectoryPath
      : RNFS.DocumentDirectoryPath
      }`,
    storagePath2: `${Platform.OS === 'android'
      ? RNFS.ExternalCachesDirectoryPath
      : RNFS.DocumentDirectoryPath
      }`,
    containerFormat: MediaRecorderContainerFormat.FormatMp4,
    streamType: MediaRecorderStreamType.StreamTypeBoth,
    streamType2: MediaRecorderStreamType.StreamTypeVideo,
    maxDurationMs: 120000,
    recorderInfoUpdateInterval: 1000,
    startRecording: false,
  });
  const [lastImage, setLastImage] = useState<any>({
    video: null,
    thumbnail: null,
  });

  //Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  const [eyeEarState, setEyeEarState] = useState('EYE'); // 'EYE' or 'EAR'
  const [preferenceState, setPreferenceState] = useState('A'); // 'A', 'AS', or 'MIC'
  const [modalVisible, setModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState(''); // New toast message state
  const [showToast, setShowToast] = useState(false); // New toast visibility state

  // New state variables for header icons
  const [showAudioIcon, setShowAudioIcon] = useState(true); // Toggle between A and S
  const [showEyeIcon, setShowEyeIcon] = useState(true); // Toggle between ear and eye
  const [showProtectionSchedule, setShowProtectionSchedule] = useState(false);

  const route = useRoute();
  const testStreamContact = route?.params?.testStreamContact;
  const isTestStream = route?.params?.isTestStream;

  const [step, setStep] = useState(0);
  const [resource_id, setResource_id] = useState('');
  const [sid, setSid] = useState('');
  const [viewers, setViewers] = useState<any>([]);
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [hours, setHours] = useState(0);
  const [mode, setMode] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
  const [selectedMode, setSelectedMode] = useState('AUDIO');
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const [isFlashlight, setIsFlashlight] = useState(false);
  const [isCircle, setIsCircle] = useState(true);
  const [recorder, setRecorder] = useState<any | null>(null);
  const [recorder2, setRecorder2] = useState<any | null>(null);
  const [isModeText, setIsModeText] = useState(false);
  const [modeMsg, setModeMsg] = useState('');
  const [preferenceMsg, setPreferenceMsg] = useState('Monitoring for assault');
  const [pressedIndex, setPressedIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const sizeAnim = useRef(new Animated.Value(70)).current;
  const borderRadiusAnim = useRef(new Animated.Value(50)).current;

  // Animation values for horizontal swiping
  const translateX = useSharedValue(0);
  const modeIndex = useSharedValue(0); // 0 for AUDIO, 1 for VIDEO

  const userCordinates = useSelector(
    (state: RootState) => state.home.userLocation,
  );
  const isSafeWord = useSelector(
    (state: RootState) => state?.home?.safeWord?.isSafeWord,
  );
  const safeWord = useSelector(
    (state: RootState) => state?.home?.safeWord?.safeWord,
  );
  const isThreatDetected = useSelector(
    (state: RootState) => state?.home?.threatDetected,
  );

  // NEW: Function to fetch trusted contacts
  const fetchTrustedContacts = useCallback(async () => {
    try {
      setContactsLoading(true);
      const response = await HomeAPIS.getTrustedContacts();
      console.log('Trusted Contacts Response:', response.data);
      setTrustedContacts(response.data || []);
    } catch (error) {
      console.error('Error fetching trusted contacts:', error);
      setTrustedContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  // NEW: Check if user has trusted contacts
  const hasContacts = trustedContacts.length > 0;

  // NEW: Fetch contacts on component mount and focus
  useFocusEffect(
    useCallback(() => {
      fetchTrustedContacts();
    }, [fetchTrustedContacts])
  );

  // Define gesture for horizontal swiping
  const switchMode = (newMode: 'AUDIO' | 'VIDEO') => {
    setMode(newMode);
    const newIndex = newMode === 'AUDIO' ? 0 : 1;
    modeIndex.value = withSpring(newIndex, {
      damping: 20,
      stiffness: 200,
    });

    // Update eye/ear state based on mode
    if (newMode === 'AUDIO') {
      setEyeEarState('EAR');
      showToastNotification('Recipients will get: Audio Stream')
    } else {
      setEyeEarState('EYE');
      showToastNotification('Recipients will get: Video Stream')
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldSwitch = Math.abs(event.translationX) > screenWidth * 0.2;

      if (shouldSwitch) {
        if (event.translationX > 0 && mode === 'VIDEO') {
          // Swipe right: VIDEO to AUDIO
          runOnJS(switchMode)('AUDIO');
        } else if (event.translationX < 0 && mode === 'AUDIO') {
          // Swipe left: AUDIO to VIDEO
          runOnJS(switchMode)('VIDEO');
        }
      }

      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    });

  const showText = () => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400, // fade-in duration
      useNativeDriver: true,
    }).start(() => {
      // After fade-in completes, wait and fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        delay: 2000, // keep visible for 2 seconds
        useNativeDriver: true,
      }).start(() => {
        // Reset state after fade-out finishes
        setPreferenceMsg('');
        setIsModeText(false);
      });
    });
  };

  const showToastNotification = (message: string | { firstLine: string; secondLine: string }) => {
    setToastMessage(message);
    setShowToast(true);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
    }, 3000);
  };

  // Your existing icon functions
  const getEyeEarIcon = () => {
    switch (eyeEarState) {
      case 'EYE':
        return Images.Eye || Images.Eye; // Fallback to existing icon
      case 'EAR':
        return Images.Ear || Images.SpeakerBtn; // Fallback to existing icon
      default:
        return Images.EyeCircle || Images.Eye;
    }
  };

  // Function to get A/A+S/Mic icon
  const getPreferenceIcon = () => {
    switch (preferenceState) {
      case 'A':
        return Images.Automatic || Images.MicBtn; // Fallback to existing icon
      case 'AS':
        return Images.AutoAndManual || Images.MicOpenBtn; // Fallback to existing icon
      case 'MIC':
        return Images.NoMic || Images.Mic; // Fallback to existing icon
      default:
        return Images.Automatic || Images.MicBtn;
    }
  };

  useEffect(() => {
    // Preload the eye icon
    if (Images.EyeAbleIcon) {
      Image.prefetch(Image.resolveAssetSource(Images.EyeAbleIcon).uri);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // When screen loses focus, close the modal
      return () => {
        setModalVisible(false);
      };
    }, [])
  );

  // ✅ NEW: Enhanced toast notification
  const leftHeaderOptions = [
    {
      id: '1',
      key: 'Preference Toggle',
      icon: getPreferenceIcon(),
      onPress: () => {
        console.log('⚙️ Preference toggle pressed, current state:', preferenceState);

        if (preferenceState === 'A') {
          setPreferenceState('AS');
          // Show white toast notification with structured message
          showToastNotification({
            firstLine: 'Stream activates via:',
            secondLine: 'Auto Detection + safe word'
          });
          dispatch(
            HomeActions.setSelectedModel(
              Environments.Models.WHISPER_AND_SENTIMENT,
            ),
          );
          dispatch(
            HomeActions.setSafeWord({
              isSafeWord: true,
              safeWord: safeWord,
            }),
          );
        } else if (preferenceState === 'AS') {
          setPreferenceState('MIC');
        } else {
          setPreferenceState('A');
          // Show white toast notification with structured message
          showToastNotification({
            firstLine: 'Stream activates via:',
            secondLine: 'Manual activation only'
          });
          dispatch(
            HomeActions.setSelectedModel(
              Environments.Models.TRIGGER_WORD_WHISPER,
            ),
          );
          dispatch(
            HomeActions.setSafeWord({
              isSafeWord: false,
              safeWord: safeWord,
            }),
          );
        }
      },
    },
    {
      id: '2',
      key: 'Protection Schedule',
      icon: Images.Schedule || Images.Bell,
      step: 2,
      disabled: preferenceState === 'MIC', // Add this line
      onPress: () => {
        // Only allow press if not in MIC state
        if (preferenceState !== 'MIC') {
          setModalVisible(true);
        }
      }
    }
  ].filter(Boolean);

  // ✅ FIXED: Flashlight only shows in VIDEO mode
  const rightHeaderOptions = mode === 'VIDEO' ? [
    {
      id: '3',
      key: 'Flashlight',
      icon: isFlashlight ? Images.FlashOn : Images.FlashOff,
      step: 3,
      description: 'Enable or disable the flashlight',
      onPress: () => {
        setIsFlashlight(prev => !prev);
        engine?.setCameraTorchOn(!isFlashlight);
      },
    },
  ] : []; // Empty array when in AUDIO mode

  const toggleShape = () => {
    if (isCircle) {
      Animated.parallel([
        Animated.timing(sizeAnim, {
          toValue: 30,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(borderRadiusAnim, {
          toValue: 7,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate from square to circle
      Animated.parallel([
        Animated.timing(sizeAnim, {
          toValue: 70,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(borderRadiusAnim, {
          toValue: 50,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();
    }

    setIsCircle(!isCircle);
  };

  const extractInitials = (text: string) => {
    const parts = text.split(' ');
    const firstLetters = parts.map(part => part.charAt(0));
    const result = firstLetters.join('');
    return result;
  };

  const fetchLastFootage = async () => {
    try {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      // Filter for video files only, e.g., `.mp4`

      const videoFiles = files.filter(file => file.name.endsWith('.mp4'));
      if (videoFiles.length === 0) {
        console.log('No video files found.');
        return;
      }
      // Sort files by modification time (mtime) in descending order
      const sortedFiles = videoFiles.sort(
        (a: any, b: any) =>
          new Date(b.mtime).getTime() - new Date(a.mtime).getTime(),
      );
      // Get the most recently modified video file
      const lastVideoFile = sortedFiles[1];
      const thumbnail = await createThumbnail({
        url: lastVideoFile.path,
      });
      console.log('lastVideoFile', lastVideoFile);

      if (lastVideoFile?.path?.endsWith('AUDIO.mp4')) {
        setLastImage({
          video: null,
          thumbnail: null,
        });
      } else {
        setLastImage({
          video: lastVideoFile,
          thumbnail: thumbnail.path,
        });
      }
    } catch (error) {
      console.error('Error fetching video or creating thumbnail:', error);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          if (prevSeconds === 59) {
            setMinutes(prevMinutes => {
              if (prevMinutes === 59) {
                setHours(prevHours => prevHours + 1);
                return 0;
              }
              return prevMinutes + 1;
            });
            return 0;
          }
          return prevSeconds + 1;
        });
      }, 1000);
    } else if (!isStreaming && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStreaming, seconds]);

  const formatTime = (unit: any) => (unit < 10 ? `0${unit}` : unit);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isThreatDetected) {
      startAndStopStream();
    }
  }, [isThreatDetected]);

  useEffect(() => {
    fetchLastFootage();
  }, []);

  useEffect(() => {
    initRtcEngine();
  }, [isFocus]);

  // All your existing functions remain the same...
  const startRecordingAPI = async (token: any) => {
    const body = {
      channel_name: state.channelId,
      recorder_uid: '316000',
      token: token,
    };
    console.log('startRecordingAPI', body);
    try {
      HomeAPIS.startRecording(body)
        .then(async res => {
          console.log('Recording API Res', res?.data);
          setResource_id(res?.data?.startRecordingResponse?.resourceId);
          setSid(res?.data?.startRecordingResponse?.sid);
          console.log('Recording API Res state', state);
        })
        .catch(err => {
          console.log('Err Recording API', err.response?.data);
        });
    } catch (error) {
      console.error('Error Recording API Res ', error);
    }
  };

  const stopRecordingAPI = async () => {
    const body = {
      channel_name: state.channelId,
      recorder_uid: '316000',
      resource_id: resource_id,
      sid: sid,
      incident_id: incident_id,
    };

    console.log('stopRecordingAPI body', body);
    console.log('state', state);
    try {
      HomeAPIS.stopRecording(body)
        .then(async res => {
          console.log('STOP Recording API Res', res?.data);
          setIncident_id('');
        })
        .catch(err => {
          console.log('Err STOP Recording API', err.response?.data);
        });
    } catch (error) {
      console.error('Error STOP Recording API Res ', error);
    }
  };

  const postMessage = async (token: any, incidentId: any) => {
    try {
      HomeAPIS.postMsg({
        stream_token: token,
        lat: userCordinates?.latitude,
        lng: userCordinates?.longitude,
        type: mode,
      })
        .then(async res => {
          console.log('Response alert msg send', res);
          startRecordingAPI(token);

          let array: any = [];
          if (!isStreaming) {
            setSeconds(0);
            setMinutes(0);
            setHours(0);
          }
          if (isFlashlight) {
            engine?.setCameraTorchOn(true);
          }
          joinChannel(token, incidentId);
          toggleShape();
          res?.data?.results?.map((item: any, index: number) => {
            array?.push({
              id: index?.toString(),
              name: item?.name,
              color: '#FFFFFF',
            });
          });
          setViewers(array);
        })
        .catch(err => {
          console.log('Err alert msg send', err.response?.data);
        });
    } catch (error) {
      console.error('Error post message ', error);
    }
  };

  const postIncident = async (token: any) => {
    const body = {
      timestamp: new Date(),
      location_latitude: userCordinates?.latitude?.toFixed(6),
      location_longitude: userCordinates?.longitude?.toFixed(6),
      user: userDetails?.user?.id,
    };
    console.log('incident body', body);
    try {
      HomeAPIS.postIncidents(body)
        .then(async res => {
          console.log('Response Post incidents', res?.data);
          postMessage(token, res?.data?.id);
          setIncident_id(res?.data?.id);
        })
        .catch(err => {
          console.log('Err Post incidents', err.response?.data);
        });
    } catch (error) {
      console.error('Error Agora Token ', error);
    }
  };

  const AgoraToken = async () => {
    const body = {
      uid: '0',
      channel_name: state.channelId,
      role: 'publisher',
    };
    console.log('AgoraToken body', body);
    try {
      HomeAPIS.getAgoraToken(body)
        .then(async res => {
          console.log('User Id----', res?.data?.token);
          setState({
            ...state,
            token: res?.data?.token,
            token2: res?.data?.token,
          });
          postIncident(res?.data?.token);
        })
        .catch(err => {
          console.log('Err Agora Token', err.response?.data);
        });
    } catch (error) {
      console.error('Error Agora Token ', error);
    }
  };

  const initRtcEngine = async () => {
    const { appId } = state;
    if (!appId) {
      console.error('appId is invalid');
      return;
    }
    const agoraEngine = createAgoraRtcEngine() as IRtcEngineEx;
    agoraEngine.initialize({
      appId,
      logConfig: { filePath: Config.logFilePath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });

    agoraEngine.registerEventHandler({
      onJoinChannelSuccess: () => setJoinChannelSuccess(true),
      onUserJoined: uid => setRemoteUsers(prevUsers => [...prevUsers, uid]),
      onUserOffline: uid =>
        setRemoteUsers(prevUsers => prevUsers.filter(user => user !== uid)),
    });

    await askMediaAccess([
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
    ]);

    const recorderInstanceBack = agoraEngine?.createMediaRecorder({
      channelId: state.channelId,
      uid: state.uid,
    });

    const recorderInstanceFront = agoraEngine?.createMediaRecorder({
      channelId: state.channelId,
      uid: state.uid2,
    });
    recorderInstanceBack?.setMediaRecorderObserver({
      onRecorderInfoUpdated: (channelId, uid, info) => {
        // console.log('Recorder Info Updated', channelId, uid, info);
      },
      onRecorderStateChanged: (channelId, uid, recorderState, error) => {
        console.log('Recorder State Changed', recorderState, error);
        if (
          recorderState === RecorderState.RecorderStateError ||
          recorderState === RecorderState.RecorderStateStop
        ) {
          console.log('Stopping in create media recorder initializer');
          stopRecording();
        }
      },
    });
    recorderInstanceFront?.setMediaRecorderObserver({
      onRecorderInfoUpdated: (channelId, uid, info) => {
        // console.log('Recorder Info Updated Front', channelId, uid, info);
      },
      onRecorderStateChanged: (channelId, uid, recorderState, error) => {
        console.log('Recorder State Changed Front', recorderState, error);
        if (
          recorderState === RecorderState.RecorderStateError ||
          recorderState === RecorderState.RecorderStateStop
        ) {
          console.log('Stopping in create media recorder initializer Front');
          stopRecording2();
        }
      },
    });
    setRecorder(recorderInstanceBack);
    setRecorder2(recorderInstanceFront);
    agoraEngine.enableVideo();
    agoraEngine.startPreview();
    agoraEngine?.setCameraZoomFactor(0.5);
    setStartPreview(true);
    agoraEngine?.enableMultiCamera(true, { cameraDirection: 0 });
    agoraEngine?.startCameraCapture(
      VideoSourceType.VideoSourceCameraSecondary,
      {
        cameraDirection: 0,
      },
    );
    agoraEngine?.startPreview(VideoSourceType.VideoSourceCameraSecondary);
    setStartSecondCamera(true);
    agoraEngine.switchCamera();
    setEngine(agoraEngine);
  };

  const joinChannel = (agora_token: string, incidentId: any) => {
    const { channelId, token, uid } = state;
    // console.log('token, channelId, uid', token, channelId, uid);
    if (!channelId || uid < 0) {
      console.error('channelId or uid is invalid');
      return;
    }
    engine?.joinChannel(agora_token, channelId, uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });
    setIsStreaming(true);
    if (startSecondCamera) {
      publishSecondCameraToStream(agora_token, incidentId);
    }
    // createMediaRecorder();
    // setTimeout(() => {
    startRecording(incidentId);
    // }, 1000);
  };

  const test = async () => {
    setStartSecondCamera(false);
    setStartPreview(false);
    setIsStreaming(false);
  };

  const leaveChannel = async () => {
    const { channelId, uid2, uid } = state;
    setIsStreaming(false);
    setIsFlashlight(false);
    engine?.setCameraTorchOn(false);
    engine?.leaveChannelEx({ channelId, localUid: uid });
    engine?.leaveChannelEx({ channelId, localUid: uid2 });
    await test();
    engine?.enableVideo();
    engine?.startPreview();
    setStartPreview(true);
    engine?.enableMultiCamera(true, { cameraDirection: 1 });
    engine?.startCameraCapture(VideoSourceType.VideoSourceCameraSecondary, {
      cameraDirection: 1,
    });
    engine?.startPreview(VideoSourceType.VideoSourceCameraSecondary);
    setStartSecondCamera(true);
  };

  const startSecondCameraCapture = async () => {
    if (startSecondCamera) return;
    engine?.switchCamera();
    engine?.enableMultiCamera(true, { cameraDirection: 0 });
    engine?.startCameraCapture(VideoSourceType.VideoSourceCameraSecondary, {
      cameraDirection: 0,
    });
    engine?.startPreview(VideoSourceType.VideoSourceCameraSecondary);
    setStartSecondCamera(true);
    engine?.switchCamera();
  };

  const publishSecondCameraToStream = (
    agora_token: string,
    incidentId: any,
  ) => {
    const { channelId, token2, uid2 } = state;
    if (!channelId || uid2 <= 0) {
      console.error('channelId or uid2 is invalid');
      return;
    }

    engine?.joinChannelEx(
      agora_token,
      { channelId, localUid: uid2 },
      {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        autoSubscribeAudio: false,
        autoSubscribeVideo: false,
        publishMicrophoneTrack: false,
        publishCameraTrack: false,
        publishSecondaryCameraTrack: true,
      },
    );
    setPublishSecondCamera(true);
    setIsStreaming(true);
    startRecording2(incidentId);
  };

  const stopSecondCameraCapture = () => {
    engine?.stopCameraCapture(VideoSourceType.VideoSourceCameraSecondary);
    setStartSecondCamera(false);
  };

  const unpublishSecondCamera = () => {
    const { channelId, uid2 } = state;
    engine?.leaveChannelEx({ channelId, localUid: uid2 });
    setPublishSecondCamera(false);
    // setIsStreaming(false);
    setStartSecondCamera(false);
  };

  const releaseRtcEngine = () => {
    engine?.unregisterEventHandler({
      onJoinChannelSuccess: () => setJoinChannelSuccess(false),
    });
    engine?.release();
  };

  const adjustZoom = (zoom: number) => {
    if (engine) {
      setZoomLevel(zoom);
      engine?.setCameraZoomFactor(zoom);
    }
  };

  // NEW: Modified startAndStopStream function to check for contacts
  const startAndStopStream = () => {
    console.log('isStreaming ');

    // NEW: Check if user has trusted contacts before allowing streaming
    if (!hasContacts && !contactsLoading) {
      console.log('No trusted contacts found, showing message');
      showToastNotification('Add a responder on the Settings to enable livestream');
      return;
    }

    if (isStreaming) {
      console.log('isStreaming inside!', isStreaming);
      leaveChannel();
      toggleShape();
      stopRecordingAPI();
      stopRecording();
      stopRecording2();
      fetchLastFootage();
      dispatch(HomeActions.setThreatDetected(false));
    } else {
      AgoraToken();
    }
  };

  const startRecording = useCallback(
    (incidentId: any) => {
      let uid = Math.floor(10 + Math.random() * 90);
      console.log('Running Start Recording 1', uid);
      recorder?.startRecording({
        storagePath: `${state.storagePath}/${uid}-${incidentId}-${mode}.mp4`,
        containerFormat: state.containerFormat,
        streamType: state.streamType,
        maxDurationMs: state.maxDurationMs,
        recorderInfoUpdateInterval: state.recorderInfoUpdateInterval,
      });
      setState(prev => ({ ...prev, startRecording: true }));
    },
    [recorder, state],
  );

  const startRecording2 = useCallback(
    (incidentId: any) => {
      let uid = Math.floor(10 + Math.random() * 90);
      console.log('Running Start Recording 2', uid);
      recorder2?.startRecording({
        storagePath: `${state.storagePath2}/${uid}-${incidentId}-${mode}.mp4`,
        containerFormat: state.containerFormat,
        streamType: state.streamType2,
        maxDurationMs: state.maxDurationMs,
        recorderInfoUpdateInterval: state.recorderInfoUpdateInterval,
      });
      setState(prev => ({ ...prev, startRecording: true }));
    },
    [recorder2, state],
  );

  /**
   * Step 3-3: Stop Recording
   */
  const stopRecording = useCallback(() => {
    console.log('Running Stop Recording');
    recorder?.stopRecording();
    setState(prev => ({ ...prev, startRecording: false }));
  }, [recorder]);

  const stopRecording2 = useCallback(() => {
    console.log('Running Stop Recording Front');
    recorder2?.stopRecording();
    setState(prev => ({ ...prev, startRecording: false }));
  }, [recorder2]);

  const renderUsers = () => (
    <View style={{ flex: 1, backgroundColor: Utills.selectedThemeColors().Base }}>
      {startPreview && (
        <RtcSurfaceView
          style={{ flex: 1, width: '100%' }}
          canvas={{
            uid: 0,
            sourceType: VideoSourceType.VideoSourceCameraPrimary,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
      )}

      {startSecondCamera ? (
        <>
          {/* Wrapper container for both camera and live indicator */}
          <View style={styles.frontCamWrapper}>
            {/* Camera preview with fixed height */}
            <View style={styles.frontCamPreview}>
              <RtcSurfaceView
                style={{ width: '100%', height: '100%' }}
                canvas={{
                  uid: 0,
                  sourceType: VideoSourceType.VideoSourceCameraSecondary,
                  renderMode: RenderModeType.RenderModeHidden,
                }}
              />
            </View>

            {/* Live indicator positioned below camera but in same container */}
            {isStreaming && (
              <View style={styles.liveBgContainer}>
                <View style={styles.liveContainer}>
                  <View style={styles.liveCircle}></View>
                  <CustomText.RegularText customStyle={{ fontWeight: '700' }}>
                    Live
                  </CustomText.RegularText>
                </View>
                <View style={styles.countContainer}>
                  <Image
                    source={Images.EyeAbleIcon}
                    style={styles.eyeIcon}
                    resizeMode="contain"
                  />
                  <CustomText.RegularText>{viewers?.length}</CustomText.RegularText>
                </View>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.frontCamWrapper}>
          <View style={styles.frontCamPreview}></View>
        </View>
      )}
    </View>
  );

  const renderViewers = () => {
    return (
      <View style={styles.viewerContainer}>
        {viewers?.map((item: any) => {
          return (
            <View key={item?.id} style={styles.viewersContainer}>
              <View
                key={item?.id}
                style={[
                  styles.circularContact,
                  { backgroundColor: item?.color },
                ]}>
                <CustomText.RegularText customStyle={styles.userInitialText}>
                  {extractInitials(item?.name)}
                </CustomText.RegularText>
              </View>
              <CustomText.RegularText customStyle={styles.userNameText}>
                {item?.name}
                <CustomText.RegularText
                  customStyle={[
                    styles.userNameText,
                    { fontWeight: '500', fontSize: normalizeFont(13) },
                  ]}>
                  {' joined'}
                </CustomText.RegularText>
              </CustomText.RegularText>
            </View>
          );
        })}
      </View>
    );
  };

  const renderZoomControls = () => (
    <View style={[
      styles.zoomControls,
      {
        bottom: isStreaming ? '19%' : '24%'
      }
    ]}>
      {[0.5, 2, 3].map((zoom, index) => (
        <TouchableOpacity
          key={index?.toString()}
          onPress={() => adjustZoom(zoom)}
          style={[
            styles.zoomButton,
            zoom === zoomLevel && styles.activeZoomButton
          ]}>
          <CustomText.RegularText
            customStyle={[
              styles.zoomText,
              {
                color: zoom === zoomLevel
                  ? Utills.selectedThemeColors().Yellow
                  : Utills.selectedThemeColors().PrimaryTextColor,
                fontWeight: zoom === zoomLevel ? '700' : '500',
              }
            ]}>
            {zoom === 0.5 ? '0.5×' : `${zoom}×`}
          </CustomText.RegularText>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={true} />
      <SafeAreaView style={{ flex: 1 }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GestureDetector gesture={panGesture}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerContainer}>
                {/* LEFT SIDE ICONS */}
                <View style={styles.topLeftContainer}>
                  {leftHeaderOptions?.map((item: any) => {
                    const isDisabled = item.disabled; // Check if item is disabled

                    return (
                      <TouchableOpacity
                        key={item?.id}
                        activeOpacity={isDisabled ? 1 : 0.7} // No press feedback when disabled
                        onPress={isDisabled ? undefined : item?.onPress} // Disable onPress when disabled
                      >
                        <RoundImageContainer
                          imageStyle={{
                            tintColor: isDisabled
                              ? Utills.selectedThemeColors().SecondaryTextColor // Gray color when disabled
                              : Utills.selectedThemeColors().PrimaryTextColor, // Normal white when enabled
                            alignSelf: 'center',
                            resizeMode: 'contain',
                            marginLeft: item?.id === '1' ? 0.49 : 0,
                          }}
                          backgroundColor="transparent"
                          circleWidth={26}
                          borderWidth={item?.id === '2' ? 0 : 1.4}
                          styles={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: item?.id === '1' ? 0 : (item?.id === '2' ? 0 : 3),
                            opacity: isDisabled ? 0.5 : 1, // Additional opacity reduction when disabled
                          }}
                          borderColor={isDisabled
                            ? Utills.selectedThemeColors().SecondaryTextColor
                            : "white"
                          }
                          source={item?.icon}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* CENTER TIMER - Always centered */}
                <View style={styles.timerCenterContainer}>
                  <Text
                    style={[
                      styles.timerText,
                      {
                        backgroundColor: isStreaming ? '#FF3B30' : 'transparent',
                      },
                    ]}>
                    {isStreaming
                      ? `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`
                      : '00:00:00'}
                  </Text>
                </View>

                {/* RIGHT SIDE ICONS - Only show in video mode */}
                <View style={styles.topRightContainer}>
                  {rightHeaderOptions?.map((item: any) => {
                    return (
                      <TouchableOpacity
                        key={item?.id}
                        activeOpacity={0.7}
                        onPress={item?.onPress}>
                        <RoundImageContainer
                          imageStyle={{
                            tintColor: Utills.selectedThemeColors().PrimaryTextColor,
                          }}
                          backgroundColor="transparent"
                          circleWidth={26}
                          borderWidth={1.4}
                          styles={{ padding: 2 }}
                          borderColor="white"
                          source={item?.icon}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {isModeText && (
                <Animated.View style={[styles.fadeContainer, { opacity }]}>
                  <CustomText.SmallText
                    customStyle={{ color: '#FDD128', textAlign: 'center' }}>
                    {preferenceMsg}
                  </CustomText.SmallText>
                </Animated.View>
              )}

              {showToast && (
                <View style={styles.toastContainer}>
                  {typeof toastMessage === 'string' ? (
                    <CustomText.RegularText customStyle={styles.toastText}>
                      {toastMessage}
                    </CustomText.RegularText>
                  ) : (
                    <View style={styles.multiLineToastContainer}>
                      <CustomText.RegularText customStyle={styles.toastTextNormal}>
                        {toastMessage.firstLine}
                      </CustomText.RegularText>
                      <CustomText.RegularText customStyle={styles.toastTextBold}>
                        {toastMessage.secondLine}
                      </CustomText.RegularText>
                    </View>
                  )}
                </View>
              )}

              <View style={{ flex: 1 }}>
                <LiveStreamContent
                  mode={mode}
                  modeIndex={modeIndex}
                  translateX={translateX}
                  renderUsers={renderUsers}
                  renderViewers={renderViewers}
                  isStreaming={isStreaming}
                  zoomControls={renderZoomControls()}
                />

                {!isStreaming && (
                  <View style={styles.modeSelectorContainer}>
                    <LiveStreamModeSelector
                      currentMode={mode}
                      onModeChange={switchMode}
                      translateX={translateX}
                      modeIndex={modeIndex}
                    />
                  </View>
                )}
              </View>

              <View style={styles.bottomContainer}>
                {/* LEFT SIDE - Play/Footage Button (moved from right) */}
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    // borderColor: Utills.selectedThemeColors().SecondaryTextColor,
                    borderRadius: Metrix.HorizontalSize(7),
                    marginBottom: Metrix.VerticalSize(20)
                  }}
                  onPress={() => {
                    NavigationService.navigate(RouteNames.HomeRoutes.Footages);
                  }}>
                  {lastImage && (
                    <Image
                      source={Images.PlayBtn}
                      resizeMode={'cover'}
                      style={styles.playBtn}
                    />
                  )}

                  {lastImage ? (
                    <Image
                      source={{ uri: lastImage?.thumbnail }}
                      style={styles.footageImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={Images.Audio}
                      style={styles.footageImg}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>

                {/* CENTER - Record/Livestream Button */}
                <View>
                  <TouchableOpacity
                    onPress={startAndStopStream}
                    style={styles.liveStreamButton}>
                    <Animated.View
                      style={[
                        styles.innerLiveStreamButton,
                        {
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: sizeAnim,
                          height: sizeAnim,
                          borderRadius: borderRadiusAnim,
                          borderColor: isCircle
                            ? Utills.selectedThemeColors().Base
                            : Utills.selectedThemeColors().Transparent,
                        },
                      ]}></Animated.View>
                  </TouchableOpacity>
                  <CustomText.RegularText customStyle={styles.livestreamText}>
                    {isStreaming ? 'STREAMING' : 'LIVESTREAM'}
                  </CustomText.RegularText>
                </View>

                {/* RIGHT SIDE - Empty Space (for balance/centering) */}
                <View style={styles.blankView}></View>
              </View>
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
        {modalVisible && (
          <ProtectionScheduleModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
          />
        )}
      </SafeAreaView>
    </View>
  );
};
const getTimerFont = () => {
  if (Platform.OS === 'ios') {
    return {
      fontFamily: 'SF Pro Display',
      fontWeight: '600', // Semi-bold
      fontVariant: ['tabular-nums'],
    };
  } else {
    return {
      fontFamily: 'Roboto',
      fontWeight: '500', // Medium on Android
      fontVariant: ['tabular-nums'],
    };
  }
};
const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    zIndex: 99,
    top: '0%',
    width: '100%',
    backgroundColor: '#00000080',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Metrix.HorizontalSize(10),
    paddingVertical: Metrix.HorizontalSize(10),
    paddingTop: Metrix.HorizontalSize(45),
    justifyContent: 'space-between',
    minHeight: Metrix.VerticalSize(60),
  },

  // Update your topLeftContainer style:
  topLeftContainer: {
    flexDirection: 'row',
    width: '30%',
    justifyContent: 'flex-start',
    alignItems: 'center', // This centers all items vertically
    gap: Metrix.HorizontalSize(8),
  },
  timerCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topRightContainer: {
    flexDirection: 'row',
    width: '30%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timerText: {
    // fontSize: normalizeFont(19),
    fontSize: 22,
    paddingHorizontal: Metrix.HorizontalSize(8),
    paddingVertical: Metrix.VerticalSize(2),
    borderRadius: Metrix.HorizontalSize(3),
    lineHeight: 30,
    overflow: 'hidden',
    textAlign: 'center',

    // iOS Camera Timer Font Properties
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto', // SF Pro on iOS, Roboto on Android
    fontWeight: '100', // Semi-bold weight like iOS camera
    fontVariant: ['tabular-nums'], // Monospaced numbers for consistent spacing
    // letterSpacing: 1, // Slight letter spacing for clarity

    color: '#FFFFFF',
  },

  frontCamWrapper: {
    position: 'absolute',
    top: '19%',
    left: '4%',
    width: '30%',
    borderRadius: Metrix.HorizontalSize(5),
    backgroundColor: 'black',
    overflow: 'visible',
  },

  frontCamPreview: {
    height: Metrix.VerticalSize(150),
    width: '100%',
    borderRadius: Metrix.HorizontalSize(5),
    backgroundColor: 'black',
    overflow: 'hidden',
  },

  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    zIndex: 99,
    bottom: '0%',
    paddingHorizontal: Metrix.HorizontalSize(20),
  },

  blankView: {
    width: Metrix.HorizontalSize(60),
    height: Metrix.VerticalSize(60),
    borderRadius: Metrix.HorizontalSize(100),
  },

  livestreamText: {
    paddingVertical: Metrix.VerticalSize(10),
    fontWeight: '700',
    marginLeft: Metrix.HorizontalSize(8)
  },

  footageImg: {
    width: Metrix.HorizontalSize(50),
    height: Metrix.VerticalSize(50),
    borderRadius: Metrix.HorizontalSize(5),
  },

  circularContact: {
    width: Metrix.VerticalSize(32),
    height: Metrix.VerticalSize(32),
    borderRadius: Metrix.HorizontalSize(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
  },

  liveStreamButton: {
    marginTop: Metrix.VerticalSize(10),
    alignSelf: 'center',
    width: Metrix.HorizontalSize(72),
    height: Metrix.HorizontalSize(72),
    borderRadius: Metrix.VerticalSize(100),
    backgroundColor: Utills.selectedThemeColors().Transparent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Utills.selectedThemeColors().PrimaryTextColor,
    marginLeft: Metrix.HorizontalSize(8)
  },

  innerLiveStreamButton: {
    width: Metrix.HorizontalSize(65),
    height: Metrix.HorizontalSize(65),
    borderRadius: Metrix.VerticalSize(100),
    borderWidth: 2.5,
    borderColor: Utills.selectedThemeColors().Base,
    backgroundColor: Utills.selectedThemeColors().Red,
    // marginLeft: Metrix.HorizontalSize(5)
  },

  zoomControls: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '35%',
    alignItems: 'center',
    borderRadius: Metrix.HorizontalSize(100),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: Metrix.VerticalSize(13)
  },

  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Metrix.HorizontalSize(100),
    width: Metrix.HorizontalSize(26),
    height: Metrix.HorizontalSize(26),
    padding: Metrix.HorizontalSize(5),
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeZoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Metrix.HorizontalSize(100),
    width: Metrix.HorizontalSize(36),
    height: Metrix.HorizontalSize(36),
    padding: Metrix.HorizontalSize(1),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Metrix.VerticalSize(2),
    marginBottom: Metrix.VerticalSize(2)
  },

  zoomText: {
    color: 'white',
    fontSize: 12,
  },

  viewerContainer: {
    top: '50%',
    left: '4%',
    position: 'absolute',
    zIndex: 99,
    paddingVertical: Metrix.HorizontalSize(10),
    justifyContent: 'center',
    width: '100%',
  },

  liveBgContainer: {
    position: 'absolute',
    bottom: -Metrix.VerticalSize(40),
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Utills.selectedThemeColors().Base,
    padding: Metrix.HorizontalSize(2),
    borderRadius: Metrix.HorizontalSize(2),
    borderTopWidth: 0,
    marginTop: Metrix.VerticalSize(6)
  },

  liveContainer: {
    width: '50%',
    height: Metrix.VerticalSize(30),
    backgroundColor: '#FF0005',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderRadius: Metrix.HorizontalSize(2),
    flexDirection: 'row',
  },

  liveCircle: {
    width: Metrix.HorizontalSize(5),
    height: Metrix.HorizontalSize(5),
    borderRadius: Metrix.HorizontalSize(100),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
  },

  countContainer: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },

  eyeIcon: {
    width: Metrix.HorizontalSize(18),
    height: Metrix.VerticalSize(18),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },

  viewersContainer: {
    marginTop: Metrix.VerticalSize(5),
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },

  userInitialText: {
    fontWeight: '600',
    color: Utills.selectedThemeColors().Base,
    fontSize: normalizeFont(13),
  },

  userNameText: {
    fontWeight: '700',
    color: Utills.selectedThemeColors().PrimaryTextColor,
    left: Metrix.HorizontalSize(8),
    fontSize: normalizeFont(14),
  },

  playBtn: {
    width: Metrix.HorizontalSize(30),
    height: Metrix.HorizontalSize(30),
    position: 'absolute',
    zIndex: 10,
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },

  fadeContainer: {
    position: 'absolute',
    top: Metrix.VerticalSize(82),
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },

  toastContainer: {
    position: 'absolute',
    top: Metrix.VerticalSize(100),
    left: 40,
    right: 40,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.VerticalSize(8),
    borderRadius: Metrix.HorizontalSize(8),
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },

  toastText: {
    color: '#000000',
    fontSize: Metrix.customFontSize(14),
    fontWeight: '600',
    textAlign: 'center',
  },

  multiLineToastContainer: {
    alignItems: 'center',
  },

  toastTextNormal: {
    color: '#000000',
    fontSize: Metrix.customFontSize(13),
    fontWeight: '500',
    textAlign: 'center',
  },

  toastTextBold: {
    color: '#000000',
    fontSize: Metrix.customFontSize(13),
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },

  modeSelectorContainer: {
    position: 'absolute',
    bottom: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});