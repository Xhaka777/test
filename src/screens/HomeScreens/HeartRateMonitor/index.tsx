import {ScrollView} from 'react-native';
import React, {useEffect} from 'react';
import {HeartRateMonitorProps} from '../../propTypes';
import {BackHeader, CustomText, MainContainer} from '../../../components';
import {useRoute} from '@react-navigation/native';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import {HealthPermissions} from '../../../permissonsServices';

export const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({}) => {
  const getHearRate = () => {
    AppleHealthKit.initHealthKit(HealthPermissions, (error: string) => {
      /* Called after we receive a response from the system */
      if (error) {
        console.log('[ERROR] Cannot grant permissions!');
      }
      /* Can now read or write to HealthKit */
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
        },
      );
    });
  };

  useEffect(() => {
    getHearRate();
  }, []);

  return (
    <MainContainer isFlatList>
      <BackHeader heading={'Heart Rate Monitoring'} />
    </MainContainer>
  );
};
