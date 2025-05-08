import i18n from 'i18next';
import {initReactI18next, useTranslation} from 'react-i18next';
import {I18nManager} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const resources = {
  en: {
    translation: {
      // AUTH FLOW

      // OnboardingSCREEN
      Onboarding_heading1:
        'Our AI actively listens for signs of danger when you are moving. If a real threat is detected Rove will be activated.',
      Onboarding_heading2:
        'Your chosen contacts are only notified if an assault is detected. When Rove is triggered, your audio stream and live location is instantly shared so your trusted contacts can take action.',
      Onboarding_heading3:
        'Live streaming can be an effective deterrence as you can show perpetrators  that they are not just being recorded - they are being watched.',
      Onboarding_heading4:
        'Footage can only be deleted after 7 days so even if your phone is taken or smashed, your footage is safe and accessible to your trusted contacts. \n \n  If a someone tries to delete footage from your phone, the back camera will take a photo and share with your contacts - but it will look as if the footage is deleted.',
      skip: 'Skip',
      next: 'Next',
    },
  },
  ar: {
    translation: {
      // AUTH FLOW
    },
  },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: I18nManager.isRTL ? 'ar' : 'en',

  interpolation: {
    escapeValue: true,
  },
});

const changeLan = async () => {
  const language = await AsyncStorage.getItem('lan');
  if (language != null) {
    i18n.changeLanguage('ar').then(() => {});
  }
};

changeLan();
