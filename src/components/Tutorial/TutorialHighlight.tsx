import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Utills, Metrix } from '../../config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialHighlightProps {
    targetElement: string;
    highlightType?: 'circle' | 'rounded' | 'square';
    onPress?: () => void;
}

export const TutorialHighlight: React.FC<TutorialHighlightProps> = ({
    targetElement,
    highlightType = 'circle',
    onPress,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Pulse animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        pulseAnimation.start();

        return () => {
            pulseAnimation.stop();
        };
    }, []);

    const getHighlightStyle = () => {
        const baseStyle = {
            transform: [{ scale: pulseAnim }],
            opacity: fadeAnim,
        };

        switch (targetElement) {
            case 'settings-tab':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    bottom: Metrix.VerticalSize(20),
                    right: Metrix.HorizontalSize(20),
                    width: Metrix.HorizontalSize(60),
                    height: Metrix.VerticalSize(60),
                    borderRadius: Metrix.HorizontalSize(30),
                    backgroundColor: 'rgba(0, 122, 255, 0.3)',
                    borderWidth: 3,
                    borderColor: '#007AFF',
                };
            case 'responders-item':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: Metrix.VerticalSize(280), // Adjust based on your Settings screen layout
                    left: Metrix.HorizontalSize(20),
                    right: Metrix.HorizontalSize(20),
                    height: Metrix.VerticalSize(60),
                    borderRadius: Metrix.HorizontalSize(10),
                    backgroundColor: 'rgba(0, 122, 255, 0.3)',
                    borderWidth: 3,
                    borderColor: '#007AFF',
                };
            case 'add-contact-button':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: Metrix.VerticalSize(120), // Adjust based on your TrustedContacts screen layout
                    left: Metrix.HorizontalSize(20),
                    right: Metrix.HorizontalSize(20),
                    height: Metrix.VerticalSize(50),
                    borderRadius: Metrix.HorizontalSize(10),
                    backgroundColor: 'rgba(0, 122, 255, 0.3)',
                    borderWidth: 3,
                    borderColor: '#007AFF',
                };
            case 'livestream-button':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    bottom: Metrix.VerticalSize(150),
                    alignSelf: 'center',
                    left: (screenWidth - Metrix.HorizontalSize(80)) / 2,
                    width: Metrix.HorizontalSize(80),
                    height: Metrix.VerticalSize(80),
                    borderRadius: Metrix.HorizontalSize(40),
                    backgroundColor: 'rgba(0, 122, 255, 0.3)',
                    borderWidth: 3,
                    borderColor: '#007AFF',
                };
            default:
                return baseStyle;
        }
    };

    return (
        <View style={styles.highlightOverlay}>
            <TouchableOpacity
                style={[styles.highlightArea, getHighlightStyle()]}
                onPress={onPress}
                activeOpacity={0.8}
            />
        </View>
    );
};


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Metrix.HorizontalSize(20),
        zIndex: 1000,
    },
    tutorialContainer: {
        backgroundColor: Utills.selectedThemeColors().Base,
        borderRadius: Metrix.HorizontalSize(16),
        padding: Metrix.HorizontalSize(20),
        width: '100%',
        maxWidth: Metrix.HorizontalSize(340),
        ...Metrix.createShadow,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Metrix.VerticalSize(16),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    premiumIcon: {
        width: Metrix.HorizontalSize(24),
        height: Metrix.VerticalSize(24),
        tintColor: Utills.selectedThemeColors().TertiaryTextColor,
        marginRight: Metrix.HorizontalSize(8),
    },
    title: {
        color: Utills.selectedThemeColors().PrimaryTextColor,
        fontWeight: '700',
        flex: 1,
    },
    closeButton: {
        padding: Metrix.HorizontalSize(4),
    },
    closeIcon: {
        width: Metrix.HorizontalSize(20),
        height: Metrix.VerticalSize(20),
        tintColor: Utills.selectedThemeColors().SecondaryTextColor,
    },
    separator: {
        height: 1,
        backgroundColor: Utills.selectedThemeColors().TextInputBorderColor,
        marginBottom: Metrix.VerticalSize(20),
    },
    descriptionContainer: {
        marginBottom: Metrix.VerticalSize(24),
    },
    description: {
        color: Utills.selectedThemeColors().PrimaryTextColor,
        lineHeight: 22,
        textAlign: 'center',
    },
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Metrix.HorizontalSize(16),
    },
    progressContainer: {
        flex: 1,
    },
    progressBackground: {
        height: Metrix.VerticalSize(4),
        backgroundColor: Utills.selectedThemeColors().TextInputBorderColor,
        borderRadius: Metrix.HorizontalSize(2),
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: Metrix.HorizontalSize(2),
    },
    nextButton: {
        backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
        paddingVertical: Metrix.VerticalSize(12),
        paddingHorizontal: Metrix.HorizontalSize(24),
        borderRadius: Metrix.HorizontalSize(8),
    },
    nextText: {
        color: Utills.selectedThemeColors().Base,
        fontWeight: '600',
        fontSize: Metrix.customFontSize(16),
    },
    highlightOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    highlightArea: {
        // Dynamic styles applied in getHighlightStyle
    },
});
