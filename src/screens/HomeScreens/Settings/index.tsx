import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CustomText,
  FadeInImage,
  MainContainer,
  RoundImageContainer,
  TextInputAlert,
} from '../../../components';
import { SettingsProps } from '../../propTypes';
import { useDispatch, useSelector } from 'react-redux';
import {
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import { t } from 'i18next';
import { RootState } from '../../../redux/reducers';
import { AuthActions, HomeActions } from '../../../redux/actions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeAPIS } from '../../../services/home';
import { Environments } from '../../../services/config';

export const Settings: React.FC<SettingsProps> = ({ }) => {
  const dispatch = useDispatch();
  const isSafeWord = useSelector(
    (state: RootState) => state?.home?.safeWord?.isSafeWord,
  );
  const safeWord = useSelector(
    (state: RootState) => state?.home?.safeWord?.safeWord,
  );
  const [isPrompt, setIsPrompt] = useState(false);
  const [word, setWord] = useState(safeWord);
  const [model, setModel] = useState('');
  const token = useSelector((state: RootState) => state.user.authorize);
  const userData = useSelector((state: RootState) => state.home.userDetails);
  const selectedModel = useSelector(
    (state: RootState) => state.home.selectedModel,
  );

  const checCurrentModel = () => {
    if (selectedModel == Environments.Models.TRIGGER_WORD_WHISPER) {
      setModel('Trigger Word Whisper');
    } else if (selectedModel == Environments.Models.WHISPER_AND_SENTIMENT) {
      setModel('Whisper + Sentiment');
    } else {
      setModel('Vit');
    }
  };

  const CardData = [
    {
      id: '1',
      image: Images.SafeWord,
      text: 'Safe Word',
      onPress: () => {
        isSafeWord
          ? Utills.showToast(
            'Please select your preference as manual for safe word audio streaming',
          )
          : setIsPrompt(true);
      },
    },
    {
      id: '2',
      image: Images.Responders,
      text: 'Responders',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.TrustedContacts);
      }
    },
    {
      id: '3',
      image: Images.Passkey,
      text: 'Passcode',
      styles: { width: '100%' },
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.PasscodeSettings);
      },
      iconSize: 35, 
    },
    {
      id: '4',
      image: Images.HowToUse,
      text: 'How To use',
      styles: { width: '100%' },
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.HowToUse);
      },
    },
    {
      id: '5',
      image: Images.About,
      text: 'FAQs',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.FAQ, {
          from: 'Help Center',
        });
      },
    },
    {
      id: '6',
      image: Images.PrivacyPilicy,
      text: 'Privacy Policy',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.TermsAndPolicy, {
          from: 'Privacy Policy',
        });
      },
    },
    {
      id: '7',
      image: Images.TermsAndCond,
      text: 'Terms & Conditions',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.TermsAndPolicy, {
          from: 'Terms & Conditions',
        });
      },
    },
    {
      id: '8',
      image: Images.Out,
      text: 'Log Out',
      onPress: () => {
        handleLogout();
      },
    },
  ];

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    checCurrentModel();
  }, [selectedModel]);

  const getUser = () => {
    HomeAPIS.getUserData()
      .then(res => {
        dispatch(
          HomeActions.setUserDetails({
            token: userData?.token,
            user: res?.data,
            isSocialLogin: userData?.isSocialLogin ? true : false,
          }),
        );
      })
      .catch(err => {
        console.log('Err User', err?.response?.data);
        Utills.showToast(err?.response?.data?.errors?.[0]?.message);
      });
  };

  const handleLogout = () => {
    AsyncStorage.removeItem('userData');
    dispatch(HomeActions.setUserDetails({}));
    dispatch(HomeActions.setUserLocation({}));
    dispatch(AuthActions.loginSuccess(false));
  };

  const handleConfirm = () => {
    dispatch(
      HomeActions.setSafeWord({
        isSafeWord: false,
        safeWord: word?.toLowerCase(),
      }),
    );
    setIsPrompt(false);
  };

  const genderSelection = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Whisper + Sentiment', 'Trigger Word Whisper', 'Cancel'],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 3,
        title: 'Select ML Model',
        userInterfaceStyle: 'dark',
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          dispatch(
            HomeActions.setSelectedModel(
              Environments.Models.WHISPER_AND_SENTIMENT,
            ),
          );
        } else if (buttonIndex === 1) {
          dispatch(
            HomeActions.setSelectedModel(
              Environments.Models.TRIGGER_WORD_WHISPER,
            ),
          );
        } else {
          console.log('Cancelled');
        }
      },
    );

  const renderSeetingsItem = ({ item }: any) => {
    if (item.condition !== undefined && !item.condition) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={item?.onPress}
        key={item?.id}
        style={styles.renderContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FadeInImage
            customImageContainerStyle={{
              width: Metrix.HorizontalSize(30), // same for all
              height: Metrix.VerticalSize(30),
              alignItems: 'center',
              justifyContent: 'center',
            }}
            imageStyles={{
              width: Metrix.HorizontalSize(item?.iconSize || 25),  // icon image
              height: Metrix.VerticalSize(item?.iconSize || 25),
              resizeMode: 'contain',
              tintColor: Utills.selectedThemeColors().PrimaryTextColor,
            }}
            source={item?.image}
          />

          <CustomText.RegularText customStyle={styles.itemText}>
            {item?.text}
          </CustomText.RegularText>
        </View>
        <View>
          <RoundImageContainer
            imageStyle={{
              tintColor: Utills.selectedThemeColors().PrimaryTextColor,
            }}
            circleWidth={22}
            source={Images.ArrowChevron}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Function to navigate to edit profile when avatar is pressed
  const handleAvatarPress = () => {
    NavigationService.navigate(RouteNames.HomeRoutes.EditProfileScreen);
  };

  return (
    <MainContainer
      customeStyle={{
        paddingHorizontal: 0,
        flex: 1,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Metrix.VerticalSize(20), justifyContent: 'start', paddingHorizontal: Metrix.HorizontalSize(20) }}>
        <Image
          source={Images.Premium}
          style={styles.settingsIcon}
          resizeMode="contain"
        />
        <CustomText.LargeBoldText>
          {t('Settings')}
        </CustomText.LargeBoldText>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flex: 0.3 }}>
          <View style={styles.profileCard}>
            {/* Touchable Avatar Container */}
            <TouchableOpacity
              style={styles.avatarContainer}
              activeOpacity={0.7}
              onPress={handleAvatarPress}>
              <RoundImageContainer
                circleWidth={80}
                source={
                  userData?.isSocialLogin
                    ? { uri: userData?.user?.image_url }
                    : userData?.isSocialLogin == false
                      ? { uri: userData?.user?.avatar }
                      : Images.UserPlaceholder
                }
              />
            </TouchableOpacity>

            <View style={styles.detailsContainer}>
              <CustomText.MediumText
                customStyle={{
                  color: Utills.selectedThemeColors().PrimaryTextColor,
                  fontWeight: '700',
                }}>
                {userData?.user?.first_name +
                  ' ' +
                  userData?.user?.last_name || userData?.user?.username}
              </CustomText.MediumText>

              <CustomText.SmallText customStyle={styles.emailText}>
                {userData?.user?.email}
              </CustomText.SmallText>

              {/* Premium Badge */}
              <View style={styles.badgeContainer}>
                <CustomText.SmallText
                  customStyle={{ color: '#fff', fontWeight: '600' }}>
                  {userData?.user?.isPremium ? 'PREMIUM' : 'PREMIUM'}
                </CustomText.SmallText>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <FlatList
            data={CardData}
            renderItem={renderSeetingsItem}
            contentContainerStyle={styles.flatlistContentContainer}
            keyExtractor={item => item?.id}
          />
        </View>
      </View>

      <TextInputAlert
        heading={'Safe Word'}
        subHeading={'Please enter your custom safe word'}
        visible={isPrompt}
        setVisible={setIsPrompt}
        inputText={word}
        setInputText={setWord}
        handleConfirm={handleConfirm}
      />
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Metrix.VerticalSize(20),
    marginHorizontal: Metrix.HorizontalSize(20),
    backgroundColor: Utills.selectedThemeColors().Base,
    borderRadius: Metrix.HorizontalSize(12),
    marginTop: Metrix.VerticalSize(20),
    marginBottom: Metrix.VerticalSize(10),
  },
  avatarContainer: {
    marginBottom: Metrix.VerticalSize(10),
  },
  detailsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: {
    marginBottom: Metrix.VerticalSize(8), // Added margin bottom to separate email from badge
  },
  badgeContainer: {
    marginTop: Metrix.VerticalSize(4), // Reduced margin top since email now has margin bottom
    backgroundColor: '#007AFF',
    paddingHorizontal: Metrix.HorizontalSize(12),
    paddingVertical: Metrix.VerticalSize(4),
    borderRadius: Metrix.HorizontalSize(12),
  },
  flatlistContentContainer: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Utills.selectedThemeColors().Base,
    marginTop: Metrix.VerticalSize(50),
    borderRadius: Metrix.HorizontalSize(8),
    paddingBottom: Metrix.VerticalSize(20),
  },
  renderContainer: {
    borderBottomWidth: 1,
    borderColor: Utills.selectedThemeColors().TextInputBorderColor,
    paddingHorizontal: Metrix.HorizontalSize(8),
    paddingVertical: Metrix.VerticalSize(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Metrix.VerticalSize(4),
    borderRadius: Metrix.HorizontalSize(8),
    width: '100%',
    backgroundColor: Utills.selectedThemeColors().Base,
  },
  itemText: {
    marginLeft: Metrix.HorizontalSize(10),
    fontWeight: '500',
  },
  settingsIcon: {
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
});