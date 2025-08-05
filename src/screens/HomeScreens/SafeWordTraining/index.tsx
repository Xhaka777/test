import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, StatusBar } from 'react-native';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VolumeManager } from 'react-native-volume-manager';
import { Images, Metrix, NavigationService, Utills } from '../../../config';
import { CustomText, MainContainer, PrimaryButton, VolumeAnimatedIcon } from '../../../components';
import { normalizeFont } from '../../../config/metrix';
import { SafeWordTrainingProps } from '../../propTypes';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import navigationService from '../../../config/navigationService';
import SystemSetting from 'react-native-system-setting';


const TRAINING_STEPS = [
    {
        id: 1,
        title: 'Say',
        phrase: '"What\'s the weather today?"',
        subtitle: 'to train your voice',
        type: 'training'
    },
    {
        id: 2,
        title: 'Say',
        phrase: '"How are you doing?"',
        subtitle: '',
        type: 'training'
    },
    {
        id: 3,
        title: 'Say',
        phrase: '"What time is it?"',
        subtitle: '',
        type: 'training'
    },
    {
        id: 4,
        title: 'And finally, say',
        phrase: 'your safe word',
        subtitle: 'Choose something easy to remember',
        type: 'safeword'
    }
];

const SafeWordTraining: React.FC<SafeWordTrainingProps> = ({ route, navigation }) => {
    const { isUpdate = false } = route?.params || {};
    const [currentStep, setCurrentStep] = useState(1);
    const [isComplete, setIsComplete] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceResult, setVoiceResult] = useState('');
    const [safeWord, setSafeWord] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);    

    const [volume, setVolume] = useState(0);

    useEffect(() => {
        // Get initial system volume
        SystemSetting.getVolume().then(currentVolume => {
          setVolume(currentVolume);
        });
    
        // Subscribe to volume change events
        const listener = SystemSetting.addVolumeListener(({ value }) => {
          setVolume(value);
        });
    
        return () => {
          SystemSetting.removeVolumeListener(listener);
        };
      }, []);
    
    // Simple device volume state
    const [deviceVolume, setDeviceVolume] = useState(0.5);

    useEffect(() => {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        // Simple: Just get the volume once when component loads
        getDeviceVolume();

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    // Simple function to get device volume
    const getDeviceVolume = async () => {
        try {
            const volume = await VolumeManager.getVolume();
            console.log('volume:', volume)
            const volumeValue = volume?.volume || volume || 0.5;
            setDeviceVolume(volumeValue);
            console.log('Device volume:', Math.round(volumeValue * 100) + '%');
        } catch (error) {
            console.log('Could not get volume, using default 50%');
            setDeviceVolume(0.5);
        }
    };

    const onSpeechStart = () => {
        setIsListening(true);
    };

    const onSpeechEnd = () => {
        setIsListening(false);
    };

    const onSpeechResults = (event) => {
        const result = event.value[0];
        setVoiceResult(result);

        if (currentStep === 4) {
            // Safe word capture
            setSafeWord(result);
        }

        // Auto advance after a delay
        setTimeout(() => {
            handleNext();
        }, 1500);
    };

    const onSpeechError = (event) => {
        console.error('Speech error:', event);
        setIsListening(false);
    };

    const startListening = async () => {
        try {
            await Voice.start('en-US');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
        }
    };

    const handleNext = () => {
        if (currentStep < TRAINING_STEPS.length) {
            setCurrentStep(currentStep + 1);
            setVoiceResult('');
        } else {
            if (currentStep === 4 && safeWord) {
                saveSafeWord();
            } else {
                setIsComplete(true);
            }
        }
    };

    const handleCancel = () => {
        navigationService.goBack();
    };

    const saveSafeWord = async () => {
        setIsProcessing(true);
        try {
            await AsyncStorage.setItem('SAFE_WORD_KEY', safeWord.toLowerCase());
            setIsComplete(true);
        } catch (error) {
            console.error('Error saving safe word:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleComplete = () => {
        navigationService.goBack();
    };

    const currentTrainingStep = TRAINING_STEPS[currentStep - 1];

    if (isComplete) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />

                <View style={styles.header}>
                    <TouchableOpacity onPress={handleComplete}>
                        <Text style={styles.cancelButton}>Done</Text>
                    </TouchableOpacity>
                </View>

                <Animated.View
                    entering={FadeInUp.duration(600)}
                    style={styles.completionContainer}
                >
                    <View style={styles.completionIconContainer}>
                        <LinearGradient
                            colors={['#FF6B35', '#4CAF50', '#2196F3', '#9C27B0', '#FFC107']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.completionIcon}
                        >
                            <View style={styles.completionIconInner} />
                        </LinearGradient>
                    </View>

                    <Text style={styles.completionTitle}>Safe Word Is Ready</Text>

                    <Text style={styles.completionSubtitle}>
                        Your emergency safe word "{safeWord}" has been set.
                    </Text>

                    <Text style={styles.completionDescription}>
                        Say this word to activate Rove emergency mode, even when your phone is locked.
                    </Text>
                </Animated.View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleComplete}
                >
                    <Text style={styles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.stepIndicator}>
                    {currentStep} of {TRAINING_STEPS.length}
                </Text>
                <View style={{ width: 60 }} />
            </View>

            <Animated.View
                key={currentStep}
                entering={FadeInUp.duration(500)}
                exiting={FadeOutUp.duration(300)}
                style={styles.content}
            >
                <View style={styles.orbContainer}>
                    <VolumeAnimatedIcon
                        baseSize={100}
                        maxSize={150}
                        volume={deviceVolume}
                    />
                    
                    {/* Show current device volume */}
                    {__DEV__ && (
                        <Text style={styles.debugText}>
                            Volume: {Math.round(deviceVolume * 100)}%
                            <Text>System Volume: {volume.toFixed(2)}</Text>
                        </Text>
                    )}
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.stepTitle}>{currentTrainingStep.title}</Text>

                    <Text style={styles.phrase}>{currentTrainingStep.phrase}</Text>

                    {currentTrainingStep.subtitle && (
                        <Text style={styles.subtitle}>{currentTrainingStep.subtitle}</Text>
                    )}

                    {voiceResult && (
                        <Animated.View entering={FadeInUp.duration(300)} style={styles.resultContainer}>
                            <Text style={styles.resultText}>"{voiceResult}"</Text>
                            <Text style={styles.resultLabel}>
                                {currentStep === 4 ? 'Safe word captured!' : 'Great!'}
                            </Text>
                        </Animated.View>
                    )}
                </View>
            </Animated.View>

            <TouchableOpacity
                style={[styles.primaryButton, isListening && styles.primaryButtonListening]}
                onPress={isListening ? null : (currentStep === 4 && !voiceResult ? startListening : handleNext)}
                disabled={isProcessing}
            >
                <Text style={styles.primaryButtonText}>
                    {isListening ? 'Listening...' :
                        currentStep === 4 && !voiceResult ? 'Tap to speak' :
                            isProcessing ? 'Saving...' : 'Continue'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cancelButton: {
        fontSize: 17,
        color: '#6b6b6b',
        fontWeight: '400',
    },
    stepIndicator: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    orbContainer: {
        marginBottom: 60,
        alignItems: 'center',
    },
    debugText: {
        color: '#666',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 30,
        textAlign: 'center',
    },
    phrase: {
        fontSize: 32,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '400',
        color: '#CCCCCC',
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 10,
    },
    resultContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    resultText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#4CAF50',
        textAlign: 'center',
        marginBottom: 8,
    },
    resultLabel: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#6b6b6b',
        marginHorizontal: 20,
        marginBottom: 40,
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonListening: {
        backgroundColor: '#4CAF50',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    completionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    completionIconContainer: {
        marginBottom: 40,
    },
    completionIcon: {
        width: 120,
        height: 120,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completionIconInner: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        opacity: 0.8,
    },
    completionTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 30,
        textAlign: 'center',
    },
    completionSubtitle: {
        fontSize: 17,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    completionDescription: {
        fontSize: 17,
        color: '#CCCCCC',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
});

export default SafeWordTraining;