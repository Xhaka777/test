import React, {useCallback, useEffect, useRef, useState} from 'react';
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
import {askMediaAccess} from '../../../config/utills/permissions';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  PermissionsAndroid,
  Animated,
} from 'react-native';
import {
  FontType,
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import {LiveStreamProps} from '../../propTypes';
import {CustomText, RoundImageContainer} from '../../../components';
import {deviceHeight, deviceWidth, normalizeFont} from '../../../config/metrix';
import {HomeAPIS} from '../../../services/home';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/reducers';
import {BlurView} from '@react-native-community/blur';
import RNFS from 'react-native-fs';
import Tooltip from 'react-native-walkthrough-tooltip';
import {createThumbnail} from 'react-native-create-thumbnail';

export const LiveStream: React.FC<LiveStreamProps> = ({}) => {
  const userDetails = useSelector((state: RootState) => state.home.userDetails);
  const formattedUid = userDetails?.user?.phone_number?.replace('+92', '');

  const [engine, setEngine] = useState<IRtcEngineEx | undefined>(undefined);
  const [startPreview, setStartPreview] = useState(false);
  const [joinChannelSuccess, setJoinChannelSuccess] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [startSecondCamera, setStartSecondCamera] = useState(false);
  const [publishSecondCamera, setPublishSecondCamera] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [state, setState] = useState({
    appId: Config.appId,
    enableVideo: true,
    channelId: Config.channelId,
    token: Config.token,
    uid: Config.uid,
    token2: Config.token,
    uid2: 99,
    // storagePath: '../../../assets/',
    storagePath: `${
      Platform.OS === 'android'
        ? RNFS.ExternalCachesDirectoryPath
        : RNFS.DocumentDirectoryPath
    }`,
    storagePath2: `${
      Platform.OS === 'android'
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
  const [viewers, setViewers] = useState<any>([]);
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [hours, setHours] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFlashlight, setIsFlashlight] = useState(false);
  const [isCircle, setIsCircle] = useState(true);
  const [isBlur, setIsBlur] = useState(false);
  const [walkthroughSteps, setWalkthroughSteps] = useState(0);
  const [recorder, setRecorder] = useState<any | null>(null);
  const [recorder2, setRecorder2] = useState<any | null>(null);
  const sizeAnim = useRef(new Animated.Value(70)).current;
  const borderRadiusAnim = useRef(new Animated.Value(50)).current;

  const userCordinates = useSelector(
    (state: RootState) => state.home.userLocation,
  );

  // console.log('Recorder====Recorder2====', recorder, recorder2);

  const headerOptions = [
    {
      id: '1',
      key: 'Flashlight',
      icon: isFlashlight ? Images.FlashOn : Images.FlashOff,
      step: 0,
      description: 'Enable or disable the flashlight from here',
      onPress: () => {
        setIsFlashlight(prev => !prev);
        engine?.setCameraTorchOn(!isFlashlight);
      },
    },
    {
      id: '2',
      key: 'Blur',
      icon: Images.Blur,
      step: 1,
      description: 'Apply blur or unblur effect from here',
      onPress: () => {
        setIsBlur(prev => !prev);
      },
    },
    {
      id: '3',
      key: 'Dual Cam',
      icon: Images.DualCam,
      step: 2,
      description: 'Enable or disable front camera view',
      onPress: () => {
        if (isStreaming) {
          if (startSecondCamera) {
            unpublishSecondCamera();
          } else {
            startSecondCameraCapture();
            publishSecondCameraToStream(state.token2);
          }
        } else {
          if (startSecondCamera) {
            stopSecondCameraCapture();
          } else {
            startSecondCameraCapture();
          }
        }
      },
    },
  ];

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

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permission to access gallery',
          message: 'We need your permission to show your gallery images',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
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
      setLastImage({
        video: lastVideoFile,
        thumbnail: thumbnail.path,
      });
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
    fetchLastFootage();
  }, []);

  useEffect(() => {
    initRtcEngine().then(() => {
      startSecondCameraCapture();
    });
    return () => {
      releaseRtcEngine();
    };
  }, []);

  const postMessage = async (token: any, incidentId: any) => {
    try {
      HomeAPIS.postMsg({
        stream_token: token,
        lat: userCordinates?.latitude,
        lng: userCordinates?.longitude,
      })
        .then(async res => {
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
          const dummyViewers = [
            {id: '1', name: 'Mohit Nigga', color: '#AFE1AF'},
            {id: '2', name: 'Mohit Nigga', color: '#ADD8E6'},
            {id: '3', name: 'Mohit Nigga', color: '#FFFFC5'},
          ];
          setViewers((prevViewers: any) => [...prevViewers, ...dummyViewers]);
        })
        .catch(err => {
          // console.log('Err alert msg send', err.response?.data);
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
    const {appId} = state;
    if (!appId) {
      console.error('appId is invalid');
      return;
    }
    const agoraEngine = createAgoraRtcEngine() as IRtcEngineEx;
    agoraEngine.initialize({
      appId,
      logConfig: {filePath: Config.logFilePath},
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
        console.log('Recorder Info Updated', channelId, uid, info);
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
        console.log('Recorder Info Updated Front', channelId, uid, info);
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
    setStartPreview(true);
    agoraEngine?.enableMultiCamera(true, {cameraDirection: 0});
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
    const {channelId, token, uid} = state;
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
    const {channelId, uid2, uid} = state;
    setIsStreaming(false);
    setIsFlashlight(false);
    engine?.setCameraTorchOn(false);
    engine?.leaveChannelEx({channelId, localUid: uid});
    engine?.leaveChannelEx({channelId, localUid: uid2});
    await test();
    engine?.enableVideo();
    engine?.startPreview();
    setStartPreview(true);
    engine?.enableMultiCamera(true, {cameraDirection: 1});
    engine?.startCameraCapture(VideoSourceType.VideoSourceCameraSecondary, {
      cameraDirection: 1,
    });
    engine?.startPreview(VideoSourceType.VideoSourceCameraSecondary);
    setStartSecondCamera(true);
  };

  const startSecondCameraCapture = async () => {
    if (startSecondCamera) return;
    engine?.switchCamera();
    engine?.enableMultiCamera(true, {cameraDirection: 0});
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
    const {channelId, token2, uid2} = state;
    if (!channelId || uid2 <= 0) {
      console.error('channelId or uid2 is invalid');
      return;
    }

    engine?.joinChannelEx(
      agora_token,
      {channelId, localUid: uid2},
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
    const {channelId, uid2} = state;
    engine?.leaveChannelEx({channelId, localUid: uid2});
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
      stopRecording();
      stopRecording2();
    } else {
      AgoraToken();
    }
  };

  const startRecording = useCallback(
    (incidentId: any) => {
      let uid = Math.floor(10 + Math.random() * 90);
      console.log('Running Start Recording 1', uid);
      recorder?.startRecording({
        storagePath: `${state.storagePath}/${uid}-${incidentId}.mp4`,
        containerFormat: state.containerFormat,
        streamType: state.streamType,
        maxDurationMs: state.maxDurationMs,
        recorderInfoUpdateInterval: state.recorderInfoUpdateInterval,
      });
      setState(prev => ({...prev, startRecording: true}));
    },
    [recorder, state],
  );

  const startRecording2 = useCallback(
    (incidentId: any) => {
      let uid = Math.floor(10 + Math.random() * 90);
      console.log('Running Start Recording 2', uid);
      recorder2?.startRecording({
        storagePath: `${state.storagePath2}/${uid}-${incidentId}.mp4`,
        containerFormat: state.containerFormat,
        streamType: state.streamType2,
        maxDurationMs: state.maxDurationMs,
        recorderInfoUpdateInterval: state.recorderInfoUpdateInterval,
      });
      setState(prev => ({...prev, startRecording: true}));
    },
    [recorder2, state],
  );

  /**
   * Step 3-3: Stop Recording
   */
  const stopRecording = useCallback(() => {
    console.log('Running Stop Recording');
    recorder?.stopRecording();
    setState(prev => ({...prev, startRecording: false}));
  }, [recorder]);

  const stopRecording2 = useCallback(() => {
    console.log('Running Stop Recording Front');
    recorder2?.stopRecording();
    setState(prev => ({...prev, startRecording: false}));
  }, [recorder2]);

  const renderUsers = () => (
    <View style={{flex: 1, backgroundColor: Utills.selectedThemeColors().Base}}>
      {startPreview && (
        <RtcSurfaceView
          style={{flex: 1, width: '100%'}}
          canvas={{
            uid: 0,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
      )}

      {startSecondCamera ? (
        <>
          <RtcSurfaceView
            style={styles.frontCamPreview}
            canvas={{
              uid: 0,
              sourceType: VideoSourceType.VideoSourceCameraSecondary,
              renderMode: RenderModeType.RenderModeHidden,
            }}
          />
        </>
      ) : (
        <View style={styles.frontCamPreview}></View>
      )}
    </View>
  );

  const renderViewers = () => {
    return (
      <View style={styles.viewerContainer}>
        <View style={styles.liveContainer}>
          <View style={styles.liveCircle}></View>
          <CustomText.MediumText customStyle={{fontWeight: '700'}}>
            Live
          </CustomText.MediumText>
        </View>

        {viewers?.map((item: any) => {
          return (
            <View
              key={item?.id}
              style={[styles.circularContact, {backgroundColor: item?.color}]}>
              <CustomText.RegularText customStyle={styles.userInitialText}>
                {extractInitials(item?.name)}
              </CustomText.RegularText>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      <View style={styles.headerContainer}>
        <View style={styles.topLeftContainer}>
          {headerOptions?.map((item: any) => {
            return (
              // <Tooltip
              //   isVisible={walkthroughSteps === item?.step}
              //   allowChildInteraction={false}
              //   closeOnContentInteraction={false}
              //   placement="bottom"
              //   onClose={() => setWalkthroughSteps(walkthroughSteps + 1)}
              //   content={
              //     <View>
              //       <CustomText.SmallText customStyle={styles.tooltipContent}>
              //         {item?.description}
              //       </CustomText.SmallText>
              //       <TouchableOpacity
              //         onPress={() => {
              //           setWalkthroughSteps(walkthroughSteps + 1);
              //         }}
              //         activeOpacity={0.9}
              //         style={styles.nextTouchable}>
              //         <CustomText.RegularText customStyle={styles.nextTxt}>
              //           Next
              //         </CustomText.RegularText>
              //       </TouchableOpacity>
              //     </View>
              //   }>
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
                  styles={{padding: item?.id == '1' ? 0 : 3}}
                  borderColor={item?.id == '2' ? 'white' : 'white'}
                  source={item?.icon}
                />
              </TouchableOpacity>
              // </Tooltip>
            );
          })}
        </View>
        <View>
          <CustomText.MediumText
            customStyle={[
              styles.timerText,
              {
                backgroundColor: isStreaming
                  ? Utills.selectedThemeColors().Red
                  : 'transparent',
              },
            ]}>
            {isStreaming
              ? `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(
                  seconds,
                )}`
              : '00:00:00'}
          </CustomText.MediumText>
        </View>
        <View style={{width: '28%', alignItems: 'flex-end'}}></View>
      </View>

      <View style={{flex: 1}}>
        {renderUsers()}
        {isStreaming && renderViewers()}

        <View style={styles.zoomControls}>
          {[1, 2, 3].map((zoom, index) => (
            <TouchableOpacity
              key={index?.toString()}
              onPress={() => adjustZoom(zoom)}
              style={
                zoom === zoomLevel ? styles.activeZoomButton : styles.zoomButton
              }>
              <CustomText.RegularText
                customStyle={{
                  fontWeight: '700',
                  fontSize:
                    zoom === zoomLevel
                      ? FontType.FontMedium
                      : FontType.FontSmall,
                  color:
                    zoom === zoomLevel
                      ? '#FFC000'
                      : Utills.selectedThemeColors().PrimaryTextColor,
                }}>
                {zoom}
                {zoom === zoomLevel ? 'x' : ''}
              </CustomText.RegularText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {isBlur && (
        <BlurView style={styles.blurView} blurType={'light'} blurAmount={6} />
      )}

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
                    : 'transparent',
                },
              ]}></Animated.View>
          </TouchableOpacity>
          <CustomText.RegularText customStyle={styles.livestreamText}>
            {isStreaming ? 'STREAMING' : 'LIVESTREAM'}
          </CustomText.RegularText>
        </View>
        <TouchableOpacity
          style={{alignItems: 'center', justifyContent: 'center'}}
          onPress={() => {
            NavigationService.navigate(RouteNames.HomeRoutes.Footages);
          }}>
          <Image
            source={Images.PlayBtn}
            resizeMode={'cover'}
            style={styles.playBtn}
          />
          <Image
            source={{uri: lastImage?.thumbnail}}
            style={styles.footageImg}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Metrix.HorizontalSize(10),
    paddingBottom: Metrix.HorizontalSize(10),
    paddingTop: Metrix.HorizontalSize(45),
    justifyContent: 'space-between',
  },
  frontCamPreview: {
    height: Metrix.VerticalSize(150),
    borderRadius: Metrix.HorizontalSize(10),
    width: '30%',
    backgroundColor: 'black',
    position: 'absolute',
    top: '14%',
    left: '4%',
    overflow: 'hidden',
  },
  topLeftContainer: {
    flexDirection: 'row',
    width: '30%',
    justifyContent: 'space-between',
  },

  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#00000080',
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
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    borderRadius: Metrix.HorizontalSize(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    marginTop: Metrix.VerticalSize(-7),
  },
  liveStreamButton: {
    marginTop: Metrix.VerticalSize(10),
    alignSelf: 'center',
    width: Metrix.HorizontalSize(72),
    height: Metrix.HorizontalSize(72),
    borderRadius: Metrix.VerticalSize(100),
    backgroundColor: 'transparent',
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
    bottom: '20%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '35%',
    alignItems: 'center',
    borderRadius: Metrix.HorizontalSize(100),
    backgroundColor: '#00000050',
  },
  zoomButton: {
    backgroundColor: '#141414',
    borderRadius: Metrix.HorizontalSize(100),
    width: Metrix.HorizontalSize(26),
    height: Metrix.HorizontalSize(26),
    padding: Metrix.HorizontalSize(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeZoomButton: {
    backgroundColor: '#141414',
    borderRadius: Metrix.HorizontalSize(100),
    width: Metrix.HorizontalSize(36),
    height: Metrix.HorizontalSize(36),
    padding: Metrix.HorizontalSize(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: 'white',
    fontSize: 16,
  },
  timerText: {
    fontSize: normalizeFont(18),
    paddingHorizontal: Metrix.HorizontalSize(5),
    borderRadius: Metrix.HorizontalSize(3),
    lineHeight: 30,
    overflow: 'hidden',
  },
  circle: {
    backgroundColor: 'red',
  },
  viewerContainer: {
    top: '37%',
    left: '4%',
    position: 'absolute',
    borderColor: 'red',
    zIndex: 99,
    paddingVertical: Metrix.HorizontalSize(10),
    justifyContent: 'center',
    width: '30%',
  },
  liveContainer: {
    width: '100%',
    height: Metrix.VerticalSize(30),
    marginBottom: Metrix.VerticalSize(30),
    backgroundColor: Utills.selectedThemeColors().Red,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Metrix.HorizontalSize(5),
    flexDirection: 'row',
  },
  liveCircle: {
    width: Metrix.HorizontalSize(6),
    height: Metrix.HorizontalSize(6),
    borderRadius: Metrix.HorizontalSize(100),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    right: Metrix.HorizontalSize(5),
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
  nextTxt: {
    color: Utills.selectedThemeColors().Success,
    fontWeight: '700',
  },
  userInitialText: {
    fontWeight: '600',
    color: Utills.selectedThemeColors().Base,
  },
  playBtn: {
    width: Metrix.HorizontalSize(30),
    height: Metrix.HorizontalSize(30),
    position: 'absolute',
    zIndex: 10,
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
});
