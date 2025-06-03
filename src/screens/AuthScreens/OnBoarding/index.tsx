import {
  Animated,
  Image,
  ImageProps,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {CustomText, FadeContainer, PrimaryButton} from '../../../components';
import {
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import {OnBoardingProps} from '../../propTypes';
import Onboarding from 'react-native-onboarding-swiper';
import {t} from 'i18next';
import {normalizeFont} from '../../../config/metrix';

const handleOnSkipAndDone = () => {
  NavigationService.navigate(RouteNames.AuthRoutes.LoginScreen);
};

const Square: React.FC<{isLight: any; selected: any}> = ({
  isLight,
  selected,
}) => {
  const opacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: selected ? 1 : 0.2,
      duration: 300, // Adjust the duration as needed
      useNativeDriver: true, // Enable native driver for performance
    }).start();
  }, [selected]);

  useEffect(() => {}, [selected]);

  // let backgroundColor;
  // if (isLight) {
  //   backgroundColor = selected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)';
  // } else {
  //   backgroundColor = selected ? 'red' : 'blue';
  // }
  return (
    <Animated.View
      style={{
        width: Metrix.HorizontalSize(selected ? 10 : 10),
        height: Metrix.VerticalSize(10),
        borderRadius: Metrix.VerticalSize(100),
        marginHorizontal: 5,
        backgroundColor: selected
          ? Utills.selectedThemeColors().PrimaryTextColor
          : Utills.selectedThemeColors().DotGrey,
        opacity: opacity,
      }}
    />
  );
};

const Skip: React.FC<{isLight: any; skipLabel: any}> = ({
  isLight,
  skipLabel,
  ...props
}) => {
  return (
    <FadeContainer
      mainViewStyle={{
        justifyContent: 'center',
        width: Metrix.VerticalSize(50),
      }}>
      <TouchableOpacity onPress={handleOnSkipAndDone}>
        <CustomText.RegularText customStyle={{fontWeight: '600'}}>
          {t('skip')}
        </CustomText.RegularText>
      </TouchableOpacity>
    </FadeContainer>
  );
};

const Next: React.FC<{isLight: any}> = ({isLight, ...props}) => {
  return (
    <PrimaryButton
      title={t('next')}
      customStyles={{width: Metrix.HorizontalSize(100)}}
      {...props}
    />
  );
};

const ImageComp: React.FC<{source: ImageProps['source']}> = ({source}) => (
  <View
    style={{
      width: '100%',
      height: '100%',
    }}>
    <Image
      source={source}
      resizeMode="cover"
      style={{width: '100%', height: '100%'}}
    />
  </View>
);

export const OnBoarding: React.FC<OnBoardingProps> = () => {
  const Done = () => (
    <PrimaryButton
      title={t('next')}
      customStyles={{width: Metrix.HorizontalSize(100)}}
      onPress={handleOnSkipAndDone}
    />
  );

  return (
    <View style={{flex: 1}}>
      <Onboarding
        DotComponent={Square}
        NextButtonComponent={Next}
        SkipButtonComponent={Skip}
        DoneButtonComponent={Done}
        bottomBarHighlight={false}
        showPagination
        pages={[
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard1} />,
            title: '',
            subtitle: (
              <CustomText.MediumText customStyle={styles.textSubheading}>
                When every second counts and adrenaline takes over, there's
                often no time to reach for your phone or call for help. With
                Rove, you don’t have to—we act for you.
              </CustomText.MediumText>
            ),
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard2} />,
            title: (
              <CustomText.MediumText customStyle={styles.textHeading}>
                Automatic Trigger
              </CustomText.MediumText>
            ),
            subtitle: (
              <CustomText.MediumText customStyle={styles.textSubheading}>
                Rove continuously monitors for signs of distress,{' '}
                <CustomText.MediumText
                  customStyle={[styles.textSubheading, styles.highlightedText]}>
                  even from your pocket.{' '}
                </CustomText.MediumText>
                If an assault is detected, it instantly shares your live
                location and audio/video. You're always in control of what’s
                shared and with whom.
              </CustomText.MediumText>
            ),
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard3} />,
            title: (
              <CustomText.MediumText customStyle={styles.textHeading}>
                You’re in control
              </CustomText.MediumText>
            ),
            subtitle: (
              <CustomText.MediumText customStyle={styles.textSubheading}>
                Our technology accurately detects real threats with 99%
                accuracy,{' '}
                <CustomText.MediumText
                  customStyle={[styles.textSubheading, styles.highlightedText]}>
                  filtering out false triggers
                </CustomText.MediumText>{' '}
                like loud TVs or heated arguments. You decide how it
                activates—automatically, manually, or through a safe word—and
                can set safe zones where detection is temporarily disabled.
              </CustomText.MediumText>
            ),
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard4} />,
            title: (
              <CustomText.MediumText customStyle={styles.textHeading}>
                Bodycam Capability
              </CustomText.MediumText>
            ),
            subtitle: (
              <CustomText.MediumText customStyle={styles.textSubheading}>
                Worn on a strap with the camera facing outward, your phone
                begins streaming automatically the moment Rove detects a threat—{' '}
                <CustomText.MediumText
                  customStyle={[styles.textSubheading, styles.highlightedText]}>
                  capturing everything in real time.
                </CustomText.MediumText>
              </CustomText.MediumText>
            ),
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard5} />,
            title: (
              <CustomText.MediumText customStyle={styles.textHeading}>
                LiveStream Deterrence
              </CustomText.MediumText>
            ),
            subtitle: (
              <CustomText.MediumText customStyle={styles.textSubheading}>
                Alerting the perpetrator that they are being livestreamed can
                induce hesitation, fear of exposure, and a loss of
                control—powerful psychological triggers that{' '}
                <CustomText.MediumText
                  customStyle={[styles.textSubheading, styles.highlightedText]}>
                  may prevent an attack{' '}
                </CustomText.MediumText>{' '}
                from escalating.
              </CustomText.MediumText>
            ),
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard6} />,
            title: (
              <CustomText.MediumText customStyle={styles.textHeading}>
                Secure Evidence
              </CustomText.MediumText>
            ),
            subtitle: (
              <CustomText.MediumText customStyle={styles.textSubheading}>
                Even if your phone is lost or destroyed, all critical evidence
                is{' '}
                <CustomText.MediumText
                  customStyle={[styles.textSubheading, styles.highlightedText]}>
                  securely backed up
                </CustomText.MediumText>{' '}
                in the cloud, ensuring it remains safe for investigations.
              </CustomText.MediumText>
            ),
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard7} />,
            title: (
              <CustomText.MediumText customStyle={styles.textHeading}>
                Privacy First
              </CustomText.MediumText>
            ),
            subtitle: (
              <CustomText.MediumText customStyle={styles.textSubheading}>
                Rove doesn’t record or store anything unless a trigger is
                activated. Unlike voice assistants, we listen only for specific
                threat patterns—
                <CustomText.MediumText
                  customStyle={[styles.textSubheading, styles.highlightedText]}>
                  nothing is saved, stored, or shared
                </CustomText.MediumText>{' '}
                unless real danger is detected.
              </CustomText.MediumText>
            ),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    borderWidth: 1,
    borderRadius: Metrix.VerticalSize(10),
    height: Metrix.VerticalSize(45),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Metrix.VerticalSize(10),
    backgroundColor: Utills.selectedThemeColors().TextInputBaseColor,
    borderColor: Utills.selectedThemeColors().TextInputBorderColor,
    paddingHorizontal: Metrix.VerticalSize(10),
  },
  loaderStyles: {
    // borderWidth: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textHeading: {
    fontSize: normalizeFont(18),
    letterSpacing: 0.7,
    fontWeight: '600',
    lineHeight: 20,
  },
  textSubheading: {
    fontSize: normalizeFont(14),
    letterSpacing: 0.7,
    fontWeight: '300',
  },
  highlightedText: {
    fontWeight: '600',
    color: Utills.selectedThemeColors().Blue,
  },
});
