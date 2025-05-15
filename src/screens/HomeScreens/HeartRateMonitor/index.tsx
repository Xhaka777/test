import {FlatList, ScrollView, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {HeartRateMonitorProps} from '../../propTypes';
import {BackHeader, CustomText, MainContainer} from '../../../components';
import {useRoute} from '@react-navigation/native';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import {HealthPermissions} from '../../../permissonsServices';
import moment from 'moment';
import {Metrix, Utills} from '../../../config';

export const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({}) => {
  const [hearRateData, setHearRateData] = useState<HealthValue[]>([]);
  const getHearRate = () => {
    AppleHealthKit.initHealthKit(HealthPermissions, (error: string) => {
      if (error) {
        console.log('[ERROR] Cannot grant permissions!');
      }

      const options = {
        startDate: new Date(2020, 1, 1).toISOString(),
      };
      AppleHealthKit.getHeartRateSamples(
        options,
        (callbackError: string, results: HealthValue[]) => {
          if (callbackError) {
            console.log('[ERROR] Cannot read heart rate samples!');
          }
          console.log('Heart Rate Samples: ', results);
          setHearRateData(results);
        },
      );
    });
  };

  console.log('hearRateData', hearRateData?.[0]?.value);

  useEffect(() => {
    getHearRate();
  }, []);

  const renderItem = ({item}: any) => {
    return (
      <View
        style={{
          padding: 10,
          borderBottomWidth: 1,
          borderColor: Utills.selectedThemeColors().SecondaryTextColor,
          alignItems: 'center',
        }}>
        <CustomText.MediumText>
          {`Heart Rate: ${item?.value} BPM`}
        </CustomText.MediumText>
        <CustomText.RegularText>
          {`Date: ${moment(item?.startDate).format('DD-MMM-YYYY HH:mm:ss A')}`}
        </CustomText.RegularText>
      </View>
    );
  };

  return (
    <MainContainer isFlatList>
      <BackHeader heading={'Heart Rate Monitoring'} />
      <View style={{flex: 1}}>
        <FlatList
          data={hearRateData}
          renderItem={renderItem}
          contentContainerStyle={{paddingVertical: Metrix.VerticalSize(20)}}
        />
      </View>
    </MainContainer>
  );
};
