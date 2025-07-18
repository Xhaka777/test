import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import {LottieAnimatedComponent} from '../LottieAnimatedComponent';
import {Utills} from '../../config';

const {width, height} = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
  animationSource: any; // Your Lottie JSON file
  duration?: number; // Duration in milliseconds
  backgroundColor?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  animationSource,
  duration = 3000,
  backgroundColor = Utills.selectedThemeColors().Base,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Auto finish after duration
    const timer = setTimeout(() => {
      handleFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleFinish = () => {
    setShowAnimation(false);
    
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  const handleLottieFinish = () => {
    // Optional: finish when Lottie animation completes
    console.log('Lottie animation finished');
  };

  return (
    <Animated.View style={[styles.container, {backgroundColor, opacity: fadeAnim}]}>
      <StatusBar hidden={true} />
      
      {/* Debug text to ensure splash is showing */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Loading...</Text>
      </View>
      
      <View style={styles.animationContainer}>
        {showAnimation && animationSource && (
          <LottieAnimatedComponent
            src={animationSource}
            customStyle={styles.lottieStyle}
            speed={1}
            loop={true} // Changed to true for better visibility
            autoPlay={true}
            onAnimationFinish={handleLottieFinish}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  debugContainer: {
    position: 'absolute',
    top: height * 0.3,
    alignItems: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  animationContainer: {
    width: width * 0.6, // Reduced size for better visibility
    height: height * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Debug background
    borderRadius: 10,
  },
  lottieStyle: {
    width: '100%',
    height: '100%',
  },
});