import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

// params Object
type AuthParamList = {
  OtpScreen: {email: string; from?: string; phone: string};
  VideoScreen: {courseId?: string};
};

type HomeParamList = {};

// Auth Screens Types
export type LoginScreenProps = {};

export type OtpScreenProps = {
  navigation: StackNavigationProp<AuthParamList, 'OtpScreen'>;
  route: RouteProp<AuthParamList, 'OtpScreen'>;
};

export type ForgotPasswordProps = {};

export type RegisterScreenProps = {};

export type SelectLanguageProps = {};

export type GoogleSignUpProps = {};

export type VerifyUserProps = {};

export type OnBoardingProps = {};

// Home Screen Types

export type NavigationScreenProps = {};

export type TermsAndPolicyProps = {};

export type TrustedContactsProps = {};

export type SearchProps = {};

export type LiveStreamProps = {};

export type PreferencesProps = {};

export type EditPreferencesProps = {};

export type AddContactsProps = {};

export type SettingsProps = {};

export type EditProfileProps = {};

export type FAQProps = {};

export type SafeZoneProps = {};

export type FootagesProps = {};

export type FootageDetailsProps = {};
