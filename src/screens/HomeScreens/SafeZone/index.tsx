import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
  ScrollView,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeZoneProps } from '../../propTypes';
import { useIsFocused, useRoute } from '@react-navigation/native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/reducers';
import { Images, Metrix, Utills } from '../../../config';
import { Image } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { CustomModal, CustomText, Loader } from '../../../components';
import Geolocation from 'react-native-geolocation-service';
import { HomeAPIS } from '../../../services/home';
import { HomeActions } from '../../../redux/actions';
import { GOOGLE_API_KEY } from '../../../services/config';

export const SafeZone: React.FC<SafeZoneProps> = ({ }) => {
  const route = useRoute();
  const dispatch = useDispatch();
  const mapRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const isFocus = useIsFocused();
  const userData = useSelector((state: RootState) => state.home.userDetails);
  const userCoordinates = useSelector(
    (state: RootState) => state.home.userLocation,
  );
  const [loading, setLoading] = useState(false);
  const [inSZ, setInSZ] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<any>('');
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [safeZoneAddress, setSafeZoneAddress] = useState<any>('');
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [region, setRegion] = useState({
    latitude: userCoordinates?.latitude,
    longitude: userCoordinates?.longitude,
  });
  const [mapType, setMapType] = useState<any>('standard');
  const buttons = [
    {
      id: '1',
      image: Images.Marker,
      onPress: () => {
        createSafeZone(region?.latitude, region?.longitude, 'address');
      },
    },
    {
      id: '4',
      image: Images.Layers,
      onPress: () => {
        if (mapType == 'standard') {
          setMapType('satellite');
        } else {
          setMapType('standard');
        }
      },
    },

    {
      id: '5',
      image: Images.Target,
      onPress: () => {
        // getCurrentLocation();
        //Create safe zone immediately at current coordinates
        if (userCoordinates?.latitude && userCoordinates?.longitude) {
          createSafeZone(
            userCoordinates?.latitude,
            userCoordinates?.longitude,
            'Current Location'
          );
          // setRegion({
          //   latitude: userCoordinates.latitude,
          //   longitude: userCoordinates.longitude
          // })
        }
      },
    },
  ];

  console.log('GOOGLE_API_KEY', GOOGLE_API_KEY)

  const fetchPlaces = async (lat: any, lng: any, type: any) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=${type}&key=${GOOGLE_API_KEY}`,
    );
    const data = await response.json();
    let array: any = [];
    data?.results?.map((item: any) => {
      array?.push({
        id: item?.place_id,
        name: item?.name,
        image: Images.Target,
        location: {
          latitude: item?.geometry?.location?.lat,
          longitude: item?.geometry?.location?.lng,
        },
        radius: 20,
        type: type,
      });
    });

    return array;
  };

  useEffect(() => {
    getCurrentLocation();
  }, [isFocus]);

  useEffect(() => {
    if (region?.latitude && region?.longitude) {
      getZones();
    }
  }, [region]);

  function calculateDistance(lat1: any, lon1: any, lat2: any, lon2: any) {
    const R = 6371e3; // Radius of Earth in meters
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  const getZones = () => {
    setLoading(true);
    HomeAPIS.getSafeZones()
      .then(async res => {
        let array: any = [];
        res?.data?.map((item: any) => {
          array?.push({
            id: item?.id,
            name: item?.name,
            image: Images.Target,
            location: {
              latitude: parseFloat(item?.latitude),
              longitude: parseFloat(item?.longitude),
            },
            radius: parseInt(item?.radius),
            type: 'custom',
          });
        });
        // const hospitals = await fetchPlaces(
        //   region?.latitude,
        //   region?.longitude,
        //   'hospital',
        // );
        // const policeStations = await fetchPlaces(
        //   region?.latitude,
        //   region?.longitude,
        //   'police',
        // );
        const isInSafeZone = array.find((zone: any) => {
          const distance = calculateDistance(
            userCoordinates?.latitude,
            userCoordinates?.longitude,
            zone.location.latitude,
            zone.location.longitude,
          );
          return distance <= zone.radius;
        });
        if (isInSafeZone) {
          setInSZ(true);
          dispatch(HomeActions.setInSafeZone(true));
        } else {
          setInSZ(false);
          dispatch(HomeActions.setInSafeZone(false));
        }
        // setSafeZones([...array, ...hospitals, ...policeStations]);
        setSafeZones(array);
        setLoading(false);
      })
      .catch(err => {
        console.log('Err', err?.response?.data);
        setLoading(false);
      });
  };

  const createSafeZone = (lat: any, lng: any, address: any) => {
    const body = {
      name: 'safezone',
      latitude: lat?.toFixed(6),
      longitude: lng?.toFixed(6),
      radius: 20,
      address: address,
      is_active: true,
      zone_type: 'home',
      user: userData?.user?.id,
    };
    HomeAPIS.createSafeZones(body)
      .then(res => {
        setSearchedLocation('');
        setTimeout(() => {
          getZones();
        }, 1000);
      })
      .catch(err => {
        console.log('Err', err?.response?.data);
        setLoading(false);
      });
  };

  // const deleteZone = (id: any) => {
  //   setLoading(true);
  //   HomeAPIS.deleteSafeZone(id)
  //     .then(res => {
  //       setLoading(false);
  //       setTimeout(() => {
  //         getZones();
  //       }, 1000);
  //     })
  //     .catch(err => {
  //       // console.log('Err', err?.response?.data);
  //       setLoading(false);
  //     });
  // };

  const deleteZone = (id: any) => {
    setLoading(true);
    HomeAPIS.deleteSafeZone(id)
      .then(res => {
        // ✅ Remove from local state
        const updatedZones = safeZones.filter(zone => zone.id !== id);
        setSafeZones(updatedZones);

        // ✅ Re-check if user is still in any safe zone
        checkSafeZoneStatus(updatedZones);

        setLoading(false);
        // Utills.showToast('Safe zone deleted successfully');
      })
      .catch(err => {
        console.log('Delete error:', err?.response?.data);
        setLoading(false);
      });
  };

  // ✅ Extract safe zone checking logic into separate function
  const checkSafeZoneStatus = (zones = safeZones) => {
    const isInSafeZone = zones.find((zone: any) => {
      const distance = calculateDistance(
        userCoordinates?.latitude,
        userCoordinates?.longitude,
        zone.location.latitude,
        zone.location.longitude,
      );
      return distance <= zone.radius;
    });

    if (isInSafeZone) {
      setInSZ(true);
      dispatch(HomeActions.setInSafeZone(true));
    } else {
      setInSZ(false);
      dispatch(HomeActions.setInSafeZone(false));
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location',
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
          console.log('Position', position);

          setRegion({
            latitude: latitude,
            longitude: longitude,
          });

          dispatch(HomeActions.setUserLocation({ latitude, longitude }));

          setSearchedLocation('');

          setIsLocationReady(true);

          // Animate map to the user's location
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
          console.error(error);
          //fallback to default location
          setIsLocationReady(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    }
  };

  //Dont render map until location is ready
  if (!isLocationReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <CustomText.RegularText>Loading location...</CustomText.RegularText>
      </View>
    )
  }

  const deleteAlert = (item: any) => {
    Alert.alert(
      'Delete Safe Zone!',
      `Are you sure you want to delete this safe zone ?`,
      [
        {
          text: 'YES',
          onPress: () => {
            deleteZone(item?.id);
          },
        },
        {
          text: 'No',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const renderSuggestionRows = (rowData: any) => {
    const title = rowData?.structured_formatting?.main_text;
    const address = rowData?.structured_formatting?.secondary_text;
    return (
      <View style={{ alignItems: 'center', flexDirection: 'row' }}>
        <Image
          resizeMode="contain"
          source={Images.Marker}
          style={styles.locMarker}
        />
        <View style={{ left: Metrix.HorizontalSize(10) }}>
          <CustomText.RegularText
            customStyle={{ color: Utills.selectedThemeColors().Base }}>
            {title}
          </CustomText.RegularText>
          <CustomText.SmallText isSecondaryColor>
            {address}
          </CustomText.SmallText>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TouchableOpacity
          onPress={() => {
            setModalVisible(true);
            inputRef?.current?.focus();
          }}
          activeOpacity={0.9}
          style={styles.searchbar}>
          <Image
            resizeMode={'contain'}
            source={Images.Search}
            style={styles.searchIcon}
          />
          <CustomText.RegularText
            numberOfLines={1}
            customStyle={{
              left: Metrix.HorizontalSize(10),
              width: '80%',
              color:
                searchedLocation?.length > 0
                  ? Utills.selectedThemeColors().Base
                  : Utills.selectedThemeColors().SecondaryTextColor,
            }}>
            {searchedLocation?.length > 0 ? searchedLocation : 'Search here'}
          </CustomText.RegularText>
          <TouchableOpacity onPress={getCurrentLocation}>
            <Image
              resizeMode={'contain'}
              source={Images.Cross}
              style={[
                styles.searchIcon,
                { tintColor: Utills.selectedThemeColors().Base, left: 20 },
              ]}
            />
          </TouchableOpacity>
        </TouchableOpacity>
        {/* {showSearchButton && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchInThisArea}>
            <CustomText.RegularText customStyle={styles.searchBtnText}>
              Search in this area
            </CustomText.RegularText>
          </TouchableOpacity>
        )} */}
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        ref={mapRef}
        zoomEnabled={true}
        showsUserLocation={true}
        scrollEnabled={true}
        region={{
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        mapType={mapType}>
        {searchedLocation && (
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title={searchedLocation}></Marker>
        )}
        {safeZones?.map((item: any, index: number) => {
          return (
            <View key={index?.toString()}>
              <Marker
                onPress={() => deleteAlert(item)}
                coordinate={item?.location}>
                <View style={styles.deleteContainer}>
                  <Image
                    source={Images.SafeZone}
                    resizeMode="contain"
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              </Marker>
              <Circle
                center={item?.location}
                radius={item?.radius}
                strokeWidth={2}
                strokeColor="rgba(153, 153, 204, 0.7)"
                fillColor="rgba(153, 153, 204, 0.5)"
              />
            </View>
          );
        })}
      </MapView>
      <View style={styles.mapTypeContainer}>
        {buttons?.map((item: any) => {
          return (
            <TouchableOpacity
              key={item?.id}
              onPress={item?.onPress}
              activeOpacity={0.7}
              style={styles.mapTypeBox}>
              <Image
                source={item?.image}
                resizeMode="contain"
                style={styles.butonIcons}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {inSZ && (
        <View style={styles.bottomBanner}>
          <CustomText.SmallText customStyle={styles.bannerText}>
            You are in a safe zone, audio transmission paused.
          </CustomText.SmallText>
        </View>
      )}

      <CustomModal
        safeAreaStyle={{
          backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
        }}
        modalContainer={{
          backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
          paddingTop: 0,
        }}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
        }}>
        <ScrollView keyboardShouldPersistTaps={'handled'}>
          <GooglePlacesAutocomplete
            ref={inputRef}
            placeholder={'Search here'}
            keyboardShouldPersistTaps="always"
            minLength={3}
            listViewDisplayed={true}
            fetchDetails={true}
            enablePoweredByContainer={false}
            onPress={(data, details = null) => {
              createSafeZone(
                details?.geometry?.location?.lat,
                details?.geometry?.location?.lng,
                details?.formatted_address,
              );
              setRegion({
                latitude: details?.geometry?.location?.lat,
                longitude: details?.geometry?.location?.lng,
              });
              setSearchedLocation(details?.formatted_address);
              setModalVisible(false);
            }}
            predefinedPlaces={[]}
            keepResultsAfterBlur={true}
            enableHighAccuracyLocation={true}
            query={{
              key: GOOGLE_API_KEY,
              language: 'en',
            }}
            textInputProps={{
              placeholderTextColor:
                Utills.selectedThemeColors().SecondaryTextColor,
            }}
            renderRow={renderSuggestionRows}
            styles={{
              textInput: {
                fontSize: 16,
                paddingHorizontal: Metrix.HorizontalSize(20),
                // height: Metrix.VerticalSize(45),
                borderWidth: 1,
                borderColor: Utills.selectedThemeColors().TextInputBorderColor,
                borderRadius: Metrix.HorizontalSize(10),
                backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
                color: Utills.selectedThemeColors().Base,
              },
              separator: {
                backgroundColor:
                  Utills.selectedThemeColors().TextInputBorderColor,
              },
            }}
          />
        </ScrollView>
      </CustomModal>
      <Loader isLoading={loading} />
    </View>
  );
};
const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapTypeBox: {
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    marginTop: Metrix.VerticalSize(10),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    borderRadius: Metrix.HorizontalSize(5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 20,
  },
  mapTypeContainer: {
    position: 'absolute',
    zIndex: 100,
    top: '15%',
    right: '5%',
  },
  bottomBanner: {
    position: 'absolute',
    zIndex: 100,
    bottom: '5%',
    width: '90%',
    alignSelf: 'center',
    height: Metrix.VerticalSize(45),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    borderRadius: Metrix.HorizontalSize(10),
    paddingHorizontal: Metrix.HorizontalSize(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerText: {
    textAlign: 'center',
    color: Utills.selectedThemeColors().Danger,
    fontWeight: '600',
  },
  locIcon: {
    width: Metrix.HorizontalSize(20),
    height: Metrix.VerticalSize(20),
    right: Metrix.HorizontalSize(10),
  },
  locMarker: {
    width: Metrix.HorizontalSize(24),
    height: Metrix.VerticalSize(24),
  },
  butonIcons: {
    width: Metrix.HorizontalSize(20),
    height: Metrix.VerticalSize(20),
    tintColor: Utills.selectedThemeColors().Base,
  },
  searchbar: {
    height: Metrix.VerticalSize(40),
    marginVertical: Metrix.VerticalSize(10),
    paddingHorizontal: Metrix.VerticalSize(10),
    width: '92%',
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: Metrix.HorizontalSize(10),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    shadowColor: '#000000',
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 20,
  },
  searchContainer: {
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    paddingTop: '11%',
  },
  searchIcon: {
    width: Metrix.HorizontalSize(20),
    height: Metrix.VerticalSize(20),
    tintColor: Utills.selectedThemeColors().Base,
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Metrix.VerticalSize(100),
    // flex: 5,
    // borderWidth:1
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Utills.selectedThemeColors().TextInputBorderColor,
    borderRadius: Metrix.HorizontalSize(10),
    flex: 1,
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.HorizontalSize(10),
    fontSize: 16,
  },
  milesText: {
    marginLeft: 10,
    fontSize: 16,
    color: Utills.selectedThemeColors().Base,
  },
  safeZoneTitleInput: {
    borderWidth: 1,
    borderRadius: Metrix.HorizontalSize(10),
    paddingHorizontal: Metrix.HorizontalSize(20),
    paddingVertical: Metrix.HorizontalSize(12),
    marginBottom: Metrix.VerticalSize(10),
    borderColor: Utills.selectedThemeColors().TextInputBorderColor,
    fontSize: 16,
  },
  safeZoneTitle: {
    color: Utills.selectedThemeColors().Base,
    textAlign: 'center',
    paddingBottom: Metrix.VerticalSize(10),
    fontWeight: '700',
  },
  deleteContainer: {
    width: Metrix.HorizontalSize(28),
    height: Metrix.VerticalSize(28),
    borderRadius: Metrix.VerticalSize(100),
  },
  safezoneNameContainer: {
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.VerticalSize(7),
    borderRadius: Metrix.VerticalSize(100),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    marginTop: Metrix.VerticalSize(3),
  },
  safeZoneTxt: {
    color: Utills.selectedThemeColors().Base,
    fontWeight: '500',
  },
  searchButton: {
    alignSelf: 'center',
    paddingVertical: Metrix.VerticalSize(6),
    paddingHorizontal: Metrix.VerticalSize(10),
    borderRadius: Metrix.HorizontalSize(5),
    backgroundColor: Utills.selectedThemeColors().Primary,
    marginVertical: Metrix.VerticalSize(10),
  },
  searchBtnText: {
    color: Utills.selectedThemeColors().PrimaryTextColor,
    fontWeight: '600',
  },
});
