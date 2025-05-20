import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
} from 'react-native';
import {CustomText} from '..';
import {Metrix, Utills} from '../../config';

// if (
//   Platform.OS === 'android' &&
//   UIManager.setLayoutAnimationEnabledExperimental
// ) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

const MODE_WIDTH = Metrix.HorizontalSize(60);

type ModeSelectorProps = {
  threatModes: any;
  mode: any;
  setMode: any;
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  threatModes,
  mode,
  setMode,
}) => {
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const index: number = threatModes.findIndex(
      (item: any): boolean => item.key === mode,
    );
    Animated.spring(slideAnim, {
      toValue: index * MODE_WIDTH,
      useNativeDriver: true,
    }).start();
  }, [mode]);

  return (
    <View style={styles.modeContainer}>
      {threatModes.map((item: any, index: number) => (
        <TouchableOpacity
          key={index?.toString()}
          style={{
            width: MODE_WIDTH,
            alignItems: 'center',
            //   transform: [{translateX: slideAnim}],
          }}
          onPress={() => {
            // LayoutAnimation.configureNext(
            //   LayoutAnimation.Presets.easeInEaseOut,
            // );
            setMode(item.key);
          }}>
          <CustomText.RegularText
            customStyle={{
              fontWeight: '500',
              color:
                item.key === mode
                  ? Utills.selectedThemeColors().Yellow
                  : Utills.selectedThemeColors().PrimaryTextColor,
            }}>
            {item.key}
          </CustomText.RegularText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  modeContainer: {
    position: 'absolute',
    zIndex: 99,
    bottom: '27%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
