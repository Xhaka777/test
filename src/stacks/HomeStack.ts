import { TransitionPresets } from '@react-navigation/stack';
import { RouteNames } from '../config';
import {
  AddContacts,
  EditPreferences,
  EditProfile,
  FAQ,
  FootageDetails,
  Footages,
  HeartRateMonitor,
  LiveStream,
  TermsAndPolicy,
  Videos,
  PasscodeSettings,
  TrustedContacts,
  HowToUse,
} from '../screens';
import { TabStack } from './TabStack';

type HomeScreenStacksTypes = {
  name: string;
  component: any;
  key: string;
  option?: any;
}[];

export const HomeStack: HomeScreenStacksTypes = [
  {
    name: RouteNames.HomeRoutes.TabStack,
    component: TabStack,
    key: RouteNames.HomeRoutes.TabStack,
  },
  {
    name: RouteNames.HomeRoutes.LiveStream,
    component: LiveStream,
    key: RouteNames.HomeRoutes.LiveStream,
  },
  {
    name: RouteNames.HomeRoutes.EditProfileScreen,
    component: EditProfile,
    key: RouteNames.HomeRoutes.EditProfileScreen,
  },
  {
    name: RouteNames.HomeRoutes.AddContacts,
    component: AddContacts,
    key: RouteNames.HomeRoutes.AddContacts,
  },
  {
    name: RouteNames.HomeRoutes.TermsAndPolicy,
    component: TermsAndPolicy,
    key: RouteNames.HomeRoutes.TermsAndPolicy,
  },
  {
    name: RouteNames.HomeRoutes.FAQ,
    component: FAQ,
    key: RouteNames.HomeRoutes.FAQ,
  },
  {
    name: RouteNames.HomeRoutes.EditPreferences,
    component: EditPreferences,
    key: RouteNames.HomeRoutes.EditPreferences,
  },
  {
    name: RouteNames.HomeRoutes.Footages,
    component: Footages,
    key: RouteNames.HomeRoutes.Footages,
  },
  {
    name: RouteNames.HomeRoutes.FootageDetails,
    component: FootageDetails,
    key: RouteNames.HomeRoutes.FootageDetails,
  },
  {
    name: RouteNames.HomeRoutes.Videos,
    component: Videos,
    key: RouteNames.HomeRoutes.Videos,
    option: {
      ...TransitionPresets.ModalTransition,
    },
  },
  {
    name: RouteNames.HomeRoutes.HeartRateMonitor,
    component: HeartRateMonitor,
    key: RouteNames.HomeRoutes.HeartRateMonitor,
  },
  {
    name: RouteNames.HomeRoutes.PasscodeSettings,
    component: PasscodeSettings,
    key: RouteNames.HomeRoutes.PasscodeSettings
  },
  {
    name: RouteNames.HomeRoutes.TrustedContacts,
    component: TrustedContacts,
    key: RouteNames.HomeRoutes.TrustedContacts,
  },
  {
    name: RouteNames.HomeRoutes.HowToUse,
    component: HowToUse,
    key: RouteNames.HomeRoutes.HowToUse,
  },
];
