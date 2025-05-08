import {
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AddContactsProps} from '../../propTypes';
import {
  BackHeader,
  CustomInput,
  CustomModal,
  CustomText,
  Loader,
  MainContainer,
  PrimaryButton,
} from '../../../components';
import {t} from 'i18next';
import {Images, Metrix, NavigationService, Utills} from '../../../config';
import {Image} from 'react-native';
import {HomeAPIS} from '../../../services/home';
import Contacts, { Contact } from 'react-native-contacts';
import {useIsFocused, useRoute} from '@react-navigation/native';
import {CustomSearchBar} from '../../../components/SearchBar';

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

export const AddContacts: React.FC<AddContactsProps> = ({}) => {
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
  const [filteredData, setFilteredData] = useState([]); // For filtered data
  const [searchVal, setSearchVal] = useState('');
  const [name, setName] = useState(userInfo?.name);
  const [phone, setPhone] = useState(userInfo?.phone);
  const isFocus = useIsFocused();
  // console.log('setSelectedContact', contacts);

  let phoneRef = useRef<TextInput>(null!);

  const loadContacts = () => {
    Contacts.getAll()
      .then(contacts => {
        setContacts(contacts);
        setLoading(false);
        // this.setState({ contacts, loading: false });
      })
      .catch(e => {
        // this.setState({ loading: false });
        setLoading(false);
      });

    Contacts.getCount().then(count => {
      // this.setState({ searchPlaceholder: `Search ${count} contacts` });
      // setSearchPlaceholder(`Search ${count} contacts`);
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
      console.log('aagya');
      Contacts.getContactsByPhoneNumber(text).then((contacts: any) => {
        setContacts(contacts);
      });
    } else if (emailAddressRegex.test(text)) {
      console.log('second');
      Contacts.getContactsByEmailAddress(text).then((contacts: any) => {
        setContacts(contacts);
      });
    } else {
      Contacts.getContactsMatchingString(text).then((contacts: any) => {
        setContacts(contacts);
        console.log('last');
      });
    }
  };

  useEffect(() => {
    search(searchVal);
  }, [searchVal]);

  const keyExtractor = (
    item: {recordID: {toString: () => any}},
    idx: {toString: () => any},
  ) => {
    return item?.recordID?.toString() || idx.toString();
  };

  const addContact = () => {
    if (name?.length == 0 || name == undefined) {
      Utills.showToast('Enter name');
    } else if (phone?.length == 0 || phone == undefined) {
      Utills.showToast('Enter Phone number');
    } else {
      const body = {
        name: name,
        phone_number: phone?.replace(/[\s\-()]/g, ''),
        alert_to: selectedService,
      };
      console.log('Body', body);
      setLoading(true);
      HomeAPIS.addTrustedContact(body)
        .then(res => {
          setLoading(false);
          Utills.showToast('Trusted Contact Added Successfully');
          setTimeout(() => {
            NavigationService.goBack();
          }, 500);
        })
        .catch(err => {
          console.log('Err', err?.response);
          setLoading(false);
        });
    }
  };

  const editContact = () => {
    if (name?.length == 0) {
      Utills.showToast('Enter name');
    } else if (phone?.length == 0) {
      Utills.showToast('Enter Phone number');
    } else {
      const body = {
        name: name,
        phone_number: phone?.replace(/[\s\-()]/g, ''),
        alert_to: selectedService,
      };
      console.log('Body', body);

      setLoading(true);
      HomeAPIS.editTrustedContact(userInfo?.id, body)
        .then(res => {
          setLoading(false);
          Utills.showToast('Trusted Contact Edited Successfully');
          setTimeout(() => {
            NavigationService.goBack();
          }, 500);
        })
        .catch(err => {
          console.log('Err', err?.response);
          setLoading(false);
        });
    }
  };

  const renderItem = ({item}: any) => {
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedContact(item);
          setPhone(item?.phoneNumbers[0]?.number);
          setName(item?.givenName + ' ' + item?.familyName);
          setContactModal(false);
        }}
        activeOpacity={0.7}
        style={styles.contactCon}>
        <View style={styles.imgCon}>
          <View style={styles.placeholder}>
            <CustomText.LargeSemiBoldText
              customStyle={{color: Utills.selectedThemeColors().Base}}>
              {item?.givenName[0]}
            </CustomText.LargeSemiBoldText>
          </View>
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
      <View style={{marginBottom: Metrix.VerticalSize(10)}}>
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
      <View style={{flex: 1, paddingVertical: Metrix.VerticalSize(10)}}>
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
          customIconStyle={{width: '65%', height: '65%'}}
          eyeImg={Images.Phonebook}
          value={phone}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="done"
          inputRef={phoneRef}
        />
        <CustomText.MediumText
          customStyle={{paddingVertical: Metrix.VerticalSize(10)}}>
          {t('Select Alert Service')}
        </CustomText.MediumText>
        <View style={{flexDirection: 'row'}}>
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

const styles = StyleSheet.create({
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
});
