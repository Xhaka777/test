import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Modal,
  BackHandler,
} from 'react-native';
import { CustomText } from '../Text';
import { Images, Metrix, Utills, NavigationService } from '../../config';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/reducers';
import { HomeActions } from '../../redux/actions';
import { TUTORIAL_STEPS } from '../../config/tutorialSteps';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialProps {
  visible: boolean;
  onComplete: () => void;
  currentScreen: string;
  onNavigate?: (screen: string) => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ 
  visible, 
  onComplete, 
  currentScreen,
  onNavigate 
}) => {
  const dispatch = useDispatch();
  const currentTutorialStep = useSelector((state: RootState) => state.home.currentTutorialStep);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [showHighlight, setShowHighlight] = useState(false);

  const currentStep = TUTORIAL_STEPS.find(step => step.id === currentTutorialStep);
  const isCurrentScreen = currentStep?.screen === currentScreen;

  useEffect(() => {
    if (visible && isCurrentScreen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      updateProgress();
      
      // Show highlight after modal appears
      if (currentStep?.highlightElement) {
        setTimeout(() => setShowHighlight(true), 500);
      }
    } else {
      setShowHighlight(false);
    }
  }, [visible, currentTutorialStep, currentScreen]);

  // Prevent back button during tutorial
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible && isCurrentScreen) {
        return true; // Prevent back navigation
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, isCurrentScreen]);

  const updateProgress = () => {
    const progress = currentTutorialStep / TUTORIAL_STEPS.length;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleNext = () => {
    if (!currentStep) return;

    if (currentStep.action === 'navigate' && currentStep.navigationTarget) {
      // Navigate to next screen
      setShowHighlight(false);
      dispatch(HomeActions.setTutorialStep(currentTutorialStep + 1));
      
      if (onNavigate) {
        onNavigate(currentStep.navigationTarget);
      } else {
        NavigationService.navigate(currentStep.navigationTarget);
      }
    } else if (currentStep.action === 'complete') {
      // Complete tutorial
      handleComplete();
    } else {
      // Move to next step
      setShowHighlight(false);
      dispatch(HomeActions.setTutorialStep(currentTutorialStep + 1));
    }
  };

  const handleClose = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setShowHighlight(false);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      dispatch(HomeActions.setTutorialCompleted(true));
      onComplete();
    });
  };

  if (!visible || !isCurrentScreen || !currentStep) {
    return showHighlight && currentStep?.highlightElement ? (
      <TutorialHighlight
        targetElement={currentStep.highlightElement}
        highlightType={currentStep.highlightType}
        onPress={currentStep.isNavigationStep ? handleNext : undefined}
      />
    ) : null;
  }

  const isLastStep = currentTutorialStep === TUTORIAL_STEPS.length;
  const isNavigationStep = currentStep.isNavigationStep;

  return (
    <>
      <Modal visible={visible} transparent animationType="none">
        <View style={styles.overlay}>
          <Animated.View style={[styles.tutorialContainer, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Image
                  source={Images.Premium}
                  style={styles.premiumIcon}
                  resizeMode="contain"
                />
                <CustomText.LargeSemiBoldText customStyle={styles.title}>
                  {currentStep.title}
                </CustomText.LargeSemiBoldText>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Image
                  source={Images.Cross}
                  style={styles.closeIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Separator Line */}
            <View style={styles.separator} />

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <CustomText.RegularText customStyle={styles.description}>
                {currentStep.description}
              </CustomText.RegularText>
            </View>

            {/* Progress Bar and Next Button */}
            <View style={styles.bottomContainer}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
              <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                <CustomText.MediumText customStyle={styles.nextText}>
                  {isLastStep ? 'Get Started' : 
                   isNavigationStep ? 'Guide Me' : 'Next'}
                </CustomText.MediumText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Highlight Overlay */}
      {showHighlight && currentStep.highlightElement && (
        <TutorialHighlight
          targetElement={currentStep.highlightElement}
          highlightType={currentStep.highlightType}
          onPress={currentStep.isNavigationStep ? handleNext : undefined}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Metrix.HorizontalSize(20),
      zIndex: 1000,
    },
    tutorialContainer: {
      backgroundColor: Utills.selectedThemeColors().Base,
      borderRadius: Metrix.HorizontalSize(16),
      padding: Metrix.HorizontalSize(20),
      width: '100%',
      maxWidth: Metrix.HorizontalSize(340),
      ...Metrix.createShadow,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Metrix.VerticalSize(16),
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    premiumIcon: {
      width: Metrix.HorizontalSize(24),
      height: Metrix.VerticalSize(24),
      tintColor: Utills.selectedThemeColors().TertiaryTextColor,
      marginRight: Metrix.HorizontalSize(8),
    },
    title: {
      color: Utills.selectedThemeColors().PrimaryTextColor,
      fontWeight: '700',
      flex: 1,
    },
    closeButton: {
      padding: Metrix.HorizontalSize(4),
    },
    closeIcon: {
      width: Metrix.HorizontalSize(20),
      height: Metrix.VerticalSize(20),
      tintColor: Utills.selectedThemeColors().SecondaryTextColor,
    },
    separator: {
      height: 1,
      backgroundColor: Utills.selectedThemeColors().TextInputBorderColor,
      marginBottom: Metrix.VerticalSize(20),
    },
    descriptionContainer: {
      marginBottom: Metrix.VerticalSize(24),
    },
    description: {
      color: Utills.selectedThemeColors().PrimaryTextColor,
      lineHeight: 22,
      textAlign: 'center',
    },
    bottomContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Metrix.HorizontalSize(16),
    },
    progressContainer: {
      flex: 1,
    },
    progressBackground: {
      height: Metrix.VerticalSize(4),
      backgroundColor: Utills.selectedThemeColors().TextInputBorderColor,
      borderRadius: Metrix.HorizontalSize(2),
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#007AFF',
      borderRadius: Metrix.HorizontalSize(2),
    },
    nextButton: {
      backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
      paddingVertical: Metrix.VerticalSize(12),
      paddingHorizontal: Metrix.HorizontalSize(24),
      borderRadius: Metrix.HorizontalSize(8),
    },
    nextText: {
      color: Utills.selectedThemeColors().Base,
      fontWeight: '600',
      fontSize: Metrix.customFontSize(16),
    },
    highlightOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
    },
    highlightArea: {
      // Dynamic styles applied in getHighlightStyle
    },
  });