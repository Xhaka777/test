import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {TrustedContactsProps} from '../../propTypes';
import {
  CustomText,
  Loader,
  MainContainer,
  PrimaryButton,
  RoundImageContainer,
} from '../../../components';
import {t} from 'i18next';
import {
  Images,
  Metrix,
  NavigationService,
  RouteNames,
  Utills,
} from '../../../config';
import {createShadow, normalizeFont} from '../../../config/metrix';
import {HomeAPIS} from '../../../services/home';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/reducers';
import {useFocusEffect} from '@react-navigation/native';

export const TrustedContacts: React.FC<TrustedContactsProps> = ({}) => {
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

  const getContacts = () => {
    setLoading(true);
    HomeAPIS.getTrustedContacts()
      .then(res => {
        let array:
          | ((prevState: never[]) => never[])
          | {
              id: any;
              name: any;
              phone: any;
              abbreviate: any;
              serviceType: any;
            }[] = [];
        res?.data?.map((item: any) => {
          array?.push({
            id: item?.id,
            name: item?.name,
            phone: item?.phone_number,
            abbreviate: item?.name.charAt(0)?.toUpperCase(),
            serviceType: item?.alert_to,
          });
        });
        setData(array?.reverse());
        setLoading(false);
      })
      .catch(err => {
        console.log('Err', err?.response?.data);
        setLoading(false);
      });
  };

  const deleteContact = (id: any) => {
    setLoading(true);
    HomeAPIS.deleteTrustedContact(id)
      .then(res => {
        // setLoading(false);
        getContacts();
      })
      .catch(err => {
        console.log('Err', err?.response?.data);
        // setLoading(false);
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

  const renderContactListItem = ({item}: any) => {
    return (
      <View key={item?.id} style={styles.card}>
        <View style={styles.leftBox}>
          <View style={styles.circularView}>
            <CustomText.LargeBoldText customStyle={styles.circularText}>
              {item?.abbreviate?.toUpperCase()}
            </CustomText.LargeBoldText>
          </View>
        </View>
        <View style={styles.rightBox}>
          <CustomText.MediumText
            numberOfLines={1}
            customStyle={styles.rightText}>
            {item?.name}
          </CustomText.MediumText>
          <CustomText.RegularText>{item?.phone}</CustomText.RegularText>
        </View>
        <View style={styles.editBox}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {

              // NavigationService.navigate(RouteNames.HomeRoutes.AddContacts, {
              //   from: 'edit',
              //   userInfo: item,
              // });
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
                {text: 'Cancel', style: 'cancel'},
                {text: 'OK', onPress: () => deleteContact(item?.id)},
              ]);
            }}>
            <RoundImageContainer
              resizeMode="contain"
              circleWidth={28}
              source={Images.Delete}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <MainContainer>
      <CustomText.ExtraLargeBoldText>
        {t('Trusted Contacts')}
      </CustomText.ExtraLargeBoldText>
      <View style={{flex: 1, marginTop: Metrix.VerticalSize(20)}}>
        <PrimaryButton
          title={'Add Contact'}
          width={'97%'}
          customStyles={{alignSelf: 'center'}}
          onPress={() => {
            // NavigationService.navigate(RouteNames.HomeRoutes.AddContacts);
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

      {/* <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          NavigationService.navigate(RouteNames.HomeRoutes.AddContacts);
        }}
        style={styles.addContact}>
        <RoundImageContainer
          circleWidth={24}
          source={Images.Plus}
          borderColor={Utills.selectedThemeColors().PrimaryTextColor}
          backgroundColor={Utills.selectedThemeColors().PrimaryTextColor}
        />
        <CustomText.RegularText
          customStyle={{
            marginLeft: Metrix.HorizontalSize(5),
            fontSize: normalizeFont(14),
            color: Utills.selectedThemeColors().Base,
            fontWeight: '600',
          }}
          numberOfLines={1}>
          Add Contact
        </CustomText.RegularText>
      </TouchableOpacity> */}
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
    paddingHorizontal: Metrix.HorizontalSize(10),
    paddingVertical: Metrix.VerticalSize(5),
    borderRadius: Metrix.HorizontalSize(10),
    height: Metrix.VerticalSize(70),
    marginVertical: Metrix.VerticalSize(10),
    backgroundColor: Utills.selectedThemeColors().Base,
    ...createShadow,
    shadowColor: Utills.selectedThemeColors().NotFocussed,
    flexDirection: 'row',
  },
  leftBox: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularView: {
    width: Metrix.HorizontalSize(45),
    height: Metrix.VerticalSize(45),
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    borderRadius: Metrix.HorizontalSize(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularText: {
    marginVertical: Metrix.VerticalSize(0),
    color: Utills.selectedThemeColors().Base,
    fontSize: normalizeFont(24),
  },
  rightBox: {
    width: '55%',
    justifyContent: 'center',
    paddingHorizontal: Metrix.HorizontalSize(2),
  },
  editBox: {
    width: '24%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Metrix.HorizontalSize(2),
    flexDirection: 'row',
  },
  rightText: {
    marginBottom: Metrix.VerticalSize(3),
    fontWeight: '700',
  },
  addContact: {
    position: 'absolute',
    bottom: '5%',
    right: '7%',
    // width: Metrix.HorizontalSize(50),
    // height: Metrix.VerticalSize(50),
    borderRadius: Metrix.HorizontalSize(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,

    padding: Metrix.HorizontalSize(10),
    // bottom: '5%',
    // right: '8%',
    flexDirection: 'row',
  },
});
