import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  Animated,
} from 'react-native';
import Lottie from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface LottieSplashScreenProps {
  onFinish: () => void;
  duration?: number;
  animationSource?: any;
  backgroundColor?: string;
}

const LottieSplashScreen: React.FC<LottieSplashScreenProps> = ({
  onFinish,
  duration = 4000,
  animationSource,
  backgroundColor = '#000000',
}) => {
  const [showContent, setShowContent] = useState(true);
  const [animationLoaded, setAnimationLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Lottie>(null);

  useEffect(() => {
    console.log('🎬 LottieSplashScreen is rendering');
    console.log('📁 Animation source provided:', animationSource ? 'YES' : 'NO');
    
    // Auto-hide after duration
    const timer = setTimeout(() => {
      console.log('⏰ Lottie Splash screen timer finished');
      handleFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleFinish = () => {
    console.log('✅ Lottie Splash screen finishing');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowContent(false);
      onFinish();
    });
  };

  const handleAnimationFinish = () => {
    console.log('🎭 Lottie animation finished playing');
    // Optionally finish splash when animation completes
    // handleFinish();
  };

  if (!showContent) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity: fadeAnim }]}>
      <StatusBar hidden={true} />
      
      {animationSource ? (
        <View style={styles.animationContainer}>
          <Lottie
            ref={animationRef}
            source={animationSource}
            autoPlay={true}
            loop={true}
            style={styles.animation}
            resizeMode="contain"
            onAnimationFinish={handleAnimationFinish}
            onError={(error) => {
              console.error('❌ Lottie animation error:', error);
              setAnimationLoaded(false);
            }}
            onLoad={() => {
              console.log('✅ Lottie animation loaded successfully');
              setAnimationLoaded(true);
            }}
            // Additional props for better compatibility
            renderMode="AUTOMATIC"
            enableMergePathsAndroidForKitKatAndAbove={true}
            speed={1}
          />
          
          {/* Show loading text if animation hasn't loaded */}
          {!animationLoaded && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading Animation...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>No Animation Source</Text>
        </View>
      )}
      
      {/* Debug info */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>
          Lottie Splash • Loaded: {animationLoaded ? 'YES' : 'NO'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  animationContainer: {
    width: width * 0.9,
    height: height * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  debugOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
});

export default LottieSplashScreen;