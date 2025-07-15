import React from 'react';
import {
    View,
    StyleSheet,
    Image,
    StatusBar,
    ScrollView,
    Text,
    TouchableOpacity,
} from 'react-native';
import {
    CustomText,
    MainContainer,
    PrimaryButton,
} from '../../../components';
import {
    Images,
    Metrix,
    NavigationService,
    RouteNames,
    Utills,
} from '../../../config';
import { ReadBeforeUseProps } from '../../propTypes';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ReadBeforeUse: React.FC<ReadBeforeUseProps> = ({ }) => {
    const handleGotcha = () => {
        NavigationService.navigate(RouteNames.AuthRoutes.LoginScreen);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Image
                            source={Images.Premium}
                            style={styles.premiumIcon}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Read before use</Text>
                </View>

                <View style={styles.separator} />

                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.contentText}>
                        Rove relies on <Text style={styles.highlightText}>microphone access</Text> to detect and respond to critical events. If you open other apps that use the microphone (like livestreaming or video recording), listening will pause temporarily. It will automatically resume when those apps are closed or when your screen goes into standby mode.
                    </Text>

                    <Text style={styles.contentText}>
                        Our detection model is over 90% accurate, but no system can guarantee 100% recognition. Microphone conditions and environmental factors may affect performance. Rove is a powerful safety aid, but not a substitute for situational awareness.
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGotcha}
                    >
                        <Text style={styles.buttonText}>Gotcha!</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingHorizontal: 20,
        paddingTop: 40,
        justifyContent: 'center', // Add this to center the modal
    },
    modalContainer: {
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    separator: {
        height: 1,
        backgroundColor: '#48484A',
        marginBottom: 20,
    },
    scrollContainer: {
        flexGrow: 1, // Change from flex: 1 to flexGrow: 1
        // maxHeight: 400, // Add this to limit scroll container height
    },
    contentText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
        marginBottom: 16,
    },
    highlightText: {
        color: '#007AFF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 20,
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#48484A',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 10, // Add this for 10px space below button
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    premiumIcon: {
        width: Metrix.HorizontalSize(35),
        height: Metrix.VerticalSize(35),
        marginRight: Metrix.HorizontalSize(5),
        tintColor: Utills.selectedThemeColors().PrimaryTextColor,
    },
});