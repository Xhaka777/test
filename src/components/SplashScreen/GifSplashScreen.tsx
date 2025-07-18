import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  Animated,
  Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';

const { width, height } = Dimensions.get('window');

interface GifSplashScreenProps {
  onFinish: () => void;
  duration?: number;
  gifSource?: any;
}

const GifSplashScreen: React.FC<GifSplashScreenProps> = ({
  onFinish,
  duration = 4000,
  gifSource,
}) => {
  const [showContent, setShowContent] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('🎬 GifSplashScreen is rendering');
    
    const timer = setTimeout(() => {
      console.log('⏰ GIF Splash screen timer finished');
      handleFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleFinish = () => {
    console.log('✅ GIF Splash screen finishing');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowContent(false);
      onFinish();
    });
  };

  if (!showContent) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar hidden={true} />
      
      {/* Use FastImage with high quality settings */}
      {gifSource ? (
        <FastImage
          source={gifSource}
          style={styles.animation}
          resizeMode={FastImage.resizeMode.contain}
          priority={FastImage.priority.high}
          cache={FastImage.cacheControl.immutable}
          onError={(error) => {
            console.error('❌ FastImage GIF error:', error);
          }}
          onLoad={() => console.log('✅ FastImage GIF loaded successfully')}
        />
      ) : (
        /* Fallback to regular Image component with better settings */
        <Image
          source={require('../../assets/animations/splash.gif')}
          style={styles.animation}
          resizeMode="cover"
          fadeDuration={0}
          onError={(error) => {
            console.error('❌ Regular Image GIF error:', error);
          }}
          onLoad={() => console.log('✅ Regular Image GIF loaded successfully')}
        />
      )}
      
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  animation: {
    width: width,
    height: height,
  },
});

export default GifSplashScreen;