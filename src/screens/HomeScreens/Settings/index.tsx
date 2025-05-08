import {
  ActionSheetIOS,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  CustomText,
  FadeInImage,
  MainContainer,
  RoundImageContainer,
  TextInputAlert,
} from '../../../components';
import {SettingsProps} from '../../propTypes';
import {useDispatch, useSelector} from 'react-redux';
import {
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import {t} from 'i18next';
import {RootState} from '../../../redux/reducers';
import {useNavigation} from '@react-navigation/native';
import {AuthActions, HomeActions} from '../../../redux/actions';
import {createShadow} from '../../../config/metrix';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {HomeAPIS} from '../../../services/home';
import {Environments} from '../../../services/config';

export const Settings: React.FC<SettingsProps> = ({}) => {
  const dispatch = useDispatch();
  const isSafeWord = useSelector(
    (state: RootState) => state?.home?.safeWord?.isSafeWord,
  );
  const safeWord = useSelector(
    (state: RootState) => state?.home?.safeWord?.safeWord,
  );
  const navigation = useNavigation();
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
      image: Images.About,
      text: 'Help Center',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.FAQ, {
          from: 'Help Center',
        });
      },
    },
    {
      id: '2',
      image: Images.Help,
      text: 'FAQs',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.FAQ, {
          from: 'FAQ',
        });
      },
    },
    {
      id: '3',
      image: Images.PrivacyPilicy,
      text: 'Privacy Policy',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.TermsAndPolicy, {
          from: 'Privacy Policy',
        });
      },
    },

    {
      id: '4',
      image: Images.TermsAndCond,
      text: 'Terms & Conditions',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.TermsAndPolicy, {
          from: 'Terms & Conditions',
        });
      },
    },
    {
      id: '5',
      image: Images.Preference,
      text: 'Preferences',
      onPress: () => {
        NavigationService.navigate(RouteNames.HomeRoutes.EditPreferences);
      },
    },
    {
      id: '6',
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
      id: '7',
      image: Images.Out,
      text: 'Log Out',
      onPress: () => {
        handleLogout();
      },
    },
    // {
    //   id: '8',
    //   image: Images.Out,
    //   text: 'LIVESTREAM',
    //   onPress: () => {
    //     NavigationService.navigate(RouteNames.HomeRoutes.LiveStream)
    //   },
    // },
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
    dispatch(
      HomeActions.setSafeWord({
        isSafeWord: true,
        safeWord: 'Activate',
      }),
    );
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
        options: [
          'Whisper + Sentiment',
          'Vit',
          'Trigger Word Whisper',
          'Cancel',
        ],
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
          dispatch(HomeActions.setSelectedModel(Environments.Models.VIT));
        } else if (buttonIndex === 2) {
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

  const renderSeetingsItem = ({item}: any) => {
    if (item.condition !== undefined && !item.condition) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={item?.onPress}
        key={item?.id}
        style={styles.renderContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <FadeInImage
            customImageContainerStyle={{
              width: Metrix.HorizontalSize(25),
              height: Metrix.VerticalSize(25),
            }}
            imageStyles={{
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

  return (
    <MainContainer
      customeStyle={{
        paddingHorizontal: 0,
        flex: 1,
      }}>
      <CustomText.ExtraLargeBoldText
        customStyle={{paddingHorizontal: Metrix.HorizontalSize(20)}}>
        {t('Settings')}
      </CustomText.ExtraLargeBoldText>
      <View style={{flex: 1}}>
        <View style={{flex: 0.25}}>
          <View style={styles.profileCard}>
            <View style={styles.cardLeftContainer}>
              <View style={styles.avatarContainer}>
                <RoundImageContainer
                  circleWidth={60}
                  source={
                    userData?.isSocialLogin
                      ? {uri: userData?.user?.image_url}
                      : userData?.isSocialLogin == false
                      ? {uri: userData?.user?.avatar}
                      : Images.UserPlaceholder
                  }
                />
              </View>
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
                <CustomText.SmallText>
                  {userData?.user?.email}
                </CustomText.SmallText>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    NavigationService.navigate(
                      RouteNames.HomeRoutes.EditProfileScreen,
                    );
                  }}
                  style={styles.editProfileButton}>
                  <CustomText.ExtraSmallText
                    customStyle={{
                      color: Utills.selectedThemeColors().Base,
                      fontWeight: '600',
                    }}>
                    Edit Profile
                  </CustomText.ExtraSmallText>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                handleLogout();
              }}
              style={styles.logoutContainer}>
              <Image
                source={Images.LogOut}
                resizeMode="contain"
                style={styles.logoutImage}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            flex: 1,
          }}>
          <FlatList
            data={CardData}
            renderItem={renderSeetingsItem}
            contentContainerStyle={styles.flatlistContentContainer}
            keyExtractor={item => item?.id}
          />
        </View>
        <CustomText.RegularText
          customStyle={{
            alignSelf: 'center',
          }}>
          Chosse Model
        </CustomText.RegularText>
        <CustomText.SmallText
          onPress={genderSelection}
          customStyle={styles.genderTxt}>
          {model}
        </CustomText.SmallText>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Metrix.HorizontalSize(10),
    paddingVertical: Metrix.VerticalSize(10),
    // marginVertical: Metrix.VerticalSize(10),
    borderRadius: Metrix.HorizontalSize(12),
    marginHorizontal: Metrix.HorizontalSize(20),
    backgroundColor: Utills.selectedThemeColors().Base,
    marginTop: Metrix.VerticalSize(20),
    marginBottom: Metrix.VerticalSize(10),
    ...createShadow,
  },
  cardLeftContainer: {
    width: '80%',
    flexDirection: 'row',
    borderRightWidth: 1,
    borderColor: Utills.selectedThemeColors().TextInputBorderColor,
  },
  avatarContainer: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    width: '80%',
    justifyContent: 'center',
    paddingLeft: Metrix.HorizontalSize(2),
  },
  editProfileButton: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Metrix.HorizontalSize(10),
    paddingVertical: Metrix.HorizontalSize(4),
    borderRadius: Metrix.HorizontalSize(4),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    marginTop: Metrix.VerticalSize(5),
  },
  logoutContainer: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutImage: {
    width: Metrix.HorizontalSize(25),
    height: Metrix.VerticalSize(25),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  flatlistContentContainer: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Utills.selectedThemeColors().Base,
    marginTop: Metrix.VerticalSize(10),
    borderRadius: Metrix.HorizontalSize(8),
    paddingBottom: Metrix.VerticalSize(20),
    // borderWidth:1,borderColor:"red"

    // ...Metrix.cardShadow,
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
    // ...Metrix.createShadow,
  },
  itemText: {
    marginLeft: Metrix.HorizontalSize(10),
    fontWeight: '500',
  },
  genderTxt: {
    fontWeight: '600',
    // borderWidth: 1,
    borderColor: 'white',
    // padding: Metrix.HorizontalSize(8),
    borderRadius: 5,
    alignSelf: 'center',
  },
});
