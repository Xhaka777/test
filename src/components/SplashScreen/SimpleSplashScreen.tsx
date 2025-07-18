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

const { width, height } = Dimensions.get('window');

interface SimpleSplashScreenProps {
  onFinish: () => void;
  duration?: number;
  backgroundColor?: string;
  logoSource?: any;
  title?: string;
}

const SimpleSplashScreen: React.FC<SimpleSplashScreenProps> = ({
  onFinish,
  duration = 3000,
  backgroundColor = '#000000',
  logoSource,
  title = 'Rove',
}) => {
  const [showContent, setShowContent] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    console.log('🎬 SimpleSplashScreen is rendering');
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after duration
    const timer = setTimeout(() => {
      console.log('⏰ Simple splash screen timer finished');
      handleFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleFinish = () => {
    console.log('✅ Simple splash screen finishing');
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
    <Animated.View style={[styles.container, { backgroundColor, opacity: fadeAnim }]}>
      <StatusBar hidden={true} />
      
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {logoSource && (
          <Image
            source={logoSource}
            style={styles.logo}
            resizeMode="contain"
            onError={(error) => {
              console.error('❌ Logo image error:', error);
            }}
            onLoad={() => console.log('✅ Logo loaded successfully')}
          />
        )}
        
        <Text style={styles.title}>{title}</Text>
        
        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
        </View>
      </Animated.View>
      
      {/* Debug overlay */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>
          Simple Splash Screen Active
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
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
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
});

export default SimpleSplashScreen;