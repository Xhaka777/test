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
import { PasscodeInput, getPasscodeFromStorage } from '../../../components';
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
    checkInitialSetup();
  }, []);

  // Add focus listener to refresh data when returning from PasscodeInput
  useEffect(() => {
    const unsubscribe = NavigationService.addListener?.('focus', () => {
      checkInitialSetup();
    });

    return unsubscribe;
  }, []);

  const checkInitialSetup = async () => {
    setIsCheckingPasscode(true);
    try {
      const existingPasscode = await getPasscodeFromStorage();
      const existingSafeWord = await getSafeWordFromStorage();

      console.log('Passcode exists:', !!existingPasscode);
      console.log('Safe word exists:', !!existingSafeWord);

      // If no passcode exists, immediately redirect to PasscodeSettings
      if (!existingPasscode) {
        console.log('No passcode found, redirecting to PasscodeSettings...');
        NavigationService.navigate(RouteNames.HomeRoutes.PasscodeSettings);
        return;
      }

      // Only set state if passcode exists
      setHasPasscode(true);
      setHasSafeWord(!!existingSafeWord);
      setSafeWord(existingSafeWord || '');

    } catch (error) {
      console.error('Error checking setup:', error);
      // On error, also redirect to PasscodeSettings to be safe
      NavigationService.navigate(RouteNames.HomeRoutes.PasscodeSettings);
      return;
    } finally {
      setIsCheckingPasscode(false);
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

  // Add the missing verifyStoredPasscode function
  const verifyStoredPasscode = async (inputPasscode: string): Promise<boolean> => {
    try {
      const storedPasscode = await AsyncStorage.getItem(PASSCODE_KEY);
      console.log('Verifying passcode...');
      console.log('Input:', inputPasscode);
      console.log('Stored:', storedPasscode);
      console.log('Match:', storedPasscode === inputPasscode);
      return storedPasscode === inputPasscode;
    } catch (error) {
      console.error('Error verifying passcode:', error);
      return false;
    }
  };

  const handleUpdateSafeWord = async () => {
    // Since we only reach here if hasPasscode is true, validate the entered passcode
    if (passcodeInput.length !== 4) {
      Utills.showToast('Please enter a 4-digit passcode');
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
      return;
    }

    setIsVerifyingPasscode(true);

    try {
      const isValid = await verifyStoredPasscode(passcodeInput);

      if (isValid) {
        // Passcode is correct, proceed to safe word training
        Utills.showToast('Passcode verified!', null, 'success');
        setPasscodeInput(''); // Clear the input
        setPasscodeError(false);

        // Navigate to safe word training after short delay
        setTimeout(() => {
          NavigationService.navigate(RouteNames.HomeRoutes.SafeWordTraining);
        }, 1000);
      } else {
        // Passcode is incorrect
        Utills.showToast('Incorrect passcode. Please try again.', null, 'error');
        setPasscodeError(true);
        setPasscodeInput(''); // Clear the input
        setTimeout(() => setPasscodeError(false), 2000);
      }
    } catch (error) {
      console.error('Error verifying passcode:', error);
      Utills.showToast('Error verifying passcode. Please try again.', null, 'error');
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
    } finally {
      setIsVerifyingPasscode(false);
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
            Voice profile trained and safe word set to:
          </CustomText.MediumText>

          {/* Display current safe word if it exists */}
          {hasSafeWord && (
            <View style={styles.currentSafeWordContainer}>
              <CustomText.RegularText customStyle={styles.currentSafeWordLabel}>
                Current Safe Word:
              </CustomText.RegularText>
              <CustomText.RegularText customStyle={styles.currentSafeWord}>
                "{safeWord}"
              </CustomText.RegularText>
            </View>
          )}

          {/* Passcode input for verification */}
          <CustomText.RegularText customStyle={styles.passcodePromptText}>
            Enter your 4-digit passcode to {hasSafeWord ? 'update' : 'set'} safe word:
          </CustomText.RegularText>

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
              editable={!isVerifyingPasscode}
            />
            <TouchableOpacity
              style={styles.eyeButtonAbsolute}
              onPress={togglePasswordVisibility}
              disabled={isVerifyingPasscode}
            >
              <Image
                source={isPasswordVisible ? Images.EyeAbleIcon : Images.EyeDisableIcon}
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

          {/* Button */}
          <PrimaryButton
            title={
              isVerifyingPasscode
                ? "Verifying..."
                : `${hasSafeWord ? 'Update' : 'Set'} safe word`
            }
            onPress={handleUpdateSafeWord}
            customStyles={[
              styles.setPasscodeButton,
              isVerifyingPasscode && styles.disabledButton
            ]}
            customTextStyle={styles.buttonText}
            disabled={isVerifyingPasscode}
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
    tintColor: '#57b5fa',
  },
  line: {
    width: '100%',
    height: 2,
    backgroundColor: '#666',
    marginBottom: 14
  },
  textHeading: {
    fontSize: normalizeFont(25),
    letterSpacing: 0.7,
    fontWeight: '600',
    // lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
    // marginTop: 5,
  },
  textSubheading: {
    fontSize: normalizeFont(17),
    letterSpacing: 0.7,
    fontWeight: '400',
    marginBottom: Metrix.VerticalSize(15),
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  currentSafeWordContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: Metrix.HorizontalSize(12),
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.VerticalSize(15),
    marginBottom: Metrix.VerticalSize(20),
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  currentSafeWordLabel: {
    fontSize: normalizeFont(14),
    color: '#CCCCCC',
    marginBottom: Metrix.VerticalSize(5),
  },
  currentSafeWord: {
    fontSize: normalizeFont(18),
    fontWeight: '600',
    color: '#4CAF50',
  },
  passcodePromptText: {
    fontSize: normalizeFont(14),
    letterSpacing: 0.7,
    fontWeight: '500',
    marginBottom: Metrix.VerticalSize(10),
    lineHeight: 18,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  passcodeInputContainerAbsolute: {
    position: 'relative',
    backgroundColor: '#303030',
    borderRadius: Metrix.HorizontalSize(12),
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: Metrix.VerticalSize(20),
  },
  passcodeInputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#ff3b301a',
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
  eyeIcon: {
    width: Metrix.HorizontalSize(24),
    height: Metrix.VerticalSize(24),
    tintColor: '#CCCCCC',
  },
  boldSubheading: {
    fontSize: normalizeFont(17),
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
    fontWeight: '400',
    lineHeight: 22,
    color: Utills.selectedThemeColors().PrimaryTextColor,
    flex: 1,
  },
  proTipBold: {
    fontWeight: '600',
    fontSize: normalizeFont(17),
  },
  // Updated no passcode container styles
  noPasscodeContainer: {
    marginBottom: Metrix.VerticalSize(20),
  },
  noPasscodeContent: {
    alignItems: 'center',
    paddingVertical: Metrix.VerticalSize(30),
  },
  lockIcon: {
    width: Metrix.HorizontalSize(50),
    height: Metrix.VerticalSize(50),
    tintColor: '#666',
    marginBottom: Metrix.VerticalSize(15),
    opacity: 0.7,
  },
  noPasscodeTitle: {
    fontSize: normalizeFont(18),
    color: Utills.selectedThemeColors().PrimaryTextColor,
    fontWeight: '600',
    marginBottom: Metrix.VerticalSize(10),
    textAlign: 'center',
  },
  noPasscodeText: {
    fontSize: normalizeFont(15),
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Metrix.HorizontalSize(20),
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
  disabledButton: {
    backgroundColor: '#4A4A4A',
    opacity: 0.6,
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