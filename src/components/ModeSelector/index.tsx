import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {Metrix} from '../../config';

const {width} = Dimensions.get('window');
const MODES = ['AUDIO', 'VIDEO'];

type ModeSelectorProps = {};

export const ModeSelector: React.FC<ModeSelectorProps> = ({}) => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(2); // default is 'PHOTO'

  const onScrollEnd = e => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const scrollToIndex = index => {
    scrollRef.current.scrollTo({x: index * width, animated: true});
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}>
        {MODES.map((mode, index) => (
          <View key={index} style={styles.page}></View>
        ))}
      </ScrollView>
      <View style={styles.selectorContainer}>
        {MODES.map((mode, index) => (
          <TouchableOpacity key={index} onPress={() => scrollToIndex(index)}>
            <Text
              style={[
                styles.selectorText,
                activeIndex === index && styles.activeText,
              ]}>
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '17%',
    zIndex: 99,
  },
  page: {
    width,
    height: Metrix.VerticalSize(50),
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectorContainer: {
    position: 'absolute',
    bottom: '40%',
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
    paddingVertical: Metrix.VerticalSize(3),
  },
  selectorText: {
    fontSize: 16,
    color: '#888',
  },
  activeText: {
    color: 'yellow',
    fontWeight: 'bold',
  },
});

// import React, {useRef, useEffect, useState} from 'react';
// import {
//   View,
//   TouchableOpacity,
//   Animated,
//   LayoutAnimation,
//   UIManager,
//   Platform,
//   StyleSheet,
//   ScrollView,
// } from 'react-native';
// import {CustomText} from '..';
// import {Metrix, Utills} from '../../config';

// if (
//   Platform.OS === 'android' &&
//   UIManager.setLayoutAnimationEnabledExperimental
// ) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// const MODE_WIDTH = Metrix.HorizontalSize(60);

// type ModeSelectorProps = {
//   threatModes: any;
//   mode: any;
//   setMode: any;
//   setModeMsg: any;
// };

// export const ModeSelector: React.FC<ModeSelectorProps> = ({
//   threatModes,
//   mode,
//   setMode,
//   setModeMsg,
// }) => {
//   const slideAnim = useRef(new Animated.Value(30)).current;

//   useEffect(() => {
//     const index: number = threatModes.findIndex(
//       (item: any): boolean => item.key === mode,
//     );
//     Animated.spring(slideAnim, {
//       toValue: index * MODE_WIDTH,
//       useNativeDriver: true,
//     }).start();
//   }, [mode]);

//   const handleMomentumScrollEnd = (event: any) => {
//     console.log('Scroll', event);
//   };

//   return (
//     <View style={styles.modeContainer}>
//       {threatModes.map((item: any, index: number) => (
//         <TouchableOpacity
//           key={index?.toString()}
//           style={{
//             width: MODE_WIDTH,
//             alignItems: 'center',
//             transform: [{translateX: slideAnim}],
//           }}
//           onPress={() => {
//             // LayoutAnimation.configureNext(
//             //   LayoutAnimation.Presets.easeInEaseOut,
//             // );
//             setMode(item.key);
//             item?.key == 'AUDIO'
//               ? setModeMsg('Recipients will get: Audio Stream')
//               : setModeMsg('Recipients will get: Video Stream');
//           }}>
//           <CustomText.RegularText
//             customStyle={{
//               fontWeight: '500',
//               color:
//                 item.key === mode
//                   ? Utills.selectedThemeColors().Yellow
//                   : Utills.selectedThemeColors().PrimaryTextColor,
//             }}>
//             {item.key}
//           </CustomText.RegularText>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   modeContainer: {
//     position: 'absolute',
//     zIndex: 99,
//     bottom: '18%',
//     alignSelf: 'center',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//   },
// });
