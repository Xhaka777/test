import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {FootagesProps} from '../../propTypes';
import {
  BackHeader,
  FootageGrid,
  Loader,
  MainContainer,
} from '../../../components';
import {Metrix, Utills} from '../../../config';
import {createShadow} from '../../../config/metrix';
import {HomeAPIS} from '../../../services/home';
import {useFocusEffect} from '@react-navigation/native';

export const Footages: React.FC<FootagesProps> = ({}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const getIncidents = () => {
    setLoading(true);
    HomeAPIS.getIncidents()
      .then(res => {
        let array: any = [];
        res?.data?.map((item: any) => {
          array?.push({
            id: item?.id,
            createdAt: item?.timestamp,
            lat: item?.location_latitude,
            lng: item?.location_longitude,
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

  useFocusEffect(
    useCallback(() => {
      getIncidents();
    }, []),
  );

  const renderFootageItem = ({item}: any) => {
    return <FootageGrid item={item} />;
  };
  return (
    <MainContainer>
      <BackHeader heading="Incidents Records" />
      <View style={{flex: 1}}>
        <FlatList
          data={data}
          renderItem={renderFootageItem}
          keyExtractor={item => item?.id}
          contentContainerStyle={styles.flatlist}
          showsVerticalScrollIndicator={false}
          numColumns={3}
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
  flatlist: {
    alignSelf: 'center',
    paddingVertical: Metrix.VerticalSize(10),
    width: '100%',
  },
});
