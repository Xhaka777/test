import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {
  FontType,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import {AuthHeader, CustomInput, CustomText, Loader} from '../../../components';
import {Formik} from 'formik';
import Schema from '../../../formik';
import {LoginScreenProps} from '../../propTypes';
import {useDispatch, useSelector} from 'react-redux';
import {AuthActions, HomeActions} from '../../../redux/actions';
import {RootState} from '../../../redux/reducers';
import {t} from 'i18next';
import {AuthAPIS} from '../../../services/auth';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import appleAuth, {
  AppleAuthRequestOperation,
  AppleAuthRequestScope,
  AppleAuthCredentialState,
} from '@invertase/react-native-apple-authentication';

// Feature flags - Update these when backends are ready
const GOOGLE_SIGNIN_ENABLED = true;
const APPLE_SIGNIN_ENABLED = true; // Set to true when Kira enables Apple Developer Console

export const LoginScreen: React.FC<LoginScreenProps> = ({}) => {
  const dispatch = useDispatch();
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const userDetails = useSelector((state: RootState) => state.home.userDetails);
  const isFirstTime = useSelector((state: RootState) => state.user.isFirstTime);

  let passwordRef = useRef<TextInput>(null!);

  console.log('isFirstTime', isFirstTime);

  useEffect(() => {
    getPermission();
  }, []);

  useEffect(() => {
    const checkAppleSignInStatus = async () => {
      console.log('=== APPLE SIGN-IN DEBUG INFO ===');
      console.log('Platform:', Platform.OS);
      console.log('iOS Version:', Platform.Version);
      console.log('Apple Auth isSupported:', appleAuth.isSupported);
      
      // Check if running on simulator
      if (Platform.OS === 'ios') {
        try {
          // This will help identify if it's a simulator issue
          const isSimulator = Platform.isPad || Platform.isTVOS || 
                             (Platform.OS === 'ios' && !Platform.isTV && 
                              (await import('react-native')).Platform.constants.simulator);
          console.log('Is Simulator:', isSimulator);
        } catch (e) {
          console.log('Could not determine if simulator');
        }
      }
      
      // Check Apple Sign-In availability in detail
      if (Platform.OS === 'ios') {
        console.log('Apple Sign-In Module Available:', !!appleAuth);
        console.log('Apple Auth performRequest Available:', typeof appleAuth.performRequest);
        
        // Try to check if the capability is properly configured
        try {
          // This will fail if Apple Sign-In capability is not properly set up
          const testCheck = await appleAuth.isAvailableAsync();
          console.log('Apple Sign-In isAvailableAsync:', testCheck);
        } catch (error) {
          console.log('Apple Sign-In isAvailableAsync Error:', error);
        }
      }
    };
    
    checkAppleSignInStatus();
  }, []);
  

  const getPermission = async () => {
    if (Platform.OS == 'ios') {
      getUserLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getUserLocation();
        } else {
          Alert.alert(
            'Rove AI does not have access to your Location for showing you nearby services. To enable access, tap Settings and turn on Location',
            '',
            [
              {
                text: 'Cancel',
                style: 'default',
              },
              {
                text: 'Settings',
                style: 'default',
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ],
          );
        }
      } catch (err) {
        Alert.alert(
          'Rove AI does not have access to your Location for showing you nearby services. To enable access, tap Settings and turn on Location',
          '',
          [
            {
              text: 'Cancel',
              style: 'default',
            },
            {
              text: 'Settings',
              style: 'default',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ],
        );
      }
    }
  };

  const getUserLocation = () => {
    Platform.OS == 'ios' && Geolocation.requestAuthorization('whenInUse');
    Geolocation.getCurrentPosition(
      position => {
        dispatch(
          HomeActions.setUserLocation({
            latitude: position?.coords?.latitude,
            longitude: position?.coords?.longitude,
          }),
        );
        AsyncStorage.setItem(
          'userPosition',
          JSON.stringify({
            latitude: position?.coords?.latitude,
            longitude: position?.coords?.longitude,
          }),
        );
      },
      error => {
        // Handle location error
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      },
    );
  };

  const loginUser = (body: Object) => {
    setLoading(true);
    AuthAPIS.userLogin(body)
      .then(res => {
        console.log('Login response', res);
        getToken(body, res?.data?.data?.user);
      })
      .catch(err => {
        console.log('Login error', err);
        Utills.showToast(err?.response?.data?.errors?.[0]?.message);
        setLoading(false);
      });
  };

  const getToken = (body: Object, obj: any) => {
    AuthAPIS.getAccessToken(body)
      .then(res => {
        console.log('Token response', res?.data);
        dispatch(
          HomeActions.setUserDetails({
            user: obj,
            token: res?.data?.access,
            isSocialLogin: false,
          }),
        );
        setLoading(false);
        dispatch(AuthActions.loginSuccess(true));
      })
      .catch(err => {
        console.log('Token error', err);
        Utills.showToast(err?.response?.data?.errors?.[0]?.message);
        setLoading(false);
      });
  };

  // Google Sign-In Handler
  const handleGoogleLogin = () => {
    if (!GOOGLE_SIGNIN_ENABLED) {
      Utills.showToast('Google Sign-In temporarily disabled');
      return;
    }

    GoogleSignin.configure({
      iosClientId:
        '295191056691-erq304na575h0t5lr0phicdo1ofendl8.apps.googleusercontent.com',
    });
    
    GoogleSignin.hasPlayServices()
      .then(hasPlayService => {
        if (hasPlayService) {
          GoogleSignin.signIn()
            .then(userInfo => {
              console.log('Google Sign-In Success');
              postGoogleCred(userInfo?.data?.idToken);
            })
            .catch(e => {
              handleGoogleError(e);
            });
        }
      })
      .catch(e => {
        console.log('Google Play Services Error:', e);
        Utills.showToast('Google Play Services error');
      });
  };

  const handleGoogleError = (error: any) => {
    console.log('Google Sign-In Error:', error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      Utills.showToast('Google Sign-In was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      Utills.showToast('Google Sign-In is in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Utills.showToast('Google Play Services not available');
    } else {
      Utills.showToast('Google Sign-In failed');
    }
  };

  const postGoogleCred = (token: any) => {
    setLoading(true);
    AuthAPIS.googleLogin({idToken: token})
      .then(res => {
        const userData = res?.data?.data;
        const firstLogin = !isFirstTime;

        dispatch(AuthActions.setFirstTime(true));
        dispatch(
          HomeActions.setUserDetails({
            user: userData,
            token: userData?.access_token,
            isSocialLogin: true,
            isGoogleLogin: true,
          }),
        );
        setLoading(false);
        if (firstLogin) {
          NavigationService.navigate(RouteNames.AuthRoutes.Preferences);
        } else {
          dispatch(AuthActions.loginSuccess(true));
        }
      })
      .catch(err => {
        Utills.showToast(err?.response?.data?.errors?.[0]?.message);
        setLoading(false);
      });
  };

  // Apple Sign-In Handler
  const handleAppleLogin = async () => {
    console.log('=== APPLE LOGIN ATTEMPT ===');
    console.log('APPLE_SIGNIN_ENABLED:', APPLE_SIGNIN_ENABLED);
    console.log('Platform.OS:', Platform.OS);
    console.log('appleAuth.isSupported:', appleAuth.isSupported);
    
    // Temporary bypass for debugging
    if (Platform.OS === 'ios' && !appleAuth.isSupported) {
      console.log('Apple Sign-In not supported - possible causes:');
      console.log('1. iOS version below 13');
      console.log('2. Running on unsupported simulator');
      console.log('3. Apple Sign-In capability not enabled in Developer Console');
      console.log('4. App not properly signed with development team');
      
      // Show more detailed error
      Alert.alert(
        'Apple Sign-In Debug Info',
        `Platform: ${Platform.OS}\niOS Version: ${Platform.Version}\nSupported: ${appleAuth.isSupported}\n\nPossible issues:\n• iOS version < 13\n• Simulator limitations\n• Apple Developer Console not configured\n• App signing issues`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!APPLE_SIGNIN_ENABLED) {
      Utills.showToast('Apple Sign-In integration pending - waiting for backend setup');
      return;
    }
  
    try {
      if (!appleAuth.isSupported) {
        Utills.showToast('Apple Sign-In is not supported on this device');
        return;
      }
  
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: AppleAuthRequestOperation.LOGIN,
        requestedScopes: [AppleAuthRequestScope.EMAIL, AppleAuthRequestScope.FULL_NAME],
      });
  
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user,
      );
  
      if (credentialState === AppleAuthCredentialState.AUTHORIZED) {
        console.log('Apple Sign-In Success');
        postAppleCred(appleAuthRequestResponse);
      } else {
        Utills.showToast('Apple Sign-In failed');
      }
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      if (error.code === appleAuth.Error.CANCELED) {
        Utills.showToast('Apple Sign-In was canceled');
      } else {
        Utills.showToast(`Apple Sign-In failed: ${error.message || error.code}`);
      }
    }
  };

  const postAppleCred = (appleResponse: any) => {
    setLoading(true);
    
    const payload = {
      identityToken: appleResponse.identityToken,
      authorizationCode: appleResponse.authorizationCode,
      user: appleResponse.user,
      email: appleResponse.email,
      fullName: appleResponse.fullName,
      realUserStatus: appleResponse.realUserStatus,
    };

    // TODO: Uncomment when backend creates apple-sign-in endpoint
    console.log('Apple Sign-In Payload (for backend):', payload);
    Utills.showToast('Apple Sign-In integration pending backend implementation');
    setLoading(false);
    
    /* 
    // UNCOMMENT WHEN BACKEND IS READY:
    AuthAPIS.appleLogin(payload)
      .then(res => {
        const userData = res?.data?.data;
        const firstLogin = !isFirstTime;
        dispatch(AuthActions.setFirstTime(true));
        dispatch(
          HomeActions.setUserDetails({
            user: userData,
            token: userData?.access_token,
            isSocialLogin: true,
            isAppleLogin: true,
          }),
        );
        
        setLoading(false);
        if (firstLogin) {
          NavigationService.navigate(RouteNames.AuthRoutes.Preferences);
        } else {
          dispatch(AuthActions.loginSuccess(true));
        }
      })
      .catch(err => {
        Utills.showToast(err?.response?.data?.errors?.[0]?.message);
        setLoading(false);
      });
    */
  };

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
      }}
      onSubmit={values => {
        loginUser({email: values?.email, password: values?.password});
      }}
      validationSchema={Schema.LoginSchema}>
      {({
        values,
        errors,
        touched,
        handleChange,
        setFieldTouched,
        isValid,
        handleSubmit,
      }) => (
        <AuthHeader
          heading={t('Lets Sign In')}
          title={t('Login')}
          customStyles={{marginTop: Metrix.VerticalSize(20)}}
          isBtn
          // Google Sign-In props
          isSecondaryBtn={true}
          onSecPress={handleGoogleLogin}
          googleSignInEnabled={GOOGLE_SIGNIN_ENABLED}
          // Apple Sign-In props
          isAppleBtn={true}
          onApplePress={handleAppleLogin}
          appleSignInEnabled={APPLE_SIGNIN_ENABLED}
          // Bottom navigation
          isbottomText={'SignUp'}
          onBottomTextPress={() =>
            NavigationService.navigate(RouteNames.AuthRoutes.RegisterScreen)
          }
          onPress={handleSubmit}>
          
          <CustomInput
            heading={t('Email')}
            placeholder={t('Enter email')}
            onChangeText={handleChange('email')}
            onBlur={() => setFieldTouched('email')}
            value={values?.email}
            error={errors?.email}
            touched={touched?.email}
            autoCapitalize="none"
            returnKeyType="next"
            keyboardType="email-address"
            onSubmitEditing={() => passwordRef.current.focus()}
          />
          
          <CustomInput
            heading={t('Password')}
            placeholder={t('Enter password')}
            value={values?.password}
            onChangeText={handleChange('password')}
            onBlur={() => setFieldTouched('password')}
            error={errors?.password}
            touched={touched?.password}
            secureTextEntry={hidePassword}
            hidepswdState={hidePassword}
            eye
            onEyePress={() => {
              if (values?.password) {
                setHidePassword(prev => !prev);
              }
            }}
            returnKeyType="done"
            inputRef={passwordRef}
          />
          
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              NavigationService.navigate(
                RouteNames.AuthRoutes.ForgotPasswordScreen,
              )
            }>
            <CustomText.RegularText
              customStyle={{
                fontSize: FontType.FontSmall,
                textAlign: 'right',
              }}>
              {t('Forgot password')}
            </CustomText.RegularText>
          </TouchableOpacity>

          <Loader isLoading={loading} />
        </AuthHeader>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  // Add any LoginScreen specific styles here
});