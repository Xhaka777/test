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
import { CustomText, ModeSelector } from '../../../components';
import { deviceHeight, deviceWidth, normalizeFont } from '../../../config/metrix';
import { HomeAPIS } from '../../../services/home';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/reducers';
import RNFS from 'react-native-fs';
import { createThumbnail } from 'react-native-create-thumbnail';
import { HomeActions } from '../../../redux/actions';
import { useIsFocused } from '@react-navigation/native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Environments } from '../../../services/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const threatModes = [
  {
    id: '1',
    key: 'AUDIO',
    onPress: () => { },
  },
  {
    id: '2',
    key: 'VIDEO',
    onPress: () => { },
  },
];

export const LiveStream: React.FC<LiveStreamProps> = ({ }) => {
  const dispatch = useDispatch();
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

  const [eyeEarState, setEyeEarState] = useState('EYE'); // 'EYE' or 'EAR'
  const [preferenceState, setPreferenceState] = useState('A'); // 'A', 'AS', or 'MIC'
  const [toastMessage, setToastMessage] = useState(''); // New toast message state
  const [showToast, setShowToast] = useState(false); // New toast visibility state

  const [step, setStep] = useState(0);
  const [resource_id, setResource_id] = useState('');
  const [sid, setSid] = useState('');
  const [viewers, setViewers] = useState<any>([]);
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [hours, setHours] = useState(0);
  const [mode, setMode] = useState(threatModes[0]?.key || '');
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
  console.log('isThreatDetected', isThreatDetected);

  // ✅ NEW: Enhanced notification functions
  const showYellowNotification = useCallback((message: string) => {
    console.log('🟡 Starting yellow notification:', message);

    setPreferenceMsg(message);
    setIsModeText(true);

    // Reset animation to ensure clean start
    opacity.stopAnimation();
    opacity.setValue(0);

    // Start animation sequence
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(2000), // Keep visible for 2 seconds
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start((finished) => {
      if (finished) {
        console.log('🟡 Yellow notification animation completed');
        setPreferenceMsg('');
        setIsModeText(false);
      }
    });
  }, [opacity]);

  // ✅ NEW: Enhanced toast notification
  const showToastNotification = useCallback((message: string) => {
    console.log('⚪ Starting toast notification:', message);

    setToastMessage(message);
    setShowToast(true);

    // Auto-hide after 2.5 seconds
    setTimeout(() => {
      console.log('⚪ Hiding toast notification');
      setShowToast(false);
      setToastMessage('');
    }, 2500);
  }, []);

  const getEyeEarIcon = () => {
    switch (eyeEarState) {
      case 'EYE':
        return Images.EyeCircle;
      case 'EAR':
        return Images.Ear;
      default:
        return Images.EyeCircle;
    }
  };

  // Function to get A/A+S/Mic icon
  const getPreferenceIcon = () => {
    switch (preferenceState) {
      case 'A':
        return Images.Automatic;
      case 'AS':
        return Images.AutoAndManual;
      case 'MIC':
        return Images.NoMic;
      default:
        return Images.Automatic;
    }
  };

  useEffect(() => {
    // Preload the eye icon
    Image.prefetch(Image.resolveAssetSource(Images.EyeAbleIcon).uri);
  }, []);

  // ✅ UPDATED: Fixed headerOptions with proper notification handling
  const headerOptions = [
    mode == 'VIDEO' && {
      id: '1',
      key: 'Flashlight',
      icon: isFlashlight ? Images.FlashOn : Images.FlashOff,
      onPress: () => {
        setIsFlashlight(prev => !prev);
        engine?.setCameraTorchOn(!isFlashlight);
      },
    },
    {
      id: '2',
      key: 'Eye Ear Toggle',
      icon: getEyeEarIcon(),
      onPress: () => {
        console.log('👁️👂 Eye/Ear toggle pressed, current state:', eyeEarState);

        if (eyeEarState === 'EYE') {
          setEyeEarState('EAR');
          setMode('AUDIO');
          // ONLY show toast for Eye/Ear toggle
          showToastNotification('Recipients will get: Audio Stream');
        } else {
          setEyeEarState('EYE');
          setMode('VIDEO');
          // ONLY show toast for Eye/Ear toggle
          showToastNotification('Recipients will get: Video Stream');
        }
      },
    },
    {
      id: '3',
      key: 'Preference Toggle',
      icon: getPreferenceIcon(),
      onPress: () => {
        console.log('⚙️ Preference toggle pressed, current state:', preferenceState);

        if (preferenceState === 'A') {
          setPreferenceState('AS');

          // Show BOTH notifications with slight delay
          // showToastNotification('Stream activates via: Auto Detection+Safe Word');
          // setTimeout(() => {
          showYellowNotification('Monitoring for assault...');
          // }, 100); // Small delay to prevent conflicts

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

          // Show BOTH notifications with slight delay
          // showToastNotification('Stream activation: OFF');
          setTimeout(() => {
            showYellowNotification('Monitoring off...');
          }, 100);

        } else {
          setPreferenceState('A');

          // Show BOTH notifications with slight delay
          // showToastNotification('Stream activates via: Auto Detection');
          // setTimeout(() => {
          showYellowNotification('Monitoring for assault...');
          // }, 100);

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
  ].filter(Boolean);

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

  const startRecordingAPI = async (token: any) => {
    const body = {
      channel_name: state.channelId,
      recorder_uid: '316000',
      token: token,
    };
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
    try {
      HomeAPIS.postIncidents(body)
        .then(async res => {
          // console.log('Response Post incidents', res?.data);
          postMessage(token, res?.data?.id);
          setIncident_id(res?.data?.id);
        })
        .catch(err => {
          console.log('Err Post incidents', err.response?.data);
        });
    } catch (error) {
      // console.error('Error Agora Token ', error);
    }
  };

  const AgoraToken = async () => {
    const body = {
      uid: '0',
      channel_name: state.channelId,
      role: 'publisher',
    };
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
          // console.log('Err Agora Token', err.response?.data);
        });
    } catch (error) {
      // console.error('Error Agora Token ', error);
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

  const startAndStopStream = () => {
    if (isStreaming) {
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


  const renderMode = () => {
    return (
      <ModeSelector
        threatModes={threatModes}
        mode={mode}
        setMode={setMode}
        setModeMsg={setModeMsg}
        callback={() => {
          showYellowNotification
        }}
      />
    );
  };


  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={true} />
      <SafeAreaView style={{ flex: 1 }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerContainer}>
              <View style={styles.headerMainContainer}>
                <View style={styles.topLeftContainer}>
                  {headerOptions?.map((item: any) => {
                    return (
                      <TouchableOpacity
                        key={item?.id}
                        activeOpacity={0.7}
                        onPress={item?.onPress}
                        style={{ marginHorizontal: 3 }}>
                        <Image
                          source={item?.icon}
                          style={styles.headerIcons}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View
                  style={{
                    width: '40%',
                    alignItems: 'center',
                  }}>
                  <CustomText.MediumText
                    customStyle={[
                      styles.timerText,
                      {
                        backgroundColor: isStreaming
                          ? '#FF0005'
                          : Utills.selectedThemeColors().Transparent,
                      },
                    ]}>
                    {isStreaming
                      ? `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(
                        seconds,
                      )}`
                      : '00:00:00'}
                  </CustomText.MediumText>
                </View>
                <View
                  style={{
                    width: '30%',
                    alignItems: 'flex-end',
                  }}></View>
              </View>

              <Animated.View style={[styles.fadeContainer, { opacity }]}>
                <CustomText.SmallText
                  customStyle={{ color: '#FDD128', textAlign: 'center' }}>
                  {modeMsg}
                </CustomText.SmallText>
                <CustomText.SmallText
                  customStyle={{ color: '#FDD128', textAlign: 'center' }}>
                  {preferenceMsg}
                </CustomText.SmallText>
              </Animated.View>
              {/* ✅ NEW: White Toast Notification */}
              {showToast && (
                <View style={styles.toastContainer}>
                  <CustomText.SmallText customStyle={styles.toastText}>
                    {toastMessage}
                  </CustomText.SmallText>
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              {mode == 'AUDIO' ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Image
                    source={Images.Audio}
                    style={{
                      width: Metrix.HorizontalSize(120),
                      height: Metrix.VerticalSize(120),
                      tintColor: Utills.selectedThemeColors().PrimaryTextColor,
                      marginLeft: Metrix.HorizontalSize(25),
                    }}
                    resizeMode="contain"
                  />
                  {!isStreaming && renderMode()}
                </View>
              ) : (
                <>
                  {renderUsers()}
                  {isStreaming && renderViewers()}

                  <View style={[
                    styles.zoomControls,
                    {
                      bottom: isStreaming ? '19%' : '24%'
                    }
                  ]}
                  >
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
                          {zoom === 0.5 ? '0.5x' : zoom === 1 ? '1×' : `${zoom}×`}
                        </CustomText.RegularText>

                      </TouchableOpacity>
                    ))}
                  </View>
                  {!isStreaming && renderMode()}
                </>
              )}
            </View>

            <View style={styles.bottomContainer}>
              <View style={styles.blankView}></View>
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

              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Utills.selectedThemeColors().SecondaryTextColor,
                  borderRadius: Metrix.HorizontalSize(7),
                  marginBottom: Metrix.VerticalSize(29)
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
            </View>
          </View>
        </GestureHandlerRootView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    zIndex: 99,
    top: '0%',
    width: '100%',
    backgroundColor: '#00000080',
    paddingHorizontal: Metrix.HorizontalSize(12),
    paddingBottom: Metrix.HorizontalSize(10),
    paddingTop: Metrix.HorizontalSize(10),
    justifyContent: 'space-between',
  },
  headerMainContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frontCamWrapper: {
    position: 'absolute',
    top: '19%',
    left: '4%',
    width: '30%',
    borderRadius: Metrix.HorizontalSize(5),
    backgroundColor: 'black', // Same background as camera
    overflow: 'visible', // Allow live indicator to extend beyond
  },
  frontCamPreview: {
    height: Metrix.VerticalSize(150), // Keep original height
    width: '100%',
    borderRadius: Metrix.HorizontalSize(5),
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  topLeftContainer: {
    flexDirection: 'row',
    width: '30%',
  },
  headerIcons: {
    width: Metrix.HorizontalSize(29),
    height: Metrix.HorizontalSize(29),
    borderRadius: Metrix.HorizontalSize(100),
    borderWidth: 1,
    borderColor: 'white',
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    zIndex: 99,
    bottom: '0%',
    paddingHorizontal: Metrix.HorizontalSize(40),
  },
  blankView: {
    width: Metrix.HorizontalSize(60),
    height: Metrix.VerticalSize(60),
    borderRadius: Metrix.HorizontalSize(100),
  },
  livestreamText: {
    paddingVertical: Metrix.VerticalSize(10),
    fontWeight: '700',
  },
  footageImg: {
    width: Metrix.HorizontalSize(60),
    height: Metrix.VerticalSize(60),
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
  },
  innerLiveStreamButton: {
    width: Metrix.HorizontalSize(65),
    height: Metrix.HorizontalSize(65),
    borderRadius: Metrix.VerticalSize(100),
    borderWidth: 2.5,
    borderColor: Utills.selectedThemeColors().Base,
    backgroundColor: Utills.selectedThemeColors().Red,
  },
  zoomControls: {
    position: 'absolute',
    // bottom: '24%', //24%
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '35%',
    alignItems: 'center',
    borderRadius: Metrix.HorizontalSize(100),
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black background
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
  timerText: {
    fontSize: normalizeFont(18),
    paddingHorizontal: Metrix.HorizontalSize(8),
    borderRadius: Metrix.HorizontalSize(3),
    lineHeight: 30,
    overflow: 'hidden',
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  circle: {
    backgroundColor: 'red',
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
    bottom: -Metrix.VerticalSize(40), // Position below the camera
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Utills.selectedThemeColors().Base,
    padding: Metrix.HorizontalSize(2),
    borderRadius: Metrix.HorizontalSize(2),
    borderTopWidth: 0, // Remove top border to connect with camera
    // borderTopLeftRadius: 0, // Connect top corners with camera
    // borderTopRightRadius: 0,
    marginTop: Metrix.VerticalSize(6)
  },

  liveContainer: {
    width: '50%',
    height: Metrix.VerticalSize(30),
    // backgroundColor: Utills.selectedThemeColors().Red,
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
    tintColor: Utills.selectedThemeColors().PrimaryTextColor, // Add tint for consistency

  },
  blurView: {
    width: deviceWidth,
    height: deviceHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'absolute',
  },
  tooltipContent: {
    color: Utills.selectedThemeColors().Base,
    textAlign: 'center',
    fontSize: Metrix.customFontSize(13),
    fontWeight: '500',
  },
  nextTouchable: {
    marginTop: Metrix.VerticalSize(8),
    alignSelf: 'flex-end',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ✅ NEW: Toast notification styles
  toastContainer: {
    position: 'absolute',
    top: Metrix.VerticalSize(82), // Under the timer (00:00:00)
    left: 40, // 5px margin from left
    right: 40, // 5px margin from right
    backgroundColor: '#FFFFFF', // White background
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
    color: '#000000', // Black text on white background
    fontSize: Metrix.customFontSize(12),
    fontWeight: '600',
    textAlign: 'center',
  },
});