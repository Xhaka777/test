// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState, useRef} from 'react';
// import {
//   Alert,
//   Dimensions,
//   PermissionsAndroid,
//   Platform,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import RtcEngine, {
//   RtcLocalView,
//   VideoRenderMode,
//   ClientRole,
//   ChannelProfile,
// } from 'react-native-agora';
// import {Camera, useCameraDevices} from 'react-native-vision-camera';
// import requestCameraAndAudioPermission from '../../../components/Permission';
// import {LiveStreamProps} from '../../propTypes';
// import {FontType, Images, Metrix, Utills} from '../../../config';
// import {Image} from 'react-native';
// import {HomeAPIS} from '../../../services/home';
// import {useRoute, useIsFocused} from '@react-navigation/native';
// import {CustomText, RoundImageContainer} from '../../../components';
// import {normalizeFont} from '../../../config/metrix';
// import {CameraRoll} from '@react-native-camera-roll/camera-roll';
// import ImageCropPicker from 'react-native-image-crop-picker';
// import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
// import Torch from 'react-native-torch';

// const dimensions = {
//   width: Dimensions.get('window').width,
//   height: Dimensions.get('window').height,
// };

// const appId = '175b7fd1a2fa440fbf7c84c5a02d8add';
// const channelName = 'stream';

// export const LiveStream: React.FC<LiveStreamProps> = ({}) => {
//   const route = useRoute();
//   const isFocused = useIsFocused(); // Hook to track if the screen is focused
//   const {triggerFunction} = route.params || {};
//   // const [isStarted, setIsStarted] = useState(triggerFunction);
//   const [isCameraInitialized, setIsCameraInitialized] = useState(false);
//   const [currentCam, setcurrentCam] = useState('back');
//   const [token, setToken] = useState('');
//   const cameraRef = useRef(null);
//   const devices = useCameraDevices();
//   // const device = devices.back;
//   // const device = currentCam === 'back' ? devices.back : devices.front;
//   const device = devices.back;
//   const [isHost, setIsHost] = useState(true);
//   const [joinSucceed, setJoinSucceed] = useState(false);
//   const [peerIds, setPeerIds] = useState([]);
//   const frontDevice = devices.front; // Front camera for preview
//   const [zoomLevel, setZoomLevel] = useState(1); // Track zoom level
//   const [isMuted, setIsMuted] = useState(false); // Track microphone state
//   const engine = useRef<RtcEngine | null>(null); // Use useRef for engine
//   const [lastImage, setLastImage] = useState<any>(null);
//   const [viewers, setViewers] = useState<any>([]);
//   const [seconds, setSeconds] = useState(0);
//   const [minutes, setMinutes] = useState(0);
//   const [hours, setHours] = useState(0);
//   const [isStreaming, setIsStreaming] = useState(false); // To track stream status
//   const [flashlightOn, setFlashlightOn] = useState(false);

//   console.log('currentCam', token);

//   const stopCamera = () => {
//     if (cameraRef.current) {
//       // cameraRef.current.stopRecording(); // Stopping the camera
//       console.log('Camera stopped');
//     }
//   };

//   const onInitialized = () => {
//     setIsCameraInitialized(true);
//   };

//   const switchCam = () => {
//     setcurrentCam(currentCam === 'back' ? 'front' : 'back');
//   };

//   const extractInitials = (text: string) => {
//     // Split the name into parts based on spaces
//     const parts = text.split(' ');
//     // Extract the first letter of each part
//     const firstLetters = parts.map(part => part.charAt(0));
//     // Join the first letters into a single string
//     const result = firstLetters.join('');
//     return result;
//   };

//   const requestPermissions = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
//         {
//           title: 'Permission to access gallery',
//           message: 'We need your permission to show your gallery images',
//           buttonNeutral: 'Ask Me Later',
//           buttonNegative: 'Cancel',
//           buttonPositive: 'OK',
//         },
//       );
//       return granted === PermissionsAndroid.RESULTS.GRANTED;
//     }
//     return true;
//   };

//   const openGallery = () => {
//     ImageCropPicker.openPicker({
//       multiple: true,
//       mediaType: 'photo',
//     })
//       .then(images => {
//         console.log(images);
//       })
//       .catch(err => {
//         console.log('Gallery Error', err);
//       });
//   };

//   const fetchLastImage = async () => {
//     const hasPermission = await requestPermissions();
//     if (!hasPermission) return;

//     CameraRoll.getPhotos({
//       first: 1,
//       assetType: 'Photos',
//     })
//       .then(r => {
//         setLastImage(r.edges[0].node.image.uri);
//       })
//       .catch(err => {
//         console.error(err);
//       });
//   };

//   useEffect(() => {
//     let interval = null;

//     if (isStreaming) {
//       // Start the timer
//       interval = setInterval(() => {
//         setSeconds(prevSeconds => {
//           if (prevSeconds === 59) {
//             setMinutes(prevMinutes => {
//               if (prevMinutes === 59) {
//                 setHours(prevHours => prevHours + 1);
//                 return 0;
//               }
//               return prevMinutes + 1;
//             });
//             return 0;
//           }
//           return prevSeconds + 1;
//         });
//       }, 1000);
//     } else if (!isStreaming && seconds !== 0) {
//       // Clear the timer when the stream stops
//       clearInterval(interval);
//     }

//     return () => clearInterval(interval);
//   }, [isStreaming, seconds]);

//   // Format the timer as HH:MM:SS
//   const formatTime = unit => (unit < 10 ? `0${unit}` : unit);

//   useEffect(() => {
//     fetchLastImage();
//   }, []);

//   const postMessage = async (token: any) => {
//     try {
//       HomeAPIS.postMsg({stream_token: token})
//         .then(async res => {
//           console.log('Res Post message', res?.data?.results);
//           setIsStreaming(!isStreaming); // Toggle stream status
//           if (!isStreaming) {
//             setSeconds(0);
//             setMinutes(0);
//             setHours(0);
//           }
//           if (engine.current) {
//             await engine.current.switchCamera();
//             await engine.current.joinChannel(token, channelName, null, 0);
//             if (flashlightOn) {
//               Torch.switchState(true);
//             }
//           }

//           setViewers(res?.data?.results); // Assuming setViewers is a state setter

//           const dummyViewers = [
//             {id: '1', name: 'Mohit Nigga'},
//             {id: '2', name: 'Mohit Nigga'},
//             {id: '3', name: 'Mohit Nigga'},
//           ];

//           // Update viewers by appending dummy viewers to the current viewers state
//           setViewers((prevViewers: any) => [...prevViewers, ...dummyViewers]);

//           console.log(res?.data?.results);
//         })
//         .catch(err => {
//           console.log('Err Otp', err.response?.data);
//         });
//     } catch (error) {
//       console.error('Error post message ', error);
//     }
//   };

//   const AgoraToken = async () => {
//     const body = {
//       uid: '0',
//       channel_name: channelName,
//       role: 'publisher',
//     };
//     try {
//       HomeAPIS.getAgoraToken(body)
//         .then(async res => {
//           console.log('Res Agora Token', res?.data);
//           setToken(res?.data?.token);
//           postMessage(res?.data?.token);
//         })
//         .catch(err => {
//           console.log('Err Agora Token', err.response?.data);
//         });
//     } catch (error) {
//       console.error('Error Agora Token ', error);
//     }
//   };

//   const myFunction = () => {
//     Utills.showToast('Working Perfectly fine');
//   };

//   useEffect(() => {
//     if (Platform.OS === 'android') {
//       requestCameraAndAudioPermission().then(() => {
//         console.log('Permissions requested!');
//       });
//     }
//     init();

//     return () => {
//       if (engine.current) {
//         engine.current.removeAllListeners();
//         engine.current.destroy();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (triggerFunction) {
//       // myFunction();
//       // startCall();
//     }
//   }, [isFocused]);

//   // Handle camera stop when tab is not focused
//   useEffect(() => {
//     if (!isFocused) {
//       stopCamera(); // Stop camera when tab is unfocused
//     }
//   }, [isFocused]);

//   const init = async () => {
//     engine.current = await RtcEngine.create(appId);
//     await engine.current.enableVideo();
//     await engine.current.setChannelProfile(ChannelProfile.LiveBroadcasting);
//     await engine.current.setClientRole(
//       isHost ? ClientRole.Broadcaster : ClientRole.Audience,
//     );

//     engine.current.addListener('Warning', warn => {
//       console.log('Warning', warn);
//     });

//     engine.current.addListener('Error', err => {
//       console.log('Error', err);
//     });

//     engine.current.addListener('UserJoined', (uid, elapsed) => {
//       console.log('UserJoined', uid, elapsed);
//       if (peerIds.indexOf(uid) === -1) {
//         setPeerIds(prevPeerIds => [...prevPeerIds, uid]);
//       }
//     });

//     engine.current.addListener('UserOffline', (uid, reason) => {
//       console.log('UserOffline', uid, reason);
//       setPeerIds(prevPeerIds => prevPeerIds.filter(id => id !== uid));
//     });

//     engine.current.addListener(
//       'JoinChannelSuccess',
//       (channel, uid, elapsed) => {
//         console.log('JoinChannelSuccess', channel, uid, elapsed);
//         setJoinSucceed(true);
//       },
//     );
//   };

//   const toggleRoll = async () => {
//     if (engine.current) {
//       setIsHost(prevIsHost => !prevIsHost);
//       await engine.current.setClientRole(
//         !isHost ? ClientRole.Broadcaster : ClientRole.Audience,
//       );
//     }
//   };

//   const toggleCamera = async () => {
//     if (engine.current) {
//       await engine.current.switchCamera();
//     }
//   };

//   const toggleMic = async () => {
//     try {
//       if (isMuted) {
//         await engine?.current?.muteLocalAudioStream(false);
//         setIsMuted(false);
//         console.log('Microphone is unmuted');
//       } else {
//         await engine?.current?.muteLocalAudioStream(true);
//         setIsMuted(true);
//         console.log('Microphone is muted');
//       }
//     } catch (error) {
//       console.error('Error toggling microphone: ', error);
//     }
//   };

//   const toggleFlashlight = async () => {
//     // Check and request camera permission
//     if (Platform.OS == 'android') {
//       const cameraPermission = await check(PERMISSIONS.ANDROID.CAMERA); // for Android
//       if (cameraPermission !== RESULTS.GRANTED) {
//         const result = await request(PERMISSIONS.ANDROID.CAMERA); // Request permission if not granted
//         if (result !== RESULTS.GRANTED) {
//           Alert.alert(
//             'Permission denied',
//             'Camera access is required to use the flashlight.',
//           );
//           return;
//         }
//       }
//     }

//     setFlashlightOn(!flashlightOn);
//     Torch.switchState(!flashlightOn);
//     // Toggle flashlight state
//   };

//   const adjustZoom = async (zoom: number) => {
//     if (engine.current) {
//       setZoomLevel(zoom);
//       await engine.current.setCameraZoomFactor(zoom);
//     }
//   };

//   const startCall = async () => {
//     AgoraToken();
//   };

//   const endCall = async () => {
//     if (engine.current) {
//       await engine.current.leaveChannel();
//       setPeerIds([]);
//       setJoinSucceed(false);
//       setcurrentCam('back');
//       setIsStreaming(false);
//       // setIsStarted(undefined);
//     }
//   };

//   const renderVideos = () => {
//     return (
//       <View style={styles.fullView}>
//         {renderHeader()}
//         {renderCamView()}
//         {renderViewers()}
//         {isHost && (
//           <RtcLocalView.SurfaceView
//             style={styles.max}
//             channelId={channelName}
//             renderMode={VideoRenderMode.Hidden}
//           />
//         )}
//         {renderRemoteVideos()}
//       </View>
//     );
//   };

//   const renderCamView = () => {
//     return (
//       <View style={[styles.camView, {top: '13%', zIndex: 1000}]}>
//         {/* Front Camera Preview Window  After Live Stream View*/}
//         <View style={styles.previewWindow}>
//           {/* <Camera
//             style={styles.previewCamera}
//             device={frontDevice}
//             isActive={isFocused} // Only active if the screen is focused
//           /> */}
//         </View>

//         <View style={styles.liveContainer}>
//           <View style={styles.liveCircle}></View>
//           <CustomText.MediumText customStyle={{fontWeight: '700'}}>
//             Live
//           </CustomText.MediumText>
//         </View>
//       </View>
//     );
//   };

//   const renderViewers = () => {
//     return (
//       <View style={styles.viewerContainer}>
//         {viewers?.map((item: any) => {
//           return (
//             <View style={styles.circularContact}>
//               <CustomText.RegularText customStyle={{fontWeight: '600'}}>
//                 {extractInitials(item?.name)}
//               </CustomText.RegularText>
//             </View>
//           );
//         })}
//       </View>
//     );
//   };

//   const renderHeader = () => {
//     return (
//       <View style={styles.streamHeader}>
//         <View style={styles.topLeftContainer}>
//           <TouchableOpacity onPress={toggleFlashlight}>
//             <RoundImageContainer
//               styles={{padding: 2}}
//               borderColor="white"
//               borderWidth={1.4}
//               backgroundColor="transparent"
//               circleWidth={28}
//               source={flashlightOn ? Images.FlashOn : Images.FlashOff}
//             />
//           </TouchableOpacity>
//           <TouchableOpacity>
//             <RoundImageContainer
//               imageStyle={{
//                 tintColor: Utills.selectedThemeColors().PrimaryTextColor,
//               }}
//               backgroundColor="transparent"
//               borderColor="transparent"
//               circleWidth={28}
//               source={Images.Location}
//             />
//           </TouchableOpacity>
//           <TouchableOpacity>
//             <RoundImageContainer
//               imageStyle={{
//                 tintColor: Utills.selectedThemeColors().PrimaryTextColor,
//               }}
//               styles={{padding: 2}}
//               borderColor="white"
//               borderWidth={1.4}
//               backgroundColor="transparent"
//               circleWidth={28}
//               source={Images.DualCam}
//             />
//           </TouchableOpacity>
//         </View>
//         <View
//           style={{
//             borderWidth: 1,
//             borderColor: 'red',
//             backgroundColor: Utills.selectedThemeColors().Red,
//             paddingHorizontal: Metrix.HorizontalSize(5),
//             borderRadius: 3,
//           }}>
//           {isStreaming && (
//             <CustomText.MediumText customStyle={{fontSize: normalizeFont(18)}}>
//               {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
//             </CustomText.MediumText>
//           )}
//         </View>
//         <View
//           style={{
//             width: '28%',
//             alignItems: 'flex-end',
//             // borderWidth:1,borderColor:"red"
//           }}>
//           {/* <RoundImageContainer
//             imageStyle={{
//               tintColor: Utills.selectedThemeColors().PrimaryTextColor,
//             }}
//             backgroundColor="transparent"
//             circleWidth={26}
//             source={Images.Profile}
//           /> */}
//         </View>
//       </View>
//     );
//   };

//   const renderRemoteVideos = () => {
//     return (
//       <View style={styles.remoteContainer}>
//         <View
//           style={{
//             alignSelf: 'center',
//             flexDirection: 'row',
//             justifyContent: 'space-around',
//             alignItems: 'center',
//             width: '35%',
//             bottom: '3%',
//             borderRadius: Metrix.HorizontalSize(100),
//             backgroundColor: '#00000050',
//           }}>
//           {[1, 2, 3].map((zoom, index) => (
//             <TouchableOpacity
//               key={index}
//               onPress={() => adjustZoom(zoom)}
//               style={
//                 zoom === zoomLevel ? styles.activeZoomButton : styles.zoomButton
//               }>
//               <CustomText.RegularText
//                 customStyle={{
//                   fontWeight: '700',
//                   fontSize:
//                     zoom === zoomLevel
//                       ? FontType.FontMedium
//                       : FontType.FontSmall,
//                   color:
//                     zoom === zoomLevel
//                       ? '#FFC000'
//                       : Utills.selectedThemeColors().PrimaryTextColor,
//                 }}>
//                 {zoom}
//                 {zoom === zoomLevel ? 'x' : ''}
//               </CustomText.RegularText>
//             </TouchableOpacity>
//           ))}
//         </View>
//         <View
//           style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             backgroundColor: '#00000090',
//             paddingHorizontal: Metrix.HorizontalSize(40),
//             paddingBottom: Metrix.HorizontalSize(110),
//           }}>
//           {/* <TouchableOpacity
//             activeOpacity={0.7}
//             onPress={toggleCamera}
//             style={styles.circularButtons}>
//             <Image source={Images.Camera} style={styles.circularImage} />
//           </TouchableOpacity> */}
//           <View style={styles.blankView}></View>
//           <View>
//             <TouchableOpacity
//               activeOpacity={0.7}
//               onPress={endCall}
//               style={styles.liveStreamButton}>
//               <View
//                 style={[
//                   styles.innerLiveStreamButton,
//                   {alignItems: 'center', justifyContent: 'center'},
//                 ]}></View>
//             </TouchableOpacity>
//             <CustomText.RegularText customStyle={styles.livestreamText}>
//               Streaming
//             </CustomText.RegularText>
//           </View>
//           {/* <TouchableOpacity
//             onPress={toggleMic}
//             activeOpacity={0.7}
//             style={styles.circularButtons}>
//             <Image source={Images.Mic} style={styles.circularImage} />
//           </TouchableOpacity> */}
//           <TouchableOpacity onPress={openGallery}>
//             <Image
//               source={{uri: lastImage}}
//               style={styles.footageImg}
//               resizeMode="cover"
//             />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   if (device == null) return <View style={styles.container} />;

//   return joinSucceed ? (
//     renderVideos()
//   ) : (
//     <View style={styles.container}>
//       {/* Main Camera View */}
//       <Camera
//         ref={cameraRef}
//         style={StyleSheet.absoluteFill}
//         device={device}
//         zoom={zoomLevel} // Adjust zoom level
//         isActive={isFocused}
//         onInitialized={onInitialized}
//       />
//       <View style={styles.topContainer}>
//         <View style={styles.topLeftContainer}>
//           <TouchableOpacity
//             onPress={toggleFlashlight}
//             // onPress={() => {
//             //   setFlashlightOn(!flashlightOn);
//             //   // Torch.switchState(true);
//             // }}
//           >
//             <RoundImageContainer
//               styles={{padding: 2}}
//               borderColor="white"
//               borderWidth={1.4}
//               backgroundColor="transparent"
//               circleWidth={28}
//               source={flashlightOn ? Images.FlashOn : Images.FlashOff}
//             />
//           </TouchableOpacity>
//           <TouchableOpacity>
//             <RoundImageContainer
//               imageStyle={{
//                 tintColor: Utills.selectedThemeColors().PrimaryTextColor,
//               }}
//               backgroundColor="transparent"
//               borderColor="transparent"
//               circleWidth={28}
//               source={Images.Location}
//             />
//           </TouchableOpacity>

//           <TouchableOpacity>
//             <RoundImageContainer
//               imageStyle={{
//                 tintColor: Utills.selectedThemeColors().PrimaryTextColor,
//               }}
//               styles={{padding: 2}}
//               borderColor="white"
//               borderWidth={1.4}
//               backgroundColor="transparent"
//               circleWidth={28}
//               source={Images.DualCam}
//             />
//           </TouchableOpacity>
//         </View>
//         <View>
//           <CustomText.MediumText customStyle={{fontSize: normalizeFont(18)}}>
//             00:00:00
//           </CustomText.MediumText>
//         </View>
//         <View
//           style={{
//             width: '28%',
//             alignItems: 'flex-end',
//           }}>
//           {/* <RoundImageContainer
//             imageStyle={{
//               tintColor: Utills.selectedThemeColors().PrimaryTextColor,
//             }}
//             backgroundColor="transparent"
//             circleWidth={26}
//             source={Images.Profile}
//           /> */}
//         </View>
//       </View>
//       <View style={styles.middleContainer}>
//         <View style={styles.camView}>
//           {/* Front Camera Preview Window  Before Live Stream View*/}
//           <View style={styles.previewWindow}>
//             {/* <Camera
//               style={styles.previewCamera}
//               device={frontDevice}
//               isActive={isFocused} // Only active if the screen is focused
//             /> */}
//           </View>

//           {/* <View style={styles.liveContainer}>
//             <View style={styles.liveCircle}></View>
//             <CustomText.MediumText customStyle={{fontWeight: '700'}}>
//               Live
//             </CustomText.MediumText>
//           </View> */}
//         </View>

//         {/* Zoom Controls */}
//         <View style={styles.zoomControls}>
//           {['1', '2', '3'].map((zoom, index) => (
//             <TouchableOpacity
//               key={index}
//               onPress={() => setZoomLevel(parseFloat(zoom))}
//               style={
//                 zoom === zoomLevel.toString()
//                   ? styles.activeZoomButton
//                   : styles.zoomButton
//               }>
//               <CustomText.RegularText
//                 customStyle={{
//                   fontWeight: '700',
//                   fontSize:
//                     zoom === zoomLevel?.toString()
//                       ? FontType.FontMedium
//                       : FontType.FontSmall,
//                   color:
//                     zoom === zoomLevel?.toString()
//                       ? '#FFC000'
//                       : Utills.selectedThemeColors().PrimaryTextColor,
//                 }}>
//                 {zoom}
//                 {zoom === zoomLevel.toString() ? 'x' : ''}
//               </CustomText.RegularText>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>
//       <View style={styles.bottomContainer}>
//         <View style={styles.blankView}></View>

//         {/* Start Live Stream Button */}
//         {isCameraInitialized && (
//           <View>
//             <TouchableOpacity
//               onPress={startCall}
//               style={styles.liveStreamButton}>
//               <View
//                 style={[
//                   styles.innerLiveStreamButton,
//                   {alignItems: 'center', justifyContent: 'center'},
//                 ]}></View>
//             </TouchableOpacity>
//             <CustomText.RegularText customStyle={styles.livestreamText}>
//               Livestream
//             </CustomText.RegularText>
//           </View>
//         )}
//         <TouchableOpacity onPress={openGallery}>
//           <Image
//             source={{uri: lastImage}}
//             style={styles.footageImg}
//             resizeMode="cover"
//           />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//   },
//   max: {
//     flex: 1,
//     paddingTop: Metrix.VerticalSize(50),
//     paddingHorizontal: Metrix.HorizontalSize(20),
//   },
//   buttonHolder: {
//     // height: 100,xs
//     alignItems: 'center',
//     // flex: 1,
//     flexDirection: 'row',
//     justifyContent: 'space-evenly',
//   },
//   button: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     backgroundColor: '#0093E9',
//     marginTop: 20,
//     borderRadius: 25,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//   },
//   fullView: {
//     width: dimensions.width,
//     height: dimensions.height,
//   },
//   remoteContainer: {
//     width: '100%',
//     position: 'absolute',
//     bottom: '-3%',
//   },
//   remoteContainerContent: {
//     paddingHorizontal: 2.5,
//   },
//   remote: {
//     width: 150,
//     height: 150,
//     marginHorizontal: 2.5,
//   },
//   noUserText: {
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     color: '#0093E9',
//   },
//   roleText: {
//     textAlign: 'center',
//     fontWeight: '700',
//     fontSize: 18,
//     color: '#FFFFFF',
//   },
//   circularButtons: {
//     width: Metrix.HorizontalSize(55),
//     height: Metrix.VerticalSize(55),
//     borderRadius: Metrix.HorizontalSize(100),
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'white',
//     backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
//   },
//   circularImage: {
//     width: Metrix.HorizontalSize(28),
//     height: Metrix.VerticalSize(28),
//   },
//   previewWindow: {
//     // position: 'absolute',
//     // top: '3%',
//     // left: '3%',
//     width: Metrix.HorizontalSize(85),
//     height: Metrix.HorizontalSize(120),
//     borderRadius: Metrix.HorizontalSize(10),
//     borderColor: Utills.selectedThemeColors().PrimaryTextColor,
//     overflow: 'hidden',
//     backgroundColor: 'black',
//   },
//   previewCamera: {
//     flex: 1,
//   },
//   zoomControls: {
//     position: 'absolute',
//     bottom: '3%',
//     alignSelf: 'center',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '35%',
//     alignItems: 'center',
//     // borderWidth:1,borderColor:"red",
//     borderRadius: Metrix.HorizontalSize(100),
//     backgroundColor: '#00000050',
//   },
//   zoomButton: {
//     backgroundColor: '#141414',
//     borderRadius: Metrix.HorizontalSize(100),
//     width: Metrix.HorizontalSize(26),
//     height: Metrix.HorizontalSize(26),
//     padding: Metrix.HorizontalSize(5),
//     alignItems: 'center',
//     justifyContent: 'center',
//     // marginHorizontal: 5,
//   },
//   activeZoomButton: {
//     backgroundColor: '#141414',
//     borderRadius: Metrix.HorizontalSize(100),
//     width: Metrix.HorizontalSize(36),
//     height: Metrix.HorizontalSize(36),
//     padding: Metrix.HorizontalSize(5),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   zoomText: {
//     color: 'white',
//     fontSize: 16,
//   },
//   liveStreamButton: {
//     // position: 'absolute',
//     // bottom: '6%',
//     marginTop: Metrix.VerticalSize(15),
//     alignSelf: 'center',
//     width: Metrix.HorizontalSize(72),
//     height: Metrix.HorizontalSize(72),
//     borderRadius: Metrix.VerticalSize(100),
//     backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   innerLiveStreamButton: {
//     width: Metrix.HorizontalSize(65),
//     height: Metrix.HorizontalSize(65),
//     borderRadius: Metrix.VerticalSize(100),
//     borderWidth: 2.5,
//     borderColor: Utills.selectedThemeColors().Base,
//     backgroundColor: Utills.selectedThemeColors().Red,
//   },
//   streamHeader: {
//     width: '100%',
//     top: '0%',
//     paddingTop: Metrix.HorizontalSize(50),
//     backgroundColor: '#00000090',
//     // borderBottomLeftRadius: Metrix.HorizontalSize(20),
//     // borderBottomRightRadius: Metrix.HorizontalSize(20),
//     position: 'absolute',
//     borderColor: 'red',
//     zIndex: 99,
//     paddingHorizontal: Metrix.HorizontalSize(10),
//     paddingBottom: Metrix.HorizontalSize(10),
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   viewerContainer: {
//     top: '40%',
//     left: '2%',
//     position: 'absolute',
//     borderColor: 'red',
//     zIndex: 99,
//     paddingHorizontal: Metrix.HorizontalSize(10),
//     paddingVertical: Metrix.HorizontalSize(10),
//     justifyContent: 'center',
//   },
//   topContainer: {
//     flex: 0.15,
//     width: '100%',
//     backgroundColor: '#00000090',
//     // borderWidth: 1,
//     borderColor: 'white',
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     paddingHorizontal: Metrix.HorizontalSize(10),
//     paddingBottom: Metrix.HorizontalSize(8),
//     justifyContent: 'space-between',
//   },
//   topLeftContainer: {
//     flexDirection: 'row',
//     width: '30%',
//     justifyContent: 'space-between',
//     // borderWidth:1,borderColor:"red"
//   },
//   middleContainer: {
//     flex: 0.87,
//     width: '100%',
//   },
//   camView: {
//     position: 'absolute',
//     top: '3%',
//     left: '3%',
//   },
//   liveContainer: {
//     width: Metrix.HorizontalSize(85),
//     height: Metrix.VerticalSize(30),
//     marginTop: Metrix.VerticalSize(5),
//     backgroundColor: Utills.selectedThemeColors().Red,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: Metrix.HorizontalSize(5),
//     flexDirection: 'row',
//   },
//   liveCircle: {
//     width: Metrix.HorizontalSize(6),
//     height: Metrix.HorizontalSize(6),
//     borderRadius: Metrix.HorizontalSize(100),
//     backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
//     right: Metrix.HorizontalSize(5),
//   },
//   bottomContainer: {
//     width: '100%',
//     alignItems: 'center',
//     backgroundColor: '#00000090',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     flex: 0.21,
//     paddingHorizontal: Metrix.HorizontalSize(40),
//   },
//   blankView: {
//     width: Metrix.HorizontalSize(55),
//     height: Metrix.VerticalSize(55),
//     borderRadius: Metrix.HorizontalSize(100),
//   },
//   livestreamText: {
//     paddingVertical: Metrix.VerticalSize(10),
//     fontWeight: '700',
//   },
//   footageImg: {
//     width: Metrix.HorizontalSize(55),
//     height: Metrix.VerticalSize(55),
//     borderRadius: Metrix.HorizontalSize(5),
//     // tintColor: Utills.selectedThemeColors().PrimaryTextColor,
//   },
//   circularContact: {
//     width: Metrix.HorizontalSize(35),
//     height: Metrix.VerticalSize(35),
//     borderRadius: Metrix.HorizontalSize(100),
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: Utills.selectedThemeColors().LightGreen,
//     marginTop: Metrix.VerticalSize(-7),
//     borderWidth: 1,
//   },
// });
