import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import {PasscodeSettingsProps} from '../../propTypes';
import {
  BackHeader,
  CustomText,
  MainContainer,
  PrimaryButton,
} from '../../../components';
import { PasscodeInput } from '../../../components'; 
import {Images, Metrix, Utills, NavigationService} from '../../../config';
import {Image} from 'react-native';
import {normalizeFont} from '../../../config/metrix';

export const PasscodeSettings: React.FC<PasscodeSettingsProps> = ({}) => {
  const [passcode, setPasscode] = useState('');
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showError, setShowError] = useState(false);

  const handlePasscodeComplete = (enteredPasscode: string) => {
    if (!isConfirming) {
      // First time entering passcode
      setPasscode(enteredPasscode);
      setIsConfirming(true);
    } else {
      // Confirming passcode
      if (enteredPasscode === passcode) {
        // Success - passcodes match
        Utills.showToast('Passcode set successfully!');
        
        // Navigate back to Settings after a short delay
        setTimeout(() => {
          NavigationService.goBack();
        }, 1000);
        
      } else {
        // Error - passcodes don't match
        Utills.showToast('Passcodes do not match. Please try again.');
        setShowError(true);
        
        // Reset to start over after showing error
        setTimeout(() => {
          setShowError(false);
          setIsConfirming(false);
          setPasscode('');
        }, 1500);
      }
    }
  };

  const handleBackFromPasscode = () => {
    if (isConfirming) {
      setIsConfirming(false);
      setPasscode('');
    } else {
      setIsSettingPasscode(false);
      setPasscode('');
    }
  };

  if (!isSettingPasscode) {
    return (
      <MainContainer>
        <View style={styles.container}>
            <View style={styles.titleContainer}>
              <Image
                source={Images.Premium}
                style={styles.premiumIcon}
                resizeMode="contain"
              />
              <CustomText.RegularText customStyle={styles.textHeading}>
                Set Your Passcode
              </CustomText.RegularText>
            </View>
          <View style={styles.cardContainer}>
            
            <CustomText.RegularText customStyle={styles.textSubheading}>
              Your passcode controls how files are deleted and keeps your files safe even if you are forced to delete them under threat.
            </CustomText.RegularText>
            
            <CustomText.RegularText customStyle={styles.textSubheading}>
              Entering <CustomText.RegularText customStyle={styles.highlightedText}>ANY incorrect passcode</CustomText.RegularText> will delete local files only, while the cloud backup stays safe for your responders to access.
            </CustomText.RegularText>
            
            <CustomText.RegularText customStyle={styles.boldSubheading}>
              If you want to truly delete a file:
            </CustomText.RegularText>
            
            <CustomText.RegularText customStyle={styles.textSubheading}>
              Enter your <CustomText.RegularText customStyle={styles.highlightedText}>correct passcode</CustomText.RegularText> to erase both local and cloud files. This way, you're always protected - even under pressure.
            </CustomText.RegularText>
            
            <PrimaryButton
              title="Set passcode"
            //   color= {Utills.selectedThemeColors().Primary}
              onPress={() => setIsSettingPasscode(true)}
              customStyles={styles.setPasscodeButton}
              customTextStyle={styles.buttonText}
            />
          </View>
        </View>
      </MainContainer>
    );
  }

  return (
    <PasscodeInput
      title={isConfirming ? "Confirm your passcode" : "Enter your passcode"}
      onPasscodeComplete={handlePasscodeComplete}
      onBack={handleBackFromPasscode}
      showError={showError}
      isConfirmation={isConfirming}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Metrix.HorizontalSize(2),
    paddingTop: Metrix.VerticalSize(40),
    backgroundColor: 'transparent', // Transparent to show black background
  },
  cardContainer: {
    backgroundColor: '#333333', // Gray card background
    borderRadius: Metrix.HorizontalSize(20),
    paddingHorizontal: Metrix.HorizontalSize(20),
    paddingVertical: Metrix.VerticalSize(30),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrix.VerticalSize(5),
  },
  premiumIcon: {
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    marginRight: Metrix.HorizontalSize(5),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  textHeading: {
    fontSize: normalizeFont(18),
    letterSpacing: 0.7,
    fontWeight: '600',
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  textSubheading: {
    fontSize: normalizeFont(15),
    letterSpacing: 0.7,
    fontWeight: '400',
    marginBottom: Metrix.VerticalSize(15),
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  boldSubheading: {
    fontSize: normalizeFont(15),
    letterSpacing: 0.7,
    fontWeight: '700', // bolder
    marginBottom: Metrix.VerticalSize(15),
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
  highlightedText: {
    fontWeight: '600',
    color: Utills.selectedThemeColors().Blue,
  },
  setPasscodeButton: {
    marginTop: Metrix.VerticalSize(30),
    width: '50%', // Made smaller from 100% to 60%
    alignSelf: 'center', // Center the button horizontally
    backgroundColor: '#60636c',
    borderRadius: Metrix.HorizontalSize(8), // Less radius, more rectangular

  },
  buttonText: {
    color: '#FFFFFF', // White text color
    fontWeight: '600',
  },
});