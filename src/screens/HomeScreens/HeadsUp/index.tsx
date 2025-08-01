// Updated HeadsUp Component

import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HeadsUpProps } from '../../propTypes';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/reducers';
import { Images, Metrix, Utills } from '../../../config';
import { Image } from 'react-native';
import {
  CustomModal,
  BackHeader,
  CustomText,
  Loader,
  MainContainer,
  PrimaryButton,
} from '../../../components';
import Geolocation from 'react-native-geolocation-service';
import { HomeAPIS } from '../../../services/home';
import { normalizeFont } from '../../../config/metrix';
import FirstBottomSheet from '../../../components/BottomSheet/FirstBottomSheet';
import SecondBottomSheet from '../../../components/BottomSheet/SecondBottomSheet';
import ThirdBottomSheet from '../../../components/BottomSheet/ThirdBottomSheet';
import ThreatDetailsBottomSheet from '../../../components/BottomSheet/ThreadDetails';
import BottomSheet from '@gorhom/bottom-sheet';

// Define threat type interface
interface SelectedThreat {
  id: number;
  icon: any;
  label: string;
  latitude: number;
  longitude: number;
}

interface ThreatDetails {
  id: string;
  icon: any;
  label: string;
  streetName: string;
  image?: string;
  timestamp: string;
  description?: string;
  latitude: number;
  longitude: number;
}

const { width, height } = Dimensions.get('window');


export const HeadsUp: React.FC<HeadsUpProps> = ({ }) => {

  const mapRef = useRef<any>(null);
  const isFocus = useIsFocused();
  const userData = useSelector((state: RootState) => state.home.userDetails);
  const userCoordinates = useSelector(
    (state: RootState) => state.home.userLocation,
  );

  const [loading, setLoading] = useState(false);
  const [threats, setThreats] = useState<any[]>([]);
  const [showDramaModal, setShowDramaModal] = useState(true);

  // State to track the currently selected threat
  const [selectedThreat, setSelectedThreat] = useState<SelectedThreat | null>(null);
  const [tempThreatData, setTempThreatData] = useState<{ id: number, icon: any, label: string } | null>(null);

  //State to control which bottom sheet is active
  const [activeSheet, setActiveSheet] = useState<'none' | 'first' | 'second' | 'third'>('none');

  const firstBottomSheetRef = useRef<BottomSheet>(null);
  const secondBottomSheetRef = useRef<BottomSheet>(null);
  const thirdBottomSheetRef = useRef<BottomSheet>(null);
  const threatDetailsBottomSheetRef = useRef<BottomSheet>(null);

  // State for threat details bottom sheet
  const [selectedThreatDetails, setSelectedThreatDetails] = useState<ThreatDetails | null>(null);

  const [currentLocation, setCurrentLocation] = useState({
    latitude: userCoordinates?.latitude || 37.78825,
    longitude: userCoordinates?.longitude || -122.4324,
  });
  const [mapType, setMapType] = useState<any>('standard');

  const mapButtons = [
    {
      id: '1',
      image: Images.Marker,
      onPress: () => {
        createThreadZone(currentLocation?.latitude, currentLocation?.longitude, 'Current Location');
      },
    },
    {
      id: '2',
      image: Images.Target,
      onPress: () => {
        getCurrentLocation();
      },
    },
    {
      id: '3',
      image: Images.Layers,
      onPress: () => {
        setMapType(mapType === 'standard' ? 'satellite' : 'standard');
      },
    },
  ];

  // Function to start the flow
  const startFlow = useCallback(() => {
    setShowDramaModal(false);
    setTimeout(() => {
      setActiveSheet('first');
      firstBottomSheetRef.current?.expand();
    }, 300);
  }, []);

  // Function to get threat icon by type
  const getThreatIcon = (threatType: string) => {
    const iconMap: { [key: string]: any } = {
      'Harassment': Images.Harasment,
      'Followed': Images.Followed,
      'Fight': Images.Fight,
      'Stabbing': Images.Stabing,
      'Shooting': Images.Shooter,
      'Mass event': Images.Danger,
    };
    return iconMap[threatType] || Images.Incident;
  };

  // Function to get street name from coordinates (you can implement reverse geocoding here)
  const getStreetName = async (latitude: number, longitude: number): Promise<string> => {
    // For now, return a placeholder. You can implement actual reverse geocoding here
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  // Function to handle selected threat marker press
  const handleSelectedThreatPress = async () => {
    if (selectedThreat) {
      const streetName = await getStreetName(selectedThreat.latitude, selectedThreat.longitude);

      const threatDetails: ThreatDetails = {
        id: `temp-${selectedThreat.id}`, // Temporary ID for preview
        icon: selectedThreat.icon,
        label: selectedThreat.label,
        streetName: streetName,
        image: undefined, // No image yet since it's still being reported
        timestamp: new Date().toISOString(),
        description: 'Currently being reported...',
        latitude: selectedThreat.latitude,
        longitude: selectedThreat.longitude,
      };

      setSelectedThreatDetails(threatDetails);
      threatDetailsBottomSheetRef.current?.expand();
    }
  };

  // Function to handle threat marker tap
  const handleThreatMarkerPress = async (threat: any) => {
    const streetName = await getStreetName(threat.latitude, threat.longitude);

    const threatDetails: ThreatDetails = {
      id: threat.id,
      icon: getThreatIcon(threat.threat_type || 'General'),
      label: threat.threat_type || 'General Threat',
      streetName: streetName,
      image: threat.image,
      timestamp: threat.timestamp,
      description: threat.description,
      latitude: threat.latitude,
      longitude: threat.longitude,
    };

    setSelectedThreatDetails(threatDetails);

  setTimeout(() => {
      console.log('Opening threat details sheet');
      threatDetailsBottomSheetRef.current?.expand();
    }, 100);  };

  // Function to close threat details bottom sheet
  const closeThreatDetails = () => {
    threatDetailsBottomSheetRef.current?.close();
    setSelectedThreatDetails(null);
  };

  const handleThreatSelection = useCallback((threatData: { id: number, icon: any, label: string }) => {
    // This will now be called from ThirdBottomSheet after the bot reply
    const newSelectedThreat: SelectedThreat = {
      ...threatData,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    };
    
    setSelectedThreat(newSelectedThreat);
    
    // Optionally animate to the threat location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);
  

  const handleTempThreatSelection = useCallback((threatData: { id: number, icon: any, label: string }) => {
    setTempThreatData(threatData); // Store temporarily
    moveToSecondSheet();
  }, []);

  // Function to move from first to second sheet
  const moveToSecondSheet = useCallback(() => {
    firstBottomSheetRef.current?.close();
    setTimeout(() => {
      setActiveSheet('second');
      secondBottomSheetRef.current?.expand();
    }, 300);
  }, []);

  // Function to move from second to third sheet
  const moveToThirdSheet = useCallback(() => {
    secondBottomSheetRef.current?.close();
    setTimeout(() => {
      setActiveSheet('third');
      thirdBottomSheetRef.current?.expand();
    }, 300);
  }, []);

  // Function to close all sheets and reset selected threat
  const closeAllSheets = useCallback(() => {
    firstBottomSheetRef.current?.close();
    secondBottomSheetRef.current?.close();
    thirdBottomSheetRef.current?.close();
    setActiveSheet('none');
    setSelectedThreat(null);
    setTempThreatData(null); // Add this line
  }, []);

  // Function to complete the reporting process
  const completeThreatReport = useCallback(async (additionalDetails: string, image?: string) => {
    if (tempThreatData) {
      // First show the threat on map
      handleThreatSelection(tempThreatData);
      
        // Create a new threat object to add to the threats array
    const newThreat = {
      id: Date.now(), // Generate a temporary ID
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: new Date().toISOString(),
      description: additionalDetails || `${tempThreatData.label} reported`,
      threat_type: tempThreatData.label,
      image: image,
    };
    
    // Add the new threat to the threats array manually
    setThreats(prevThreats => [...prevThreats, newThreat]);

      // Then create the incident
      // await createThreadZone(
      //   currentLocation.latitude,
      //   currentLocation.longitude,
      //   `${tempThreatData.label} reported`,
      //   additionalDetails,
      //   image
      // );
      //TODO: we are displaying it just for test!
      // setTimeout(() => {
      //   Alert.alert(
      //     'Threat Reported',
      //     `${tempThreatData.label} has been reported successfully and is now visible on the map.`,
      //     [{ text: 'OK' }]
      //   );
      // }, 1000); // Small delay to let user see the threat appear on map
   
      
      setTempThreatData(null); // Clear temp data

      setTimeout(() => {
        setSelectedThreat(null);
      }, 2000);
    }
    closeAllSheets();
  }, [tempThreatData, currentLocation, handleThreatSelection]);
  
  // Handle sheet changes
  const handleSheetChange = useCallback((index: number, sheetType: 'first' | 'second' | 'third') => {
    if (index === -1) {
      if (activeSheet === sheetType) {
        setActiveSheet('none');
        // If first sheet is closed without selection, clear the threat
        if (sheetType === 'first') {
          setSelectedThreat(null);
        }
      }
    }
  }, [activeSheet]);

  useEffect(() => {
    getCurrentLocation();
    loadThreats();
  }, [isFocus]);

const createThreadZone = async (
  latitude: number,
  longitude: number,
  address: string,
  additionalDetails?: string,
  image?: string
) => {
  /*
  if (!latitude || !longitude) {
    Alert.alert('Location Error', 'Unable to get location coordinates');
    return;
  }

  setLoading(true);
  try {
    const body = {
      timestamp: new Date().toISOString(),
      location_latitude: latitude.toFixed(6),
      location_longitude: longitude.toFixed(6),
      user: userData?.user?.id,
      description: additionalDetails || address,
      threat_type: tempThreatData?.label || selectedThreat?.label || 'General Threat', // Fix this line
      image: image,
    };

    await HomeAPIS.postIncidents(body);
    await loadThreats();

    Alert.alert(
      'Threat Reported',
      `${tempThreatData?.label || selectedThreat?.label || 'Threat'} has been reported successfully.`, // Fix this line
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Error creating thread zone:', error);
    Alert.alert(
      'Error',
      'Failed to report threat. Please try again.',
    );
  } finally {
    setLoading(false);
  }
    */
   // For now, just console log the data that would be sent
  console.log('Threat data that would be sent to API:', {
    timestamp: new Date().toISOString(),
    location_latitude: latitude.toFixed(6),
    location_longitude: longitude.toFixed(6),
    user: userData?.user?.id,
    description: additionalDetails || address,
    threat_type: tempThreatData?.label || selectedThreat?.label || 'General Threat',
    image: image,
  });
};

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'HeadsUp needs access to your location to mark threats',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({
            latitude: latitude,
            longitude: longitude,
          });

          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000,
            );
          }
        },
        error => {
          console.error('Location error:', error);
          Alert.alert(
            'Location Error',
            'Unable to get your current location. Please check your location settings.',
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    }
  };

  const loadThreats = async () => {
    setLoading(true);
    try {
      const response = await HomeAPIS.getIncidents();
      const threatMarkers = response?.data?.map((item: any) => ({
        id: item?.id,
        latitude: parseFloat(item?.location_latitude),
        longitude: parseFloat(item?.location_longitude),
        timestamp: item?.timestamp,
        description: item?.description || 'Threat Location',
        threat_type: item?.threat_type,
      }));
      setThreats(threatMarkers || []);
    } catch (error) {
      console.error('Error loading threats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <MainContainer customeStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          ref={mapRef}
          zoomEnabled={true}
          showsUserLocation={true}
          scrollEnabled={true}
          region={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          mapType={mapType}
          onRegionChangeComplete={loc => { }}>

          {/* Current location marker */}
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="Current position">
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </Marker>

          {/* Selected threat marker (preview) */}
          {selectedThreat && (
            <Marker
              coordinate={{
                latitude: selectedThreat.latitude,
                longitude: selectedThreat.longitude,
              }}
              title={`Selected: ${selectedThreat.label}`}
              description="Tap to view details"
              onPress={() => handleSelectedThreatPress()}>
              <View style={styles.selectedThreatMarker}>
                <Image
                  source={selectedThreat.icon}
                  style={styles.selectedThreatIcon}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          )}

          {/* Existing threat markers */}
          {threats.map((threat: any, index: number) => (
            <Marker
              key={`threat-${threat.id}-${index}`}
              coordinate={{
                latitude: threat.latitude,
                longitude: threat.longitude,
              }}
              title="Threat Location"
              description={`Reported: ${formatTimestamp(threat.timestamp)}`}
              onPress={() => handleThreatMarkerPress(threat)}>
              <View style={styles.threatMarker}>
                <Image
                  source={getThreatIcon(threat.threat_type)}
                  style={styles.threatIcon}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Map controls */}
        {activeSheet === 'none' && (
          <View style={styles.mapControls}>
            {mapButtons.map((button: any) => (
              <TouchableOpacity
                key={button.id}
                onPress={button.onPress}
                activeOpacity={0.7}
                style={styles.mapControlButton}>
                <Image
                  source={button.image}
                  resizeMode="contain"
                  style={styles.controlIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Threat counter */}
        {/* <View style={styles.threatCounter}>
          <CustomText.SmallText customStyle={styles.counterText}>
            Threats: {threats.length}
          </CustomText.SmallText>
        </View> */}

        {/* Selected threat info */}
        {/* {selectedThreat && (
          <View style={styles.selectedThreatInfo}>
            <CustomText.SmallText customStyle={styles.selectedThreatText}>
              Selected: {selectedThreat.label}
            </CustomText.SmallText>
          </View>
        )} */}
      </View>

      {/* Cut the Drama Modal */}
      <CustomModal
        visible={showDramaModal}
        smallModal
        onClose={() => setShowDramaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.firstTimeModalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.titleRow}>
                <Image
                  source={Images.Premium}
                  style={{ width: 34, height: 28 }}
                />
                <Text style={styles.modalTitle}>Cut the drama</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.descriptionContainer}>
                <Text style={styles.modalDescription}>
                  We're not here to fuel paranoia or keep you scrolling into the night.
                </Text>
                <Text style={[styles.modalDescription, styles.descriptionSpacing]}>
                  But if it's real and it helps keep someone safe, let the community know!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.gotchaButton}
                onPress={startFlow}
                activeOpacity={0.8}
              >
                <Text style={styles.gotchaButtonText}>Gotcha!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CustomModal>

      {/* <PrimaryButton
            title="Gotcha!"
            onPress={startFlow}
            customStyles={styles.gotchaButton}
            customTextStyle={styles.gotchaButtonText}
          /> */}

      {/* First Bottom Sheet */}
      <FirstBottomSheet
        ref={firstBottomSheetRef}
        onYes={moveToSecondSheet}
        onNo={closeAllSheets}
        onThreatSelect={handleTempThreatSelection} // New prop for threat selection
        onChange={(index) => handleSheetChange(index, 'first')}
      />

      {/* Second Bottom Sheet */}
      <SecondBottomSheet
        ref={secondBottomSheetRef}
        onYes={moveToThirdSheet}
        onNo={closeAllSheets}
        selectedThreat={tempThreatData} // Pass selected threat info
        onChange={(index) => handleSheetChange(index, 'second')}
      />

      {/* Third Bottom Sheet */}
      <ThirdBottomSheet
        ref={thirdBottomSheetRef}
        onComplete={completeThreatReport} // Updated to complete the report
        selectedThreat={tempThreatData} // Pass selected threat info
        onThreatConfirmed={handleThreatSelection}
        onChange={(index) => handleSheetChange(index, 'third')}
      />

      {/* Threat Details Bottom Sheet */}
      <ThreatDetailsBottomSheet
        ref={threatDetailsBottomSheetRef}
        threatDetails={selectedThreatDetails}
        onClose={closeThreatDetails}
        onChange={(index) => {
          if (index === -1) {
            setSelectedThreatDetails(null);
          }
        }}
      />

      <Loader isLoading={loading} />
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Utills.selectedThemeColors().Base,
    paddingTop: Platform.OS === 'ios' ? 0 : Metrix.VerticalSize(20),
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    top: '5%',
    right: '5%',
    zIndex: 100,
  },
  mapControlButton: {
    width: Metrix.HorizontalSize(40),
    height: Metrix.VerticalSize(40),
    marginBottom: Metrix.VerticalSize(10),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    borderRadius: Metrix.HorizontalSize(8),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  controlIcon: {
    width: Metrix.HorizontalSize(22),
    height: Metrix.VerticalSize(22),
    tintColor: Utills.selectedThemeColors().Base,
  },
  currentLocationMarker: {
    width: Metrix.HorizontalSize(20),
    height: Metrix.VerticalSize(20),
    borderRadius: Metrix.HorizontalSize(10),
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: Metrix.HorizontalSize(8),
    height: Metrix.VerticalSize(8),
    borderRadius: Metrix.HorizontalSize(4),
    backgroundColor: '#007AFF',
  },
  // New style for selected threat marker (larger and more prominent)
  selectedThreatMarker: {
    width: Metrix.HorizontalSize(50),
    height: Metrix.VerticalSize(50),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Utills.selectedThemeColors().Red,
    borderRadius: Metrix.HorizontalSize(25),
    borderWidth: 3,
    borderColor: Utills.selectedThemeColors().PrimaryTextColor,
    shadowColor: '#000000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    // shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  selectedThreatIcon: {
    width: Metrix.HorizontalSize(30),
    height: Metrix.VerticalSize(30),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  threatMarker: {
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Utills.selectedThemeColors().Red,
    borderRadius: Metrix.HorizontalSize(18),
    borderWidth: 2,
    borderColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  threatIcon: {
    width: Metrix.HorizontalSize(20),
    height: Metrix.VerticalSize(20),
    tintColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  threatCounter: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Metrix.HorizontalSize(12),
    paddingVertical: Metrix.VerticalSize(6),
    borderRadius: Metrix.HorizontalSize(15),
    zIndex: 100,
  },
  counterText: {
    color: Utills.selectedThemeColors().PrimaryTextColor,
    fontWeight: '600',
    fontSize: normalizeFont(12),
  },
  // New style for selected threat info
  selectedThreatInfo: {
    position: 'absolute',
    bottom: '10%',
    left: '5%',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: Metrix.HorizontalSize(12),
    paddingVertical: Metrix.VerticalSize(6),
    borderRadius: Metrix.HorizontalSize(15),
    zIndex: 100,
  },
  selectedThreatText: {
    color: Utills.selectedThemeColors().PrimaryTextColor,
    fontWeight: '600',
    fontSize: normalizeFont(12),
  },
  dramaModalContainer: {
    height: 'auto',
    width: '85%',
    backgroundColor: Utills.selectedThemeColors().Base,
    borderRadius: Metrix.HorizontalSize(20),
    paddingVertical: Metrix.VerticalSize(25),
    paddingHorizontal: Metrix.HorizontalSize(25),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstTimeModalContainer: {
    backgroundColor: '#515151',
    borderRadius: 20,
    width: width * 0.85,
    maxWidth: 400,
    padding: 25,
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#CCCCCC',
    marginBottom: 20,
  },
  descriptionContainer: {
    width: '100%',
    marginBottom: 25,
  },
  modalDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'left',
    lineHeight: 22,
  },
  descriptionSpacing: {
    marginTop: 15,
  },
  gotchaButton: {
    backgroundColor: '#898989',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 15,
    minWidth: 120,
    alignSelf: 'center',
  },
  gotchaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  
});