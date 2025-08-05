import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { TrustedContactsProps } from '../../propTypes';
import {
  CustomText,
  Loader,
  MainContainer,
  PrimaryButton,
  RoundImageContainer,
} from '../../../components';
import { t } from 'i18next';
import {
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import { createShadow, normalizeFont } from '../../../config/metrix';
import { HomeAPIS } from '../../../services/home';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/reducers';
import { useFocusEffect } from '@react-navigation/native';
import ContactImageDB from '../../../config/utills/ContactImageDB';

const { width } = Dimensions.get('window');


export const TrustedContacts: React.FC<TrustedContactsProps> = ({ }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [refreshing, setRefreshing] = useState(false);
  const userDetails = useSelector((state: RootState) => state.home.userDetails);

  const wait = (timeout: any) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  const onRefresh = () => {
    setRefreshing(true);
    wait(1000).then(() => {
      getContacts();
      setRefreshing(false);
    });
  };

  const getContacts = async () => {
    setLoading(true);
    try {
      const res = await HomeAPIS.getTrustedContacts();

      if (res?.data && res.data.length > 0) {
        // Get all contact IDs
        const contactIds = res.data.map(item => item.id.toString());

        // Get all images from database in one call
        const contactImages = await ContactImageDB.getMultipleContactImages(contactIds);

        let array: Array<{
          id: any;
          name: any;
          phone: any;
          abbreviate: any;
          serviceType: any;
          avatar?: any;
        }> = [];

        // Process each contact
        res.data.forEach((item: any) => {
          const contactId = item.id.toString();
          const dbImage = contactImages[contactId];

          // More robust avatar checking
          let finalAvatar = null;

          if (dbImage && dbImage !== '') {
            finalAvatar = dbImage;
          } else if (item?.avatar && item.avatar !== '' && item.avatar !== null) {
            finalAvatar = item.avatar;
          }

          array.push({
            id: item?.id,
            name: item?.name,
            phone: item?.phone_number,
            abbreviate: item?.name?.charAt(0)?.toUpperCase() || '?',
            serviceType: item?.alert_to,
            avatar: finalAvatar, // Will be null if no valid avatar found
          });
        });
        setData(array?.reverse());
      } else {
        setData([]);
      }

      setLoading(false);
    } catch (err) {
      console.log('Error getting contacts:', err?.response?.data);
      setLoading(false);
    }
  };

  const deleteContact = async (id: any) => {
    setLoading(true);
    try {
      await HomeAPIS.deleteTrustedContact(id);

      // Also delete the image from local database
      const contactId = id.toString();
      const deletedFromDb = await ContactImageDB.deleteContactImage(contactId);
      console.log(`Contact image ${deletedFromDb ? 'deleted' : 'failed to delete'} from database for contact ID: ${contactId}`);

      // Refresh the contacts list
      getContacts();
    } catch (err) {
      console.log('Error deleting contact:', err?.response?.data);
      setLoading(false);
    }
  };

  const handleTestStream = (contact: any) => {
    // Navigate to LiveStream with the selected contact for test streaming
    NavigationService.navigate(RouteNames.HomeRoutes.TabStack, {
      screen: 'LiveStream',
      params: {
        testStreamContact: contact,
        isTestStream: true
      },
    });
  };


  useFocusEffect(
    useCallback(() => {
      getContacts();
      return () => {
        console.log('Screen is unfocused');
      };
    }, []),
  );

  const renderContactListItem = ({ item }: any) => {
    const hasValidAvatar = !!item?.avatar && item.avatar !== 'null' && item.avatar !== '';
  
    // Derive fallback initial safely
    const fallbackLetter = (item?.name?.trim()?.charAt(0) || '?').toUpperCase();
  
    return (
      <View key={item?.id} style={styles.card}>
        <View style={styles.leftBox}>
          {hasValidAvatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.contactAvatar}
              onError={() => {
                console.log('Failed to load avatar for contact:', item?.name);
              }}
            />
          ) : (
            <View style={styles.circularView}>
              <CustomText.LargeBoldText customStyle={styles.circularText}>
                {fallbackLetter}
              </CustomText.LargeBoldText>
            </View>
          )}
        </View>
  
        <View style={styles.rightBox}>
          <CustomText.MediumText
            numberOfLines={1}
            customStyle={styles.rightText}>
            {item?.name}
          </CustomText.MediumText>
        </View>
  
        <View style={styles.editBox}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              NavigationService.navigate(RouteNames.HomeRoutes.AddContacts, {
                from: 'edit',
                userInfo: item,
              });
            }}>
            <RoundImageContainer
              resizeMode="contain"
              circleWidth={28}
              source={Images.Edit}
            />
          </TouchableOpacity>
  
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Are you sure?', 'You want to delete this contact', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: () => deleteContact(item?.id) },
              ]);
            }}>
            <RoundImageContainer
              styles={{ width: Metrix.HorizontalSize(34), height: Metrix.VerticalSize(35) }}
              resizeMode="contain"
              circleWidth={30}
              source={Images.Delete}
            />
          </TouchableOpacity>
  
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.testStreamButton}
            onPress={() => handleTestStream(item)}>
            <CustomText.SmallText customStyle={styles.testStreamText}>
              Test{'\n'}stream
            </CustomText.SmallText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  


  return (
    <MainContainer>
      <View style={styles.titleContainer}>
        <Image
          source={Images.Premium}
          style={styles.premiumIcon}
        />
        <Text style={styles.title}>Responders</Text>
      </View>

      {/* Add the subtitle text here */}
      <CustomText.RegularText
        customStyle={{
          marginTop: Metrix.VerticalSize(15),
          lineHeight: 20,
        }}>
        {t('Add trusted contacts to be notified instantly in an emergency. They\'ll get your live location, alerts, and updates to help you quickly and effectively.')}
      </CustomText.RegularText>

      <View style={{ flex: 1, marginTop: Metrix.VerticalSize(20) }}>
        <PrimaryButton
          title={'Add Contact'}
          width={'97%'}
          customStyles={{ alignSelf: 'center' }}
          onPress={() => {
            // 🚨 Deliberate crash for testing
            // throw new Error('Test crash: Intentional crash from Add Contact button');

            NavigationService.navigate(RouteNames.HomeRoutes.AddContacts);
          }}
        />
        <FlatList
          data={data}
          renderItem={renderContactListItem}
          keyExtractor={item => item?.id}
          contentContainerStyle={styles.flatlist}
          showsVerticalScrollIndicator={false}
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

      <Loader isLoading={loading} />
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  headingContainer: {
    paddingHorizontal: Metrix.HorizontalSize(15),
    paddingVertical: Metrix.HorizontalSize(20),
  },
  flatlist: {
    paddingHorizontal: Metrix.VerticalSize(5),
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    // paddingHorizontal: Metrix.HorizontalSize(10),    
    paddingVertical: Metrix.VerticalSize(5),
    borderRadius: Metrix.HorizontalSize(10),
    height: Metrix.VerticalSize(70),
    marginVertical: Metrix.VerticalSize(10),
    // backgroundColor: Utills.selectedThemeColors().Primary,
    // ...createShadow,
    // shadowColor: Utills.selectedThemeColors().NotFocussed,
    flexDirection: 'row',
  },
  leftBox: {
    marginRight: Metrix.HorizontalSize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularView: {
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    borderRadius: Metrix.HorizontalSize(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularText: {
    // marginVertical: Metrix.VerticalSize(0),
    color: Utills.selectedThemeColors().Base,
    fontSize: normalizeFont(24),
  },
  rightBox: {
    width: '45%',
    justifyContent: 'center',
    paddingHorizontal: Metrix.HorizontalSize(8),
    paddingLeft: Metrix.HorizontalSize(5),
  },
  editBox: {
    width: '38%',
    justifyContent: 'center', // Changed from 'space-between'
    alignItems: 'center',
    paddingHorizontal: Metrix.HorizontalSize(5), // Added padding
    flexDirection: 'row',
    gap: Metrix.HorizontalSize(8), // Added consistent gap between buttons
    // backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
  },
  rightText: {
    marginBottom: Metrix.VerticalSize(3),
    fontWeight: '700',
    textAlign: 'left'
  },
  addContact: {
    position: 'absolute',
    bottom: '5%',
    right: '7%',
    borderRadius: Metrix.HorizontalSize(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,

    padding: Metrix.HorizontalSize(10),
    flexDirection: 'row',
  },
  testStreamButton: {
    paddingHorizontal: Metrix.HorizontalSize(10),
    paddingVertical: Metrix.VerticalSize(7),
    borderRadius: Metrix.HorizontalSize(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0005'
  },
  testStreamText: {
    color: Utills.selectedThemeColors().PrimaryTextColor,
    fontSize: normalizeFont(12),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Space between icon and text
  },
  premiumIcon: {
    tintColor: '#fff', // Black color
    resizeMode: 'contain',
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
  },
  title: {
    fontSize: Math.min(width * 0.045, 18), // Responsive font size
    fontWeight: '600',
    color: '#fff',
    textAlign: 'left',
    flex: 1, // Take remaining space
  },
  contactAvatar: {
    width: Metrix.HorizontalSize(35),
    height: Metrix.VerticalSize(35),
    borderRadius: Metrix.HorizontalSize(17.5), // Half of width/height for perfect circle
    // borderWidth: 1,
    // borderColor: Utills.selectedThemeColors().PrimaryTextColor,
  },

});