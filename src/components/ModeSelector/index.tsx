// import React, {useRef, useState} from 'react';
// import {
//   View,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   TouchableOpacity,
//   NativeScrollEvent,
//   NativeSyntheticEvent,
// } from 'react-native';
// import {CustomText} from '..';
// import {FontType, Utills} from '../../config';

// const {width} = Dimensions.get('window');
// const MODES = ['AUDIO', 'VIDEO'];

// type ModeSelectorProps = {
//   mode: any;
//   setMode: any;
// };

// export const ModeSelector: React.FC<ModeSelectorProps> = ({mode, setMode}) => {
//   const [selectedIndex, setSelectedIndex] = useState(0); // default to AUDIO
//   const flatListRef = useRef<FlatList<any>>(null);

//   const scrollToIndex = (index: number) => {
//     flatListRef.current?.scrollToOffset({
//       offset: index * (width / 3),
//       animated: true,
//     });
//     setSelectedIndex(index);
//     MODES[index] == 'AUDIO' ? setMode('VIDEO') : setMode('AUDIO');
//   };

//   const handleMomentumScrollEnd = (
//     event: NativeSyntheticEvent<NativeScrollEvent>,
//   ) => {
//     const offsetX = event.nativeEvent.contentOffset.x;
//     const index = Math.round(offsetX / (width / 3));
//     setSelectedIndex(index);
//     MODES[index] == 'AUDIO' ? setMode('VIDEO') : setMode('AUDIO');
//   };

//   const renderItem = ({item, index}: {item: string; index: number}) => {
//     const isSelected = index === selectedIndex;
//     return (
//       <TouchableOpacity
//         onPress={() => scrollToIndex(index)}
//         style={styles.itemContainer}>
//         <CustomText.RegularText
//           style={[styles.itemText, isSelected && styles.selectedText]}>
//           {item}
//         </CustomText.RegularText>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <FlatList
//         ref={flatListRef}
//         data={MODES}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={width / 3}
//         decelerationRate="fast"
//         bounces={true}
//         contentContainerStyle={{
//           paddingHorizontal: width / 3,
//         }}
//         onMomentumScrollEnd={handleMomentumScrollEnd}
//         keyExtractor={item => item}
//         renderItem={renderItem}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     zIndex: 99,
//     bottom: '19%',
//     alignSelf: 'center',
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   itemContainer: {
//     width: width / 4,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   itemText: {
//     color: Utills.selectedThemeColors().PrimaryTextColor,
//     fontWeight: '600',
//   },
//   selectedText: {
//     color: Utills.selectedThemeColors().Yellow,
//   },
// });

import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {CustomText} from '..';
import {Metrix, Utills} from '../../config';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const handleMomentumScrollEnd = (event: any) => {
    console.log('Scroll', event);
  };

  return (
    <View style={styles.modeContainer}>
      {threatModes.map((item: any, index: number) => (
        <TouchableOpacity
          key={index?.toString()}
          style={{
            width: MODE_WIDTH,
            alignItems: 'center',
            transform: [{translateX: slideAnim}],
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
    bottom: '18%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
