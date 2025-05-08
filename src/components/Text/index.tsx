import React, {ReactNode} from 'react';
import {
  Text,
  StyleSheet,
  StyleProp,
  TextStyle,
  TextProps,
  I18nManager,
} from 'react-native';
import {Metrix, Colors, Fonts, FontType, Images, Utills} from '../../config';
import {normalizeFont} from '../../config/metrix';

type CustomTextProps = TextProps & {
  children: ReactNode;
  customStyle?: StyleProp<TextStyle>;
  isSecondaryColor?: boolean;
};

const ExtraLargeBoldText = ({
  children,
  customStyle,
  isSecondaryColor,
  ...rest
}: CustomTextProps) => {
  return (
    <Text
      style={[
        styles.ExtraLargeBoldText,
        {
          color: isSecondaryColor
            ? Utills.selectedThemeColors().SecondaryTextColor
            : Utills.selectedThemeColors().PrimaryTextColor,
        },
        customStyle,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};

const LargeBoldText = ({
  children,
  customStyle,
  isSecondaryColor,
  ...rest
}: CustomTextProps) => {
  return (
    <Text
      style={[
        styles.LargeBoldText,
        {
          // textAlign: I18nManager.forceRTL ? "left" : "right",
          color: isSecondaryColor
            ? Utills.selectedThemeColors().SecondaryTextColor
            : Utills.selectedThemeColors().PrimaryTextColor,
        },
        ,
        customStyle,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};

const LargeSemiBoldText = ({
  children,
  customStyle,
  isSecondaryColor,
  ...rest
}: CustomTextProps) => {
  return (
    <Text
      style={[
        styles.LargeSemiBoldText,
        {
          color: isSecondaryColor
            ? Utills.selectedThemeColors().SecondaryTextColor
            : Utills.selectedThemeColors().PrimaryTextColor,
        },
        ,
        customStyle,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};

const MediumText = ({
  children,
  customStyle,
  isSecondaryColor,
  ...rest
}: CustomTextProps) => {
  return (
    <Text
      style={[
        styles.MediumText,
        {
          color: isSecondaryColor
            ? Utills.selectedThemeColors().SecondaryTextColor
            : Utills.selectedThemeColors().PrimaryTextColor,
        },
        ,
        customStyle,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};

const RegularText = ({
  children,
  customStyle,
  isSecondaryColor,
  ...rest
}: CustomTextProps) => {
  return (
    <Text
      style={[
        styles.RegularText,
        {
          color: isSecondaryColor
            ? Utills.selectedThemeColors().SecondaryTextColor
            : Utills.selectedThemeColors().PrimaryTextColor,
        },
        ,
        customStyle,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};
const SmallText = ({
  children,
  customStyle,
  isSecondaryColor,
  ...rest
}: CustomTextProps) => {
  return (
    <Text
      style={[
        styles.SmallText,
        {
          color: isSecondaryColor
            ? Utills.selectedThemeColors().SecondaryTextColor
            : Utills.selectedThemeColors().PrimaryTextColor,
        },
        ,
        customStyle,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};
const ExtraSmallText = ({
  children,
  customStyle,
  isSecondaryColor,
  ...rest
}: CustomTextProps) => {
  return (
    <Text
      style={[
        styles.ExtraSmallText,
        {
          color: isSecondaryColor
            ? Utills.selectedThemeColors().SecondaryTextColor
            : Utills.selectedThemeColors().PrimaryTextColor,
        },
        ,
        customStyle,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};

export default {
  ExtraLargeBoldText,
  LargeBoldText,
  LargeSemiBoldText,
  MediumText,
  RegularText,
  SmallText,
  ExtraSmallText,
};

const styles = StyleSheet.create({
  ExtraLargeBoldText: {
    fontFamily: Fonts['Bold'],
    fontSize: FontType.FontExtraLarge,
    textAlign: I18nManager.forceRTL ? 'left' : 'right',
  },
  LargeBoldText: {
    // textAlign: I18nManager.forceRTL ? "left" : "right",
    fontFamily: Fonts['Bold'],
    textAlign: I18nManager.forceRTL ? 'left' : 'right',
    fontSize: FontType.FontLarge,
  },
  LargeSemiBoldText: {
    fontFamily: Fonts['Semi-Bold'],
    fontSize: FontType.FontLarge,
    textAlign: I18nManager.forceRTL ? 'left' : 'right',
  },
  MediumText: {
    fontFamily: Fonts['Medium'],
    fontSize: FontType.FontMedium,
    textAlign: I18nManager.forceRTL ? 'left' : 'right',
  },
  RegularText: {
    fontFamily: Fonts['Regular'],
    fontSize: FontType.FontRegular,
    textAlign: I18nManager.forceRTL ? 'left' : 'right',
  },
  SmallText: {
    fontFamily: Fonts['Regular'],
    fontSize: FontType.FontSmall,
    textAlign: I18nManager.forceRTL ? 'left' : 'right',
  },
  ExtraSmallText: {
    fontFamily: Fonts['Regular'],
    fontSize: FontType.FontExtraSmall,
    textAlign: I18nManager.forceRTL ? 'left' : 'right',
  },
});
