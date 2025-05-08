import {
  Animated,
  Image,
  ImageProps,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
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
        marginHorizontal: 10,
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
      // borderWidth: 1,
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
        // imageContainerStyles={{borderWidth:2}}
        showPagination
        // containerStyles={{
        //   borderWidth:2,
        //   borderColor:'red'
        // }}
        // titleStyles={{color: 'blue',borderWidth:1}} // set default color for the title

        pages={[
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard1} />,
            title: t('Onboarding_heading1'),
            subtitle: '',
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard2} />,
            title: t('Onboarding_heading2'),
            subtitle: '',
          },
          {
            backgroundColor: Utills.selectedThemeColors().Base,
            image: <ImageComp source={Images.OnBoard3} />,
            title: t('Onboarding_heading3'),
            subtitle: '',
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
});
