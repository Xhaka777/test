import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeWordProps } from '../../propTypes';
import {
  BackHeader,
  CustomText,
  MainContainer,
  PrimaryButton,
  VolumeAnimatedIcon,
} from '../../../components';
import { PasscodeInput, getPasscodeFromStorage, verifyStoredPasscode } from '../../../components';
import { Images, Metrix, Utills, NavigationService, RouteNames } from '../../../config';
import { Image } from 'react-native';
import { normalizeFont } from '../../../config/metrix';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from 'lodash';

const PASSCODE_KEY = 'userPasscode';

export const SafeWord: React.FC<SafeWordProps> = ({ }) => {
  const [hasPasscode, setHasPasscode] = useState(false);
  const [hasSafeWord, setHasSafeWord] = useState(false);
  const [safeWord, setSafeWord] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [isCheckingPasscode, setIsCheckingPasscode] = useState(true);
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    checkPasscodeExists();
  }, []);

  const checkInitialSetup = async () => {
    try {
      const existingPasscode = await getPasscodeFromStorage();
      const existingSafeWord = await getSafeWordFromStorage();

      setHasPasscode(!!existingPasscode);
      setHasSafeWord(!!existingSafeWord);
      setSafeWord(existingSafeWord || '');
    } catch (error) {
      console.error('Error checking setup:', error);
      setHasPasscode(false);
      setHasSafeWord(false);
    } finally {
      setIsCheckingPasscode(false);
    }
  }

  const checkPasscodeExists = async () => {
    try {
      const existingPasscode = await getPasscodeFromStorage();
      setHasPasscode(!!existingPasscode);
    } catch (error) {
      console.error('Error checking passcode:', error);
      setHasPasscode(false);
    } finally {
      setIsCheckingPasscode(false);
    }
  };

  // Read the passcode from storage
  const getPasscodeFromStorage = async (): Promise<string | null> => {
    try {
      const passcode = await AsyncStorage.getItem(PASSCODE_KEY);
      return passcode;
    } catch (error) {
      console.error('Error getting passcode:', error);
      return null;
    }
  };

  const getSafeWordFromStorage = async (): Promise<string | null> => {
    try {
      const safeWord = await AsyncStorage.getItem('SAFE_WORD_KEY');
      return safeWord;
    } catch (error) {
      console.error('Error getting safe word:', error);
      return null;
    }
  };

  const handleUpdateSafeWord = async () => {
    if (!hasPasscode) {
      // Navigate to passcode setup first
      NavigationService.navigate('PasscodeSettings');
      return;
    }

    if(!hasSafeWord) {
      //Navigate to safe word training screen
        NavigationService.navigate(RouteNames.HomeRoutes.SafeWordTraining);
      return;
    }

    // Validate the 4-digit passcode input
    if (passcodeInput.length !== 4) {
      Utills.showToast('Please enter a 4-digit passcode');
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
      return;
    }

    // Check if the passcode is correct
    const isValid = await verifyStoredPasscode(passcodeInput);

    if (isValid) {
      // Passcode is correct, proceed to safe word update
      Utills.showToast('Passcode verified!');
      setPasscodeInput(''); // Clear the input

      // Navigate to safe word input/update screen after short delay
      setTimeout(() => {
        NavigationService.navigate('SafeWordInput');
      }, 1000);
    } else {
      // Passcode is incorrect
      Utills.showToast('Incorrect passcode. Please try again.');
      setPasscodeError(true);
      setPasscodeInput(''); // Clear the input
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handlePasscodeInputChange = (text: string) => {
    // Only allow numbers and limit to 4 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
    setPasscodeInput(numericText);

    // Clear error state when user starts typing
    if (passcodeError) {
      setPasscodeError(false);
    }
  };

  // Show loading state while checking passcode
  if (isCheckingPasscode) {
    return (
      <MainContainer>
        <View style={styles.container}>
          <View style={styles.cardContainer}>
            <CustomText.RegularText customStyle={styles.loadingText}>
              Loading...
            </CustomText.RegularText>
          </View>
        </View>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <View style={styles.container}>
        {/* <VolumeAnimatedIcon
          baseSize={80}
          maxSize={120}
        /> */}
        <View style={styles.cardContainer}>
          <View style={styles.titleContainer}>
            <Image
              source={Images.Premium}
              style={styles.premiumIcon}
              resizeMode="contain"
            />
            <CustomText.RegularText customStyle={styles.textHeading}>
              Safe Word
            </CustomText.RegularText>
          </View>
          <View style={styles.line} />
          <CustomText.MediumText customStyle={styles.textSubheading}>
            {hasPasscode
              ? `Voice profile trained and safe word set to:`
              : "Safe word setup requires passcode protection:"
            }
          </CustomText.MediumText>

          {hasPasscode && (
            <>
              {/* TextInput to type the passcode with eye icon */}
              <View style={[styles.passcodeInputContainerAbsolute, passcodeError && styles.passcodeInputError]}>
                <TextInput
                  style={styles.passcodeTextInputAbsolute}
                  value={passcodeInput}
                  onChangeText={handlePasscodeInputChange}
                  placeholder="••••"
                  placeholderTextColor="#888888"
                  secureTextEntry={!isPasswordVisible}
                  keyboardType="numeric"
                  maxLength={4}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.eyeButtonAbsolute}
                  onPress={togglePasswordVisibility}
                >
                  <Image
                    source={isPasswordVisible ? Images.Eye : Images.Eye}
                    style={styles.eyeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <CustomText.RegularText customStyle={styles.boldSubheading}>
                This phrase will activate Rove even if your phone is locked. Say it during an emergency to start livestreaming and alert your responders.
              </CustomText.RegularText>

              <View style={styles.proTipContainer}>
                <CustomText.RegularText customStyle={styles.proTipEmoji}>
                  👉  <CustomText.RegularText customStyle={styles.proTipText}>
                    <CustomText.RegularText customStyle={styles.proTipBold}>
                      Pro tip:
                    </CustomText.RegularText>
                    {' '}You can also try it in a safe setting to see how it responds.
                  </CustomText.RegularText>
                </CustomText.RegularText>
              </View>
            </>
          )}

          {!hasPasscode && (
            <View style={styles.noPasscodeContainer}>
              <Image
                source={Images.Lock}
                style={styles.lockIcon}
                resizeMode="contain"
              />
              <CustomText.RegularText customStyle={styles.noPasscodeText}>
                Create a passcode to protect your safe word
              </CustomText.RegularText>
            </View>
          )}

          <PrimaryButton
            title={hasPasscode ? "Update safe word" : "Create passcode first"}
            onPress={ () => NavigationService.navigate(RouteNames.HomeRoutes.SafeWordTraining)}
            customStyles={[
              styles.setPasscodeButton,
              !hasPasscode && styles.createPasscodeButton
            ]}
            customTextStyle={styles.buttonText}
          />
        </View>
      </View>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Metrix.HorizontalSize(2),
    paddingTop: Metrix.VerticalSize(40),
    backgroundColor: 'transparent',
  },
  cardContainer: {
    backgroundColor: '#1d1d1d',
    borderRadius: Metrix.HorizontalSize(20),
    paddingHorizontal: Metrix.HorizontalSize(20),
    paddingVertical: Metrix.VerticalSize(10),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrix.VerticalSize(5),
  },
  premiumIcon: {
    width: Metrix.HorizontalSize(40),
    height: Metrix.VerticalSize(40),
    marginRight: Metrix.HorizontalSize(5),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  line: {
    width: '100%',
    height: 2,
    backgroundColor: '#666',
    marginBottom: 14
  },
  textHeading: {
    fontSize: normalizeFont(20),
    letterSpacing: 0.7,
    fontWeight: '600',
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
    marginTop: 5,
  },
  textSubheading: {
    fontSize: normalizeFont(17),
    letterSpacing: 0.7,
    fontWeight: '400',
    marginBottom: Metrix.VerticalSize(15),
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  passcodePromptText: {
    fontSize: normalizeFont(14),
    letterSpacing: 0.7,
    fontWeight: '500',
    marginBottom: Metrix.VerticalSize(10),
    lineHeight: 18,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  passcodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#303030',
    borderRadius: Metrix.HorizontalSize(12),
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: Metrix.VerticalSize(20),
  },
  passcodeInputError: {
    borderColor: '#ff3b30',
  },
  passcodeTextInput: {
    flex: 1,
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.VerticalSize(15),
    fontSize: normalizeFont(18),
    color: Utills.selectedThemeColors().PrimaryTextColor,
    letterSpacing: 8,
  },
  passcodeInputContainerAbsolute: {
    position: 'relative',
    backgroundColor: '#303030',
    borderRadius: Metrix.HorizontalSize(12),
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: Metrix.VerticalSize(20),
  },

  passcodeTextInputAbsolute: {
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.VerticalSize(15),
    fontSize: normalizeFont(18),
    color: Utills.selectedThemeColors().PrimaryTextColor,
    textAlign: 'center',
    textAlignVertical: 'center',
    letterSpacing: 8,
    includeFontPadding: false,
    lineHeight: normalizeFont(18) * 1.2,
  },
  eyeButtonAbsolute: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    padding: Metrix.HorizontalSize(15),
    justifyContent: 'center',
    alignItems: 'center',
  },

  eyeButton: {
    padding: Metrix.HorizontalSize(15),
  },
  eyeIcon: {
    width: Metrix.HorizontalSize(24),
    height: Metrix.VerticalSize(24),
    tintColor: '#CCCCCC',
  },
  boldSubheading: {
    fontSize: normalizeFont(17),
    // letterSpacing: 0.7,
    fontWeight: '400',
    marginBottom: Metrix.VerticalSize(15),
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  proTipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Metrix.VerticalSize(15),
  },
  proTipEmoji: {
    fontSize: normalizeFont(17),
    marginRight: Metrix.HorizontalSize(8),
    marginTop: Metrix.VerticalSize(2),
  },
  proTipText: {
    fontSize: normalizeFont(17),
    // letterSpacing: ,
    fontWeight: '400',
    lineHeight: 22,
    color: Utills.selectedThemeColors().PrimaryTextColor,
    flex: 1,
  },
  proTipBold: {
    fontWeight: '400',
    fontSize: normalizeFont(18),
  },
  noPasscodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A4A4A',
    borderRadius: Metrix.HorizontalSize(12),
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.VerticalSize(20),
    marginBottom: Metrix.VerticalSize(20),
  },
  lockIcon: {
    width: Metrix.HorizontalSize(24),
    height: Metrix.VerticalSize(24),
    tintColor: '#CCCCCC',
    marginRight: Metrix.HorizontalSize(12),
  },
  noPasscodeText: {
    fontSize: normalizeFont(15),
    color: '#CCCCCC',
    flex: 1,
  },
  setPasscodeButton: {
    marginTop: Metrix.VerticalSize(5),
    paddingHorizontal: Metrix.HorizontalSize(40),
    alignSelf: 'center',
    backgroundColor: '#6b6b6b',
    borderRadius: Metrix.HorizontalSize(8),
  },
  createPasscodeButton: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: normalizeFont(16),
    color: Utills.selectedThemeColors().PrimaryTextColor,
    textAlign: 'center',
  },
});