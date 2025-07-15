import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GOOGLE_API_KEY } from '../../services/config';
import Geocoder from 'react-native-geocoding';

Geocoder.init(GOOGLE_API_KEY);


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

interface ThreatDetailsBottomSheetProps {
  threatDetails: ThreatDetails | null;
  onClose: () => void;
  onChange: (index: number) => void;
}

const ThreatDetailsBottomSheet = forwardRef<BottomSheet, ThreatDetailsBottomSheetProps>(
  ({ threatDetails, onClose, onChange }, ref) => {
    const snapPoints = useMemo(() => ['50%'], []);
    const [streetName, setStreetName] = useState<string>('Loading address...');
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);

    const getStreetName = useCallback(async (latitude: number, longitude: number) => {
      try {
        const response = await Geocoder.from(latitude, longitude);
        
        if (response.results && response.results.length > 0) {
          const result = response.results[0];
          
          // Try to get a more specific address
          const addressComponents = result.address_components;
          let streetNumber = '';
          let streetName = '';
          let neighborhood = '';
          let city = '';
          
          // Parse address components for better formatting
          addressComponents.forEach((component: any) => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              streetName = component.long_name;
            } else if (types.includes('neighborhood') || types.includes('sublocality')) {
              neighborhood = component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            }
          });
          
          // Build a formatted address
          let formattedAddress = '';
          if (streetNumber && streetName) {
            formattedAddress = `${streetNumber} ${streetName}`;
          } else if (streetName) {
            formattedAddress = streetName;
          } else if (neighborhood) {
            formattedAddress = neighborhood;
          } else if (city) {
            formattedAddress = city;
          } else {
            // Fallback to full formatted address
            formattedAddress = result.formatted_address;
          }
          
          return formattedAddress;
        } else {
          return 'Address not found';
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }, []);

    useEffect(() => {
      if (!threatDetails) return;
      
      setIsLoadingAddress(true);
      setStreetName('Loading address...');
      
      // Check if streetName is actually coordinates (contains comma and numbers)
      const isCoordinates = typeof threatDetails.streetName === 'string' && 
                           threatDetails.streetName.includes(',') && 
                           /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(threatDetails.streetName.replace(/\s/g, ''));
      
      if (isCoordinates || !threatDetails.streetName || threatDetails.streetName === 'Loading address...') {
        // Convert coordinates to address
        getStreetName(threatDetails.latitude, threatDetails.longitude)
          .then((address) => {
            setStreetName(address);
            setIsLoadingAddress(false);
          })
          .catch(() => {
            setStreetName(`${threatDetails.latitude.toFixed(4)}, ${threatDetails.longitude.toFixed(4)}`);
            setIsLoadingAddress(false);
          });
      } else {
        // Use the existing street name if it's valid
        setStreetName(threatDetails.streetName);
        setIsLoadingAddress(false);
      }
    }, [threatDetails, getStreetName]);

    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!threatDetails) return null;

    console.log('streetName', streetName)

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={onChange}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.header}>
            {/* LEFT */}
            <View style={styles.headerLeft}>
              <Text style={styles.streetName}>
                {isLoadingAddress ? (
                  <Text style={styles.loadingText}>Loading address...</Text>
                ) : (
                  streetName
                )}
              </Text>
              <Text style={styles.timestamp}>Reported: {formatTimestamp(threatDetails.timestamp)}</Text>
            </View>

            {/* CENTER */}
            <View style={styles.headerCenter}>
              <View style={styles.threatIconContainer}>
                <Image
                  source={threatDetails.icon}
                  style={styles.threatIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* RIGHT */}
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {threatDetails.image ? (
              <Image
                source={{ uri: threatDetails.image }}
                style={styles.eventImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.eventImage, styles.noImageContainer]}>
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

ThreatDetailsBottomSheet.displayName = 'ThreatDetailsBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  streetName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  threatIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  threatIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  noImageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
});

export default ThreatDetailsBottomSheet;
