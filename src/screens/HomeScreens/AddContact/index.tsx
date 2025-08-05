import {
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AddContactsProps } from '../../propTypes';
import {
  BackHeader,
  CustomInput,
  CustomModal,
  CustomText,
  Loader,
  MainContainer,
  PrimaryButton,
} from '../../../components';
import { t } from 'i18next';
import { Images, Metrix, NavigationService, Utills } from '../../../config';
import { Image } from 'react-native';
import { HomeAPIS } from '../../../services/home';
import Contacts, { Contact } from 'react-native-contacts';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { CustomSearchBar } from '../../../components/SearchBar';
import ImagePicker from 'react-native-image-crop-picker';
import ContactImageDB from '../../../config/utills/ContactImageDB';
import RNFS from 'react-native-fs';
import { captureRef } from 'react-native-view-shot';

const alertServices = [
  {
    id: '1',
    service: 'SMS',
    icon: Images.Sms,
  },
  {
    id: '2',
    service: 'WhatsApp',
    icon: Images.Whatsapp,
  },
];

// Letter Avatar Component with ref capability
const LetterAvatar = React.forwardRef(({ name, size = 100 }, ref) => {
  const firstLetter = name?.charAt(0)?.toUpperCase() || '?';
  
  return (
    <View 
      ref={ref}
      style={[
        styles.letterAvatarContainer, 
        { width: size, height: size, borderRadius: size / 2 }
      ]}>
      <CustomText.LargeBoldText customStyle={[
        styles.letterAvatarText,
        { fontSize: size * 0.4 }
      ]}>
        {firstLetter}
      </CustomText.LargeBoldText>
    </View>
  );
});

export const AddContacts: React.FC<AddContactsProps> = ({ }) => {
  const route = useRoute<any>();
  const userInfo = route?.params?.userInfo;
  const from = route?.params?.from;
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(
    userInfo?.serviceType || 'SMS',
  );
  const [selectedContact, setSelectedContact] = useState({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactModal, setContactModal] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [name, setName] = useState(userInfo?.name || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');

  // Profile Header states
  const [selectedImage, setSelectedImage] = useState(null);
  const [iconVisible, setIconVisible] = useState(false);
  const [isUsingLetterAvatar, setIsUsingLetterAvatar] = useState(true);

  const isFocus = useIsFocused();
  let phoneRef = useRef<TextInput>(null!);
  const letterAvatarRef = useRef(null);

  // Check if we have a valid image to show
  const hasValidImage = selectedImage && selectedImage !== '' && selectedImage !== null;

  // Function to generate letter avatar image
  const generateLetterAvatarImage = async (contactName) => {
    try {
      if (!letterAvatarRef.current || !contactName) {
        return null;
      }

      // Capture the letter avatar as an image
      const imageUri = await captureRef(letterAvatarRef.current, {
        format: 'png',
        quality: 1,
        width: 200,
        height: 200,
      });

      // Copy to permanent location
      const fileName = `letter_avatar_${Date.now()}.png`;
      const permanentPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.copyFile(imageUri, permanentPath);
      console.log('Letter avatar image saved to:', permanentPath);
      
      return permanentPath;
    } catch (error) {
      console.error('Error generating letter avatar image:', error);
      return null;
    }
  };

  // Image picker function
  const imagePicker = async () => {
    try {
      const image = await ImagePicker?.openPicker({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: true,
        width: 300,
        height: 300,
        compressImageQuality: 0.8,
      });
  
      if (!image?.path || image?.path === '') {
        Utills.showToast('Upload image field required.');
        return;
      } else {
        // Copy the image to a permanent location
        const fileName = `contact_${Date.now()}.jpg`;
        const permanentPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        
        try {
          await RNFS.copyFile(image.path, permanentPath);
          console.log('Image copied to permanent location:', permanentPath);
          
          setSelectedImage(permanentPath);
          setIsUsingLetterAvatar(false);
          setIconVisible(true);
        } catch (copyError) {
          console.error('Error copying image to permanent location:', copyError);
          setSelectedImage(image.path);
          setIsUsingLetterAvatar(false);
          setIconVisible(true);
        }
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled image selection') {
        console.error('Error uploading image', error);
      }
    }
  };

  const onCancel = () => {
    setSelectedImage(null);
    setIsUsingLetterAvatar(true);
    setIconVisible(false);
  };
  
  const onSelect = () => {
    setIconVisible(false);
  };

  const loadContacts = () => {
    Contacts.getAll()
      .then(contacts => {
        setContacts(contacts);
        setLoading(false);
      })
      .catch(e => {
        setLoading(false);
      });

    Contacts.getCount().then(count => {
      // Handle count if needed
    });

    Contacts.checkPermission();
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
        title: 'Contacts',
        message: 'This app would like to view your contacts.',
        buttonPositive: 'OK',
      }).then(() => {
        loadContacts();
      });
    } else {
      loadContacts();
    }
  }, [isFocus]);

  const search = (text: string) => {
    const phoneNumberRegex =
      /\b[\+]?[(]?[0-9]{2,6}[)]?[-\s\.]?[-\s\/\.0-9]{3,15}\b/m;
    const emailAddressRegex =
      /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
    if (text === '' || text === null) {
      loadContacts();
    } else if (phoneNumberRegex.test(text)) {
      Contacts.getContactsByPhoneNumber(text).then((contacts: any) => {
        setContacts(contacts);
      });
    } else if (emailAddressRegex.test(text)) {
      Contacts.getContactsByEmailAddress(text).then((contacts: any) => {
        setContacts(contacts);
      });
    } else {
      Contacts.getContactsMatchingString(text).then((contacts: any) => {
        setContacts(contacts);
      });
    }
  };

  useEffect(() => {
    search(searchVal);
  }, [searchVal]);

  const keyExtractor = (
    item: { recordID: { toString: () => any } },
    idx: { toString: () => any },
  ) => {
    return item?.recordID?.toString() || idx.toString();
  };

  const addContact = async () => {
    if (name?.length == 0 || name == undefined) {
      Utills.showToast('Enter name');
    } else if (phone?.length == 0 || phone == undefined) {
      Utills.showToast('Enter Phone number');
    } else {
      setLoading(true);

      try {
        let finalImagePath = selectedImage;

        // If no custom image is selected, generate letter avatar image
        if (!selectedImage && isUsingLetterAvatar && name) {
          finalImagePath = await generateLetterAvatarImage(name);
        }

        const body = {
          name: name,
          phone_number: phone?.replace(/[\s\-()]/g, ''),
          alert_to: selectedService,
          avatar: finalImagePath,
        };

        console.log('Adding contact with body:', body);

        const res = await HomeAPIS.addTrustedContact(body);

        // Save image to local database if contact was created successfully
        if (finalImagePath && res?.data?.id) {
          const contactId = res.data.id.toString();
          const savedToDb = await ContactImageDB.saveContactImage(contactId, finalImagePath);

          if (savedToDb) {
            console.log(`Contact image saved to database for contact ID: ${contactId}`);
          } else {
            console.warn(`Failed to save contact image to database for contact ID: ${contactId}`);
          }
        }

        setLoading(false);
        Utills.showToast('Trusted Contact Added Successfully');
        setTimeout(() => {
          NavigationService.goBack();
        }, 500);

      } catch (err) {
        console.log('Error adding contact:', err?.response);
        setLoading(false);
      }
    }
  };

  const editContact = async () => {
    if (name?.length == 0) {
      Utills.showToast('Enter name');
    } else if (phone?.length == 0) {
      Utills.showToast('Enter Phone number');
    } else {
      setLoading(true);

      try {
        let finalImagePath = selectedImage;

        // If no custom image is selected but using letter avatar, generate it
        if (!selectedImage && isUsingLetterAvatar && name) {
          finalImagePath = await generateLetterAvatarImage(name);
        }

        const body = {
          name: name,
          phone_number: phone?.replace(/[\s\-()]/g, ''),
          alert_to: selectedService,
          avatar: finalImagePath,
        };

        console.log('Editing contact with body:', body);

        const res = await HomeAPIS.editTrustedContact(userInfo?.id, body);

        // Update image in local database
        if (userInfo?.id) {
          const contactId = userInfo.id.toString();

          if (finalImagePath) {
            // Save/update the image
            const savedToDb = await ContactImageDB.saveContactImage(contactId, finalImagePath);
            console.log(`Contact image ${savedToDb ? 'saved' : 'failed to save'} for contact ID: ${contactId}`);
          } else {
            // Remove the image if none selected
            const deletedFromDb = await ContactImageDB.deleteContactImage(contactId);
            console.log(`Contact image ${deletedFromDb ? 'deleted' : 'failed to delete'} for contact ID: ${contactId}`);
          }
        }

        setLoading(false);
        Utills.showToast('Trusted Contact Edited Successfully');
        setTimeout(() => {
          NavigationService.goBack();
        }, 500);

      } catch (err) {
        console.log('Error editing contact:', err?.response);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const loadExistingImage = async () => {
      if (from === 'edit' && userInfo?.id) {
        // First check AsyncStorage database
        const dbImage = await ContactImageDB.getContactImage(userInfo.id.toString());

        if (dbImage && dbImage !== '') {
          console.log(`Loaded image from database for contact ${userInfo.id}:`, dbImage);
          setSelectedImage(dbImage);
          setIsUsingLetterAvatar(false);
        } else if (userInfo?.avatar && userInfo.avatar !== '') {
          // Fallback to API avatar
          console.log(`Using API avatar for contact ${userInfo.id}:`, userInfo.avatar);
          setSelectedImage(userInfo.avatar);
          setIsUsingLetterAvatar(false);
        } else {
          // No image found, will show letter avatar
          setIsUsingLetterAvatar(true);
        }
      }
    };

    loadExistingImage();
  }, [from, userInfo?.id]);

  const renderItem = ({ item }: any) => {
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedContact(item);
          setPhone(item?.phoneNumbers[0]?.number);
          setName(item?.givenName + ' ' + item?.familyName);
          // Only set contact image if it actually exists
          if (item?.thumbnailPath && item.thumbnailPath !== '') {
            setSelectedImage(item.thumbnailPath);
            setIsUsingLetterAvatar(false);
          } else {
            setSelectedImage(null);
            setIsUsingLetterAvatar(true);
          }
          setContactModal(false);
        }}
        activeOpacity={0.7}
        style={styles.contactCon}>
        <View style={styles.imgCon}>
          {item?.thumbnailPath ? (
            <Image
              source={{ uri: item.thumbnailPath }}
              style={styles.contactThumb}
            />
          ) : (
            <View style={styles.placeholder}>
              <CustomText.LargeSemiBoldText
                customStyle={{ color: Utills.selectedThemeColors().Base }}>
                {item?.givenName[0]}
              </CustomText.LargeSemiBoldText>
            </View>
          )}
        </View>
        <View style={styles.contactDat}>
          <CustomText.MediumText
            customStyle={{
              color: Utills.selectedThemeColors().PrimaryTextColor,
            }}>
            {item?.givenName} {item?.middleName && item.middleName + ' '}
            {item?.familyName}
          </CustomText.MediumText>
          <CustomText.RegularText isSecondaryColor>
            {item?.phoneNumbers[0]?.number}
          </CustomText.RegularText>
        </View>
      </TouchableOpacity>
    );
  };

  const contactHeader = useMemo(() => {
    return (
      <View style={{ marginBottom: Metrix.VerticalSize(10) }}>
        <CustomSearchBar
          value={searchVal}
          onChangeText={text => setSearchVal(text)}
          returnKeyType={'search'}
          placeholder="Search Contact"
          onSubmitEditing={() => search(searchVal)}
        />
      </View>
    );
  }, [searchVal]);

  return (
    <MainContainer>
      <BackHeader
        heading={from == 'edit' ? 'Edit Contact' : 'Add Contact'}
        isBoldHeading
      />
      <View style={{ flex: 1, paddingVertical: Metrix.VerticalSize(10) }}>
        <CustomInput
          heading={t('Full Name')}
          placeholder={t('Enter name')}
          onChangeText={value => {
            setName(value);
          }}
          value={name}
          returnKeyType="next"
          keyboardType="email-address"
          onSubmitEditing={() => phoneRef.current.focus()}
        />
        <CustomInput
          heading={t('Phone Number')}
          placeholder={t('Enter phone number')}
          onChangeText={value => {
            setPhone(value);
          }}
          eye
          onEyePress={() => {
            setContactModal(true);
          }}
          customIconStyle={{ width: '65%', height: '65%' }}
          eyeImg={Images.Phonebook}
          value={phone}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="done"
          inputRef={phoneRef}
        />

        {/* Custom Profile Section with Letter Avatar fallback */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {hasValidImage && !isUsingLetterAvatar ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.profileImage}
                onError={() => {
                  console.log('Image failed to load, falling back to letter avatar');
                  setSelectedImage(null);
                  setIsUsingLetterAvatar(true);
                }}
              />
            ) : (
              <LetterAvatar 
                ref={letterAvatarRef}
                name={name} 
                size={100} 
              />
            )}
            
            {/* Upload/Cancel/Check icons */}
            {iconVisible && (
              <View style={styles.imageActions}>
                <TouchableOpacity onPress={onCancel} style={styles.actionButton}>
                  <Image source={Images.Cancel} style={styles.actionIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onSelect} style={styles.actionButton}>
                  <Image source={Images.Check} style={styles.actionIcon} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <TouchableOpacity onPress={imagePicker} style={styles.changePhotoButton}>
            <CustomText.MediumText customStyle={styles.changePhotoText}>
              Change Photo
            </CustomText.MediumText>
          </TouchableOpacity>
        </View>

        <CustomText.MediumText
          customStyle={{ paddingVertical: Metrix.VerticalSize(10) }}>
          {t('Select Alert Service')}
        </CustomText.MediumText>
        <View style={{ flexDirection: 'row' }}>
          {alertServices?.map((item, index) => {
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedService(item?.service);
                }}
                key={item?.id}
                style={{
                  width: '18%',
                  height: Metrix.VerticalSize(55),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: Metrix.HorizontalSize(10),
                  borderWidth: selectedService == item?.service ? 1 : 0,
                  borderColor: 'green',
                }}>
                <Image
                  source={item?.icon}
                  style={{
                    width:
                      item?.id == '1'
                        ? Metrix.HorizontalSize(42)
                        : Metrix.HorizontalSize(45),
                    height:
                      item?.id == '1'
                        ? Metrix.HorizontalSize(42)
                        : Metrix.HorizontalSize(45),
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <PrimaryButton
        title={from == 'edit' ? 'Edit Contact' : 'Add Contact'}
        onPress={from == 'edit' ? editContact : addContact}
      />
      <Loader isLoading={loading} />

      <CustomModal
        title={'Select Contact'}
        visible={contactModal}
        onClose={() => {
          setContactModal(false);
        }}>
        <View>
          <FlatList
            data={contacts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={contactHeader}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </CustomModal>
    </MainContainer>
  );
};

// Complete StyleSheet
const styles = StyleSheet.create({
  // Contact modal styles
  contactCon: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Metrix.HorizontalSize(10),
    borderBottomWidth: 2,
    borderBottomColor: Utills.selectedThemeColors().TextInputBorderColor,
  },
  imgCon: {},
  placeholder: {
    width: Metrix.HorizontalSize(42),
    height: Metrix.VerticalSize(42),
    borderRadius: Metrix.VerticalSize(100),
    overflow: 'hidden',
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDat: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  contactThumb: {
    width: Metrix.HorizontalSize(42),
    height: Metrix.VerticalSize(42),
    borderRadius: Metrix.VerticalSize(21),
  },
  txt: {
    fontSize: 18,
  },
  name: {
    fontSize: 16,
    color: 'white',
  },
  phoneNumber: {
    color: '#888',
  },
  
  // Letter Avatar styles
  letterAvatarContainer: {
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterAvatarText: {
    color: Utills.selectedThemeColors().Base,
    fontWeight: 'bold',
  },
  
  // Profile section styles
  profileSection: {
    alignItems: 'center',
    marginVertical: Metrix.VerticalSize(20),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Metrix.VerticalSize(15),
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageActions: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  changePhotoButton: {
    paddingHorizontal: Metrix.HorizontalSize(20),
    paddingVertical: Metrix.VerticalSize(8),
  },
  changePhotoText: {
    color: Utills.selectedThemeColors().PrimaryTextColor,
    textDecorationLine: 'underline',
  },
});