import React, { ReactNode } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BackHeader } from '../BackHeader';
import { CustomText, MainContainer, PrimaryButton, SecondaryButton } from '..';
import { Colors, Images, Metrix, Utills } from '../../config';
import { I18nManager } from 'react-native';
import { PrimaryButtonProps } from '../PrimaryButton';
import { useThemeHook } from '../../hooks';
import { t } from 'i18next';
import { normalizeFont } from '../../config/metrix';
import appleAuth, {
  AppleButton,
} from '@invertase/react-native-apple-authentication';

const TouchableText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <Pressable
      style={{ justifyContent: 'flex-end' }}
      onPress={() => { }}>
      <CustomText.MediumText
        customStyle={{
          color: Utills.selectedThemeColors().PrimaryTextColor,
        }}>
        {text}
      </CustomText.MediumText>
    </Pressable>
  );
};

type AuthHeaderProps = PrimaryButtonProps & {
  heading: string;
  paragraph?: string;
  showBackHeader?: boolean;
  onBottomTextPress?: () => void;
  isbottomText?: string;
  isBtn?: boolean;
  isLogo?: boolean;
  isSecondaryBtn?: boolean;
  isupperText?: boolean;
  children: ReactNode;
  title?: string;
  childrenView?: any;
  onSecPress?: () => void;
  // Apple Sign-In props
  isAppleBtn?: boolean;
  onApplePress?: () => void;
  appleSignInEnabled?: boolean;
  googleSignInEnabled?: boolean;
};

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  heading,
  paragraph,
  showBackHeader = true,
  children,
  disabled,
  title,
  onPress,
  onSecPress,
  onBottomTextPress,
  isbottomText,
  isBtn,
  isLogo = true,
  customStyles,
  isSecondaryBtn,
  isupperText,
  childrenView,
  // Apple Sign-In props
  isAppleBtn,
  onApplePress,
  appleSignInEnabled = true,
  googleSignInEnabled = true,
}) => {
  // Check if Apple Sign-In should be shown
  const shouldShowAppleSignIn = 
    isAppleBtn && 
    appleSignInEnabled && 
    Platform.OS === 'ios' && 
    appleAuth.isSupported;

  console.log(shouldShowAppleSignIn)

  // Check if Google Sign-In should be shown
  const shouldShowGoogleSignIn = isSecondaryBtn && googleSignInEnabled;

  // Show social buttons section if either Google or Apple should be shown
  const shouldShowSocialButtons = shouldShowAppleSignIn || shouldShowGoogleSignIn;

  return (
    <MainContainer
      customeStyle={{
        paddingVertical: Metrix.VerticalSize(10),
      }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {showBackHeader && <BackHeader />}
        <View style={styles.topContainer}>
          {isLogo && (
            <Image
              source={Images.Logo}
              style={{
                width: Metrix.HorizontalSize(150),
                height: Metrix.VerticalSize(70),
              }}
              resizeMode="cover"
            />
          )}
          <CustomText.ExtraLargeBoldText
            customStyle={{ fontSize: normalizeFont(28) }}>
            {heading}
          </CustomText.ExtraLargeBoldText>
        </View>

        <View style={[styles.childrenView, childrenView]}>
          <View>
            {children}
          </View>
          <View
            style={[
              styles.bottomContainer,
              !isBtn && { justifyContent: 'flex-end' },
            ]}>
            {isupperText && (
              <View>
                <CustomText.MediumText
                  customStyle={{
                    textAlign: 'center',
                  }}
                  isSecondaryColor>
                  {t('text')} <TouchableText text={t('terms')} /> {t('and')}{' '}
                  <TouchableText text={t('conditions')} />
                </CustomText.MediumText>
              </View>
            )}
            
            {isBtn && (
              <PrimaryButton
                title={title}
                customStyles={customStyles}
                disabled={disabled}
                onPress={onPress}
              />
            )}

            {/* Social Sign-In Buttons Section */}
            {shouldShowSocialButtons && (
              <View style={styles.socialButtonsContainer}>
                <CustomText.RegularText
                  customStyle={{
                    color: Utills.selectedThemeColors().LightGreyText,
                    textAlign: 'center',
                    lineHeight: 30,
                    marginVertical: Metrix.VerticalSize(10),
                  }}>
                  {t('or')}
                </CustomText.RegularText>

                {/* Apple Sign-In Button */}
                
               
                  <SecondaryButton
                    onPress={onApplePress}
                    title={t('Continue with Apple')}
                    source={Images.Girl}
                    isIcon
                    />
              

                {/* Google Sign-In Button */}
                {shouldShowGoogleSignIn && (
                  <SecondaryButton
                    onPress={onSecPress}
                    title={t('Continue with Google')}
                    source={Images.GoogleLogo}
                    isIcon
                  />
                )}
              </View>
            )}

            {isbottomText && (
              <View style={styles.bottomText}>
                <CustomText.MediumText isSecondaryColor>
                  New to Rove?{' '}
                </CustomText.MediumText>
                <TouchableOpacity
                  style={styles.bottomTouchable}
                  onPress={onBottomTextPress}>
                  <CustomText.MediumText>
                    {isbottomText}
                  </CustomText.MediumText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginVertical: Metrix.VerticalSize(40),
  },
  bottomText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTouchable: {
    justifyContent: 'center',
  },
  bottomContainer: { 
    justifyContent: 'space-between' 
  },
  childrenView: {
    marginVertical: Metrix.VerticalSize(20),
    flex: 4,
    justifyContent: 'space-between',
  },
  topContainer: {
    flex: 1.0,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialButtonsContainer: {
    marginTop: Metrix.VerticalSize(10),
    marginBottom: Metrix.VerticalSize(20),
  },
});