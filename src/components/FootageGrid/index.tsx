import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../config';
import {CustomText} from '..';
import moment from 'moment';
import RNFS from 'react-native-fs';
import {createThumbnail} from 'react-native-create-thumbnail';

type FootageGridProps = {
  item?: any;
};

export const FootageGrid: React.FC<FootageGridProps> = ({item}) => {
  const [footages, setFootages] = useState<any>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const isOlderThan7Days = moment().diff(moment(item?.createdAt), 'days') >= 7;

  // Fetch video files once when the component is mounted
  useEffect(() => {
    const getVideoFiles = async () => {
      try {
        const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        setFootages(files);
      } catch (error) {
        console.error('Error fetching video files:', error);
      }
    };

    getVideoFiles();
  }, []);

  // Generate thumbnail only if footages and item are available
  useEffect(() => {
    const videoFiles = footages.filter((file: any) =>
      file.name.endsWith(`-${item?.id}.mp4`),
    );

    if (videoFiles.length > 1 && !thumbnail) {
      createThumbnail({
        url: videoFiles[1].path,
        timeStamp: 10000,
      })
        .then(response => {
          setThumbnail(response?.path);
        })
        .catch(error => {
          console.error('Error creating thumbnail:', error);
        });
    }
  }, [footages, item?.id, thumbnail]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        NavigationService.navigate(RouteNames.HomeRoutes.FootageDetails, {
          id: item?.id,
        });
      }}
      key={item?.id}
      style={styles.gridCard}>
      <Image
        source={Images.PlayBtn}
        resizeMode={'cover'}
        style={styles.playBtn}
      />
      {thumbnail ? (
        <Image
          source={{uri: thumbnail}}
          resizeMode={'cover'}
          style={{width: '100%', height: '100%'}}
        />
      ) : (
        <CustomText.SmallText>No Video Found...</CustomText.SmallText>
      )}
      {/* {isOlderThan7Days && (
        <View style={styles.editBox}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Are you sure?', 'You want to delete this incident', [
                {text: 'Cancel', style: 'default'},
                {
                  text: 'Yes',
                  style: 'destructive',
                  //   onPress: () => deleteFootage(item?.id),
                },
              ]);
            }}>
            <RoundImageContainer
              resizeMode="contain"
              circleWidth={28}
              source={Images.Delete}
            />
          </TouchableOpacity>
        </View>
      )} */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    width: '33%',
    alignItems: 'center',
    justifyContent: 'center',
    height: Metrix.VerticalSize(100),
    backgroundColor: Utills.selectedThemeColors().Base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Utills.selectedThemeColors().SecondaryTextColor,
  },
  playBtn: {
    width: Metrix.HorizontalSize(50),
    height: Metrix.HorizontalSize(50),
    position: 'absolute',
    zIndex: 10,
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
});
