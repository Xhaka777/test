import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
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
    // If you want the splash to finish when Lottie animation completes
    // instead of using the timer, uncomment the line below
    // handleFinish();
  };

  return (
    <Animated.View style={[styles.container, {backgroundColor, opacity: fadeAnim}]}>
      <StatusBar hidden={true} />
      
      <View style={styles.animationContainer}>
        {showAnimation && (
          <LottieAnimatedComponent
            src={animationSource}
            customStyle={styles.lottieStyle}
            speed={1}
            loop={false} // Set to false for splash screen
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
  animationContainer: {
    width: width * 0.8, // 80% of screen width
    height: height * 0.4, // 40% of screen height
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieStyle: {
    width: '100%',
    height: '100%',
  },
});