import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Images } from '../../config';

interface VolumeAnimatedIconProps {
  icon?: React.ReactNode;
  baseSize?: number;
  maxSize?: number;
  volume?: number;
}

export default function VolumeAnimatedIcon({
  icon,
  baseSize = 100, // Increased from 80 to 100
  maxSize = 150, // Increased from 120 to 150
  volume: externalVolume
}: VolumeAnimatedIconProps) {
  const [currentVolume, setCurrentVolume] = useState(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  // Use external volume if provided, otherwise use internal state
  const effectiveVolume = externalVolume !== undefined ? externalVolume : currentVolume;

  // Simulate volume changes if no external volume is provided
  useEffect(() => {
    if (externalVolume === undefined) {
      // Simulate random volume changes for demonstration
      const interval = setInterval(() => {
        const newVolume = Math.random();
        setCurrentVolume(newVolume);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [externalVolume]);

  // Separate shared values for glow opacity animation
  const glowOpacity = useSharedValue(0.6);
  
  // New shared value for background glow breathing animation
  const backgroundGlowScale = useSharedValue(0);

  // Main animation logic based on volume
  useEffect(() => {
    // Cancel any existing animations
    cancelAnimation(scale);
    cancelAnimation(opacity);
    cancelAnimation(glowOpacity);
    cancelAnimation(backgroundGlowScale);

    // Calculate base scale from volume (0-1 maps to 0.8-1.2)
    const minScale = 0.8;
    const maxScale = 1.2;
    const baseScale = minScale + (effectiveVolume * (maxScale - minScale));

    // Breathing intensity and speed based on volume
    const breathingIntensity = 0.1 + (effectiveVolume * 0.3); // 0.1 to 0.4 (more dramatic)
    const breathingDuration = 2000 - (effectiveVolume * 800); // 2000ms to 1200ms

    // Icon opacity based on volume (0.6 to 1.0)
    const targetOpacity = 0.6 + (effectiveVolume * 0.4);
    
    // Glow opacity based on volume (0.3 to 0.8)
    const targetGlowOpacity = 0.3 + (effectiveVolume * 0.5);

    // Set initial values
    scale.value = withTiming(baseScale, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    opacity.value = withTiming(targetOpacity, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    glowOpacity.value = withTiming(targetGlowOpacity, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    // Start breathing animation for background glow
    backgroundGlowScale.value = withRepeat(
      withSequence(
        // Start from 0 and expand to full size
        withTiming(1, {
          duration: breathingDuration * 0.6, // 60% of cycle for expansion
          easing: Easing.out(Easing.quad)
        }),
        // Shrink back to 0
        withTiming(0, {
          duration: breathingDuration * 0.4, // 40% of cycle for shrinking
          easing: Easing.in(Easing.quad)
        })
      ),
      -1,
      true
    );

    // Start dramatic breathing animation after initial transition
    setTimeout(() => {
      // Scale animation: expand -> shrink (zoom-out -> zoom-in)
      scale.value = withRepeat(
        withSequence(
          // Expand phase
          withTiming(baseScale + breathingIntensity, {
            duration: breathingDuration * 0.6, // 60% of cycle for expansion
            easing: Easing.out(Easing.quad)
          }),
          // Shrink phase (more dramatic)
          withTiming(baseScale - breathingIntensity * 0.8, {
            duration: breathingDuration * 0.4, // 40% of cycle for shrinking
            easing: Easing.in(Easing.quad)
          })
        ),
        -1,
        true
      );

      // Glow opacity animation: fade in during expand, fade out during shrink
      glowOpacity.value = withRepeat(
        withSequence(
          // Glow appears and intensifies during expansion
          withTiming(targetGlowOpacity * 1.5, {
            duration: breathingDuration * 0.6,
            easing: Easing.out(Easing.quad)
          }),
          // Glow fades out/disappears during shrink
          withTiming(targetGlowOpacity * 0.1, {
            duration: breathingDuration * 0.4,
            easing: Easing.in(Easing.quad)
          })
        ),
        -1,
        true
      );
    }, 300);

  }, [effectiveVolume]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * 1.2 }], // Same breathing as main icon
      opacity: glowOpacity.value * 0.4, // Use separate glow opacity
    };
  });

  const backgroundGlowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: backgroundGlowScale.value }], // Independent breathing animation
      opacity: glowOpacity.value * 0.2, // Use separate glow opacity
    };
  });

  return (
    <View style={styles.container}>
      {/* Background glow - now smaller and with breathing animation */}
      <Animated.View style={[
        styles.backgroundGlow,
        backgroundGlowStyle,
        { 
          width: baseSize + 6, 
          height: baseSize + 6,
          borderRadius: (baseSize + 6) / 2
        }
      ]} />

      {/* Outer glow rings - now white/transparent */}
      <Animated.View style={[
        styles.glowRing,
        styles.glowRing1,
        glowAnimatedStyle,
        { 
          width: baseSize + 16, 
          height: baseSize + 16,
          borderRadius: (baseSize + 16) / 2
        }
      ]} />
      <Animated.View style={[
        styles.glowRing,
        styles.glowRing2,
        glowAnimatedStyle,
        { 
          width: baseSize + 24, 
          height: baseSize + 24,
          borderRadius: (baseSize + 24) / 2
        }
      ]} />

      {/* Main Icon */}
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        {icon ? (
          <View style={{
            width: baseSize,
            height: baseSize,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {icon}
          </View>
        ) : (
          <View style={[styles.defaultIcon, { width: baseSize, height: baseSize, borderRadius: baseSize / 2 }]}>
            <Image
              source={Images.Premium}
              resizeMode="contain"
              style={{ width: baseSize * 0.8, height: baseSize * 0.8, tintColor: '#fff' }}
            />
          </View>
        )}
      </Animated.View>

      {/* Volume Indicator */}
      <View style={styles.volumeIndicator}>
        <View
          style={[
            styles.volumeBar,
            { width: `${effectiveVolume * 100}%` }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220, // Increased container width
    height: 240, // Increased container height
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff', // Changed to white
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 3,
  },
  defaultIcon: {
    backgroundColor: 'transparent', // Made transparent instead of blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff', // Changed to white
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  backgroundGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#ffffff', // Changed to white
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 1,
    zIndex: 1,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 1,
    // borderColor: '#fff', // Changed to white with transparency
    zIndex: 2,
  },
  glowRing1: {
    // borderColor: 'rgba(255, 255, 255, 0.4)', // Changed to white with transparency
  },
  glowRing2: {
    // borderColor: 'rgba(255, 255, 255, 0.2)', // Changed to white with transparency
  },
  volumeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 120,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  volumeBar: {
    height: '100%',
    backgroundColor: '#4A90E2', // Keeping the volume bar blue for contrast
    borderRadius: 3,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});