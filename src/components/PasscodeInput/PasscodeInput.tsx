// Create this file: src/components/PasscodeInput/index.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CustomText } from '../index';
import { Metrix, Utills, Images } from '../../config';
import { normalizeFont } from '../../config/metrix';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');

interface KeypadButton {
  number: string;
  letters?: string;
}

interface PasscodeInputProps {
  title: string;
  onPasscodeComplete: (passcode: string) => void;
  onBack?: () => void;
  expectedPasscode?: string;
  showError?: boolean;
  isConfirmation?: boolean;
}

const keypadData: KeypadButton[] = [
  { number: '1', letters: '' },
  { number: '2', letters: 'ABC' },
  { number: '3', letters: 'DEF' },
  { number: '4', letters: 'GHI' },
  { number: '5', letters: 'JKL' },
  { number: '6', letters: 'MNO' },
  { number: '7', letters: 'PQRS' },
  { number: '8', letters: 'TUV' },
  { number: '9', letters: 'WXYZ' },
];

export const PasscodeInput: React.FC<PasscodeInputProps> = ({
  title,
  onPasscodeComplete,
  onBack,
  expectedPasscode,
  showError = false,
  isConfirmation = false,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isError, setIsError] = useState(false);

  // Calculate responsive dimensions
  const buttonSize = Math.min(width * 0.18, 75); // 18% of screen width, max 75
  const buttonMargin = width * 0.04; // 4% of screen width for better spacing
  const keypadWidth = (buttonSize * 3) + (buttonMargin * 4); // 3 buttons + 4 margins

  useEffect(() => {
    if (showError) {
      setIsError(true);
      setPasscode('');
      setTimeout(() => setIsError(false), 1000);
    }
  }, [showError]);

  // Clear passcode when title changes (for confirmation step)
  useEffect(() => {
    setPasscode('');
  }, [title]);

  const handleNumberPress = (number: string) => {
    if (passcode.length < 4) {
      const newPasscode = passcode + number;
      setPasscode(newPasscode);
      
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }
      
      // Auto-submit when 4 digits entered
      if (newPasscode.length === 4) {
        setTimeout(() => {
          onPasscodeComplete(newPasscode);
          // Clear passcode immediately after submitting for next input
          setPasscode('');
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    if (passcode.length > 0) {
      setPasscode(passcode.slice(0, -1));
    }
  };

  const renderPasscodeDots = () => {
    const dotSize = Math.min(width * 0.04, 16);
    const dotSpacing = width * 0.08; // Increased spacing between dots
    
    return (
      <View style={[styles.dotsContainer, { gap: dotSpacing }]}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                backgroundColor: 'transparent',
              },
              passcode.length > index && {
                backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
                borderColor: Utills.selectedThemeColors().PrimaryTextColor,
              },
              isError && {
                borderColor: '#ff3b30',
                backgroundColor: 'transparent',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypadButton = ({ number, letters }: KeypadButton) => (
    <TouchableOpacity
      key={number}
      style={[
        styles.keypadButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        }
      ]}
      onPress={() => handleNumberPress(number)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.buttonContainer,
        {
          borderRadius: buttonSize / 2,
        }
      ]}>
        <Text style={[
          styles.numberText,
          { fontSize: normalizeFont(buttonSize * 0.45) }
        ]}>
          {number}
        </Text>
        {letters && (
          <Text style={[
            styles.lettersText,
            { fontSize: normalizeFont(buttonSize * 0.125) }
          ]}>
            {letters}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          Utills.selectedThemeColors().Base || '#000000',
          '#1a1a2e',
          '#16213e'
        ]}
        style={styles.background}
      />
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
      
        <View style={styles.header}>
          <CustomText.LargeSemiBoldText customStyle={styles.title}>
            {title}
          </CustomText.LargeSemiBoldText>
        </View>

        {renderPasscodeDots()}

        <View style={[styles.keypadContainer, { width: keypadWidth, paddingHorizontal: buttonMargin }]}>
          {/* Numbers 1-9 in 3x3 grid */}
          <View style={[styles.keypadGrid, { gap: buttonMargin }]}>
            {keypadData.map((item) => renderKeypadButton(item))}
          </View>
          
          {/* Bottom row with 0 */}
          <View style={[styles.bottomRow, { marginTop: buttonMargin * 1.5, gap: buttonMargin }]}>
            <View style={{ width: buttonSize, height: buttonSize }} />
            <TouchableOpacity
              style={[
                styles.keypadButton,
                {
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: buttonSize / 2,
                }
              ]}
              onPress={() => handleNumberPress('0')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.buttonContainer,
                {
                  borderRadius: buttonSize / 2,
                }
              ]}>
                <Text style={[
                  styles.numberText,
                  { fontSize: normalizeFont(buttonSize * 0.45) }
                ]}>
                  0
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                {
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: buttonSize / 2,
                }
              ]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.deleteText,
                { fontSize: normalizeFont(buttonSize * 0.35) }
              ]}>
                ⌫
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Metrix.HorizontalSize(40),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  header: {
    marginBottom: Metrix.VerticalSize(60),
  },
  title: {
    fontSize: normalizeFont(24),
    color: Utills.selectedThemeColors().PrimaryTextColor,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '300',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Metrix.VerticalSize(80),
  },
  keypadContainer: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButton: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  numberText: {
    color: Utills.selectedThemeColors().PrimaryTextColor,
    textAlign: 'center',
    fontWeight: '200',
  },
  lettersText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: -4,
    fontWeight: '400',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: Utills.selectedThemeColors().PrimaryTextColor,
    fontWeight: '300',
  },
  backButton: {
    position: 'absolute',
    top: Metrix.VerticalSize(60),
    left: Metrix.HorizontalSize(20),
    width: Metrix.HorizontalSize(40),
    height: Metrix.VerticalSize(40),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Metrix.HorizontalSize(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backIcon: {
    width: Metrix.HorizontalSize(20),
    height: Metrix.VerticalSize(20),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
    transform: [{rotate: '180deg'}],
  },
});