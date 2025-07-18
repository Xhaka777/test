import React from 'react';
import {View, ViewStyle} from 'react-native';
import Lottie from 'lottie-react-native';

interface LottieAnimatedComponentProps {
  src: any;
  customStyle?: ViewStyle;
  speed?: number;
  loop?: boolean;
  autoPlay?: boolean;
  onAnimationFinish?: () => void;
}

export const LottieAnimatedComponent: React.FC<LottieAnimatedComponentProps> = ({
  src,
  customStyle,
  speed = 1,
  loop = true,
  autoPlay = true,
  onAnimationFinish,
}) => {
  return (
    <View style={customStyle}>
      <Lottie
        source={src}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={{width: '100%', height: '100%'}}
        onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
};