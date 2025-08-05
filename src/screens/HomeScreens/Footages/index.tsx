import { FlatList, Image, RefreshControl, StyleSheet, View, Alert, Platform } from 'react-native';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { FootagesProps } from '../../propTypes';
import {
  BackHeader,
  CustomText,
  FootageGrid,
  Loader,
  MainContainer,
} from '../../../components';
import { Images, Metrix, Utills } from '../../../config';
import { createShadow, normalizeFont } from '../../../config/metrix';
import { HomeAPIS } from '../../../services/home';
import { useFocusEffect } from '@react-navigation/native';
import { StreamCard } from '../../../components/StreamCard';
import DownloadBottomSheet from '../../../components/DownloadBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import RNFS from 'react-native-fs';
import CameraRoll from '@react-native-camera-roll/camera-roll';

export const Footages: React.FC<FootagesProps> = ({ }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const wait = (timeout: any) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  const onRefresh = () => {
    setRefreshing(true);
    wait(1000).then(() => {
      getIncidents();
      setRefreshing(false);
    });
  };

  const handleOpenDownloadSheet = (incident: any) => {
    setSelectedIncident(incident);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleSharePress = () => {
    // Implement sharing functionality here
    console.log('Share pressed for incident:', selectedIncident?.id);
    bottomSheetRef.current?.close();
  };

  const saveVideoToGallery = async (incident: any) => {
    try {
      setIsDownloading(true);

      // Check if running on iOS
      if (Platform.OS !== 'ios') {
        Alert.alert('Not Supported', 'This feature is only available on iOS');
        setIsDownloading(false);
        return;
      }

      // Look for the local video file
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const videoFile = files.filter((file: any) =>
        file.name.endsWith(`${incident.id}-VIDEO.mp4`),
      );



      if (videoFile.length === 0) {
        Alert.alert('Video Not Found', 'No local video file found for this incident');
        setIsDownloading(false);
        return;
      }

      const videoPath = videoFile[0].path;
      console.log('Saving video from path:', videoPath);

      // Check if file exists
      const fileExists = await RNFS.exists(videoPath);
      if (!fileExists) {
        Alert.alert('File Not Found', 'The video file could not be found');
        setIsDownloading(false);
        return;
      }

      // Save to camera roll
      await CameraRoll.save(videoPath, { type: 'video' });

      Alert.alert(
        'Success!',
        'Video has been saved to your Photos app',
        [{ text: 'OK' }]
      );

      console.log('Video saved to gallery successfully');

    } catch (error) {
      console.error('Error saving video to gallery:', error);

      if (error.message?.includes('permission')) {
        Alert.alert(
          'Permission Required',
          'Please allow access to Photos in your device settings to save videos'
        );
      } else {
        Alert.alert('Error', 'Failed to save video. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveLocallyPress = async () => {
    bottomSheetRef.current?.close();

    if (!selectedIncident) {
      Alert.alert('Error', 'No incident selected');
      return;
    }

    // Check if it's a video incident or has local video
    // if (selectedIncident.type !== 'video' && !selectedIncident.hasVideo) {
    //   Alert.alert('Not a Video', 'This incident does not contain video content');
    //   return;
    // }

    await saveVideoToGallery(selectedIncident);
  };

  // Updated delete function that will be called only when passcode is correct
  const handleDeleteIncident = (incidentId: string, isPasscodeCorrect: boolean) => {
    console.log('Delete called with:', incidentId, 'Passcode correct:', isPasscodeCorrect);

    if (isPasscodeCorrect) {
      // Remove from local state immediately for better UX
      const newData = data.filter((item: any) => item.id !== incidentId);
      setData(newData);

      // Delete local file if it exists
      const localVideoPath = `${RNFS.DocumentDirectoryPath}/${incidentId}-VIDEO.mp4`;
      RNFS.exists(localVideoPath).then(exists => {
        if (exists) {
          RNFS.unlink(localVideoPath).catch(err => {
            console.error('Error deleting local file:', err);
          });
        }
      });

      // Delete on server
      HomeAPIS.deleteIncident(incidentId)
        .then(() => {
          console.log('Incident deleted successfully from server');
        })
        .catch(err => {
          console.log('Error deleting incident from server:', err?.response?.data);
          // Optionally restore the item if server deletion fails
          getIncidents(); // Refresh to restore state
        });
    } else {
      // For incorrect passcode, only remove from local state (no server call)
      const newData = data.filter((item: any) => item.id !== incidentId);
      setData(newData);

      // Also delete local file for security
      const localVideoPath = `${RNFS.DocumentDirectoryPath}/${incidentId}-VIDEO.mp4`;
      RNFS.exists(localVideoPath).then(exists => {
        if (exists) {
          RNFS.unlink(localVideoPath).catch(err => {
            console.error('Error deleting local file:', err);
          });
        }
      });

      console.log('Local file removed (passcode incorrect)');
    }
  };

  const getIncidents = () => {
    setLoading(true);
    Promise.all([
      HomeAPIS.getIncidents(),
      HomeAPIS.getTrustedContacts(), // Get recipients
    ])
      .then(([incidentsRes, contactsRes]) => {
        let array: any = [];
        incidentsRes?.data?.map((item: any) => {
          console.log('incident res', incidentsRes?.data)
          console.log('item?.id', item?.id)
          console.log('lat', item?.location ? parseFloat(item.location.split(', ')[0]) : null)
          array?.push({
            id: item?.id,
            createdAt: item?.created_at,
            lat: item?.location ? parseFloat(item.location.split(', ')[0]) : null,
            lng: item?.location ? parseFloat(item.location.split(', ')[1]) : null,
            // lng: parseFloat(item?.location_longitude),
            triggerType: item?.threat_type || 'Automatic Detection',
            streetName: item?.address || item?.description,
            hasVideo: item?.has_video || false,
            thumbnailUrl: item?.thumbnail_url,
            recipients: contactsRes?.data?.map((contact: any) => ({
              id: contact.id,
              name: contact.name,
              avatar: contact.avatar_url,
            })) || [],
          });
        });

        setData(array?.reverse());
        console.log('array?.reverse(', array?.reverse());
        setLoading(false);
      })
      .catch(err => {
        console.log('Err', err?.response?.data);
        setLoading(false);
      });
  };

  useFocusEffect(
    useCallback(() => {
      getIncidents();
    }, []),
  );

  const renderFootageItem = ({ item }: any) => {
    return <FootageGrid item={item} />;
  };

  const renderIncidentItem = ({ item }: any) => {
    // Helper function to safely format coordinates
    const formatCoordinates = (lat: number | null, lng: number | null): string => {
      // Check if both coordinates are valid numbers
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        return `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      // Fallback for invalid coordinates
      return 'Unknown Location';
    };

    // Helper function to generate street name safely
    const getStreetName = (item: any): string => {
      // Priority 1: Use existing streetName if it's meaningful
      if (item.streetName &&
        item.streetName.trim() !== '' &&
        !item.streetName.includes('null') &&
        !item.streetName.includes('undefined')) {
        return item.streetName;
      }

      // Priority 2: Use formatted coordinates if available
      if (item.lat !== null && item.lng !== null) {
        return formatCoordinates(item.lat, item.lng);
      }

      // Priority 3: Use incident ID as fallback
      return `Incident #${item.id}`;
    };
    return (
      <StreamCard
        incident={{
          id: item.id,
          type: item.hasVideo ? 'video' : 'audio',
          streetName: getStreetName(item),
          triggerType: item.triggerType || 'Automatic Detection',
          dateTime: item.createdAt,
          thumbnailUrl: item.thumbnailUrl,
          recipients: item.recipients || [],
          location: {
            latitude: item.lat || 0,
            longitude: item.lng || 0,
          },
        }}
        onDelete={handleDeleteIncident}
        onDownload={() => handleOpenDownloadSheet(item)}
      />
    );
  };

  console.log('data', data)

  return (
    <MainContainer>
      {/* <BackHeader heading="Incidents Records" /> */}
      <View style={styles.titleContainer}>
        <Image
          source={Images.Premium}
          style={styles.premiumIcon}
          resizeMode="contain"
        />
        <CustomText.RegularText customStyle={styles.textHeading}>
          Shared streams
        </CustomText.RegularText>
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          data={data}
          renderItem={renderIncidentItem}
          keyExtractor={item => item?.id}
          contentContainerStyle={styles.flatlist}
          showsVerticalScrollIndicator={false}
          numColumns={1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Utills.selectedThemeColors().PrimaryTextColor}
              colors={[Utills.selectedThemeColors().PrimaryTextColor]}
              enabled={true}
            />
          }
        />
      </View>
      <Loader isLoading={loading || isDownloading} />

      <DownloadBottomSheet
        ref={bottomSheetRef}
        onSharePress={handleSharePress}
        onSaveLocallyPress={handleSaveLocallyPress}
      />
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  flatlist: {
    alignSelf: 'center',
    paddingVertical: Metrix.VerticalSize(10),
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrix.VerticalSize(5),
  },
  premiumIcon: {
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  textHeading: {
    fontSize: normalizeFont(18),
    letterSpacing: 0.7,
    fontWeight: '600',
    lineHeight: 20,
    color: Utills.selectedThemeColors().PrimaryTextColor,
  },
});