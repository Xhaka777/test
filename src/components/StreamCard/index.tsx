import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { Trash2, Download, Expand, ChevronDown, Mic, CheckCircle } from 'lucide-react-native';
import { CustomText } from '../';
import { Images, Metrix, Utills, NavigationService, RouteNames } from '../../config';
import { PasscodeInput, verifyStoredPasscode, getPasscodeFromStorage } from '../PasscodeInput/PasscodeInput';
import { FeedbackModal } from '../FeedbackModal/index';
import moment from 'moment';
import RNFS from 'react-native-fs';
import { createThumbnail } from 'react-native-create-thumbnail';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ContactImageDB from '../../config/utills/ContactImageDB';
import { useFocusEffect } from '@react-navigation/native';
import { HomeAPIS } from '../../services/home'; // Add this import
import { reverseGeocode, isCoordinateString, extractCoordinates } from '../../config/utills/geocoding'



interface StreamCardProps {
    incident: {
        id: string;
        type: 'audio' | 'video';
        streetName?: string;
        triggerType: string;
        dateTime: string;
        thumbnailUrl?: string;
        recipients: Array<{
            id: string;
            name: string;
            avatar?: string;
        }>;
        location: {
            latitude: number;
            longitude: number;
        };
    };
    onDelete: (id: string, isPasscodeCorrect: boolean) => void;
    onDownload: () => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({ incident, onDelete, onDownload }) => {
    const [isRecipientsExpanded, setIsRecipientsExpanded] = useState(false);
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [localThumbnail, setLocalThumbnail] = useState<string | null>(null);
    const [hasLocalVideo, setHasLocalVideo] = useState(false);

    // States for contacts data (like TrustedContacts)
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Enhanced recipients with contact images
    const [enhancedRecipients, setEnhancedRecipients] = useState(incident.recipients);

    const [resolvedStreetName, setResolvedStreetName] = useState<string | null>(null);
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);


    const shouldShowExpandButton = incident.recipients.length > 4;
    const visibleRecipients = isRecipientsExpanded
        ? enhancedRecipients // Use enhancedRecipients instead of incident.recipients
        : enhancedRecipients.slice(0, 4);

    const additionalCount = incident.recipients.length - 4;

    const wait = (timeout: any) => {
        return new Promise(resolve => setTimeout(resolve, timeout));
    };

    const onRefresh = () => {
        setRefreshing(true);
        wait(1000).then(() => {
            getContacts();
            setRefreshing(false);
        });
    };

    // Inside your StreamCard component
    const handleFeedbackSubmit = async (feedbackText: string) => {
        try {
            console.log('Submitting feedback for incident:', incident.id);

            // Create the body object
            const body = {
                incident_id: incident.id,
                feedback_text: feedbackText
            };

            // Call your existing sendFeedback function with the body
            const response = await HomeAPIS.sendFeedback(body);

            console.log('Feedback submitted successfully:', response);

        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    };


    const resolveStreetName = async () => {
        try {
            const streetName = incident.streetName;

            // Check if the street name looks like coordinates
            if (streetName && isCoordinateString(streetName)) {
                setIsResolvingAddress(true);

                // Try to extract coordinates from the string
                const coords = extractCoordinates(streetName);

                if (coords) {
                    console.log('Extracted coordinates:', coords);
                    const address = await reverseGeocode(coords.lat, coords.lng);
                    setResolvedStreetName(address);
                } else {
                    // Fallback: use incident location if available
                    if (incident.location && incident.location.latitude && incident.location.longitude) {
                        const address = await reverseGeocode(
                            incident.location.latitude,
                            incident.location.longitude
                        );
                        setResolvedStreetName(address);
                    } else {
                        setResolvedStreetName('Unknown Location');
                    }
                }

                setIsResolvingAddress(false);
            } else {
                // Street name is already good, use as is
                setResolvedStreetName(streetName || `Incident #${incident.id}`);
            }
        } catch (error) {
            console.error('Error resolving street name:', error);
            setResolvedStreetName(incident.streetName || `Incident #${incident.id}`);
            setIsResolvingAddress(false);
        }
    };

    // NEW EFFECT: Resolve street name when component mounts or incident changes
    useEffect(() => {
        resolveStreetName();
    }, [incident.streetName, incident.location]);

    // Load contact images (same logic as TrustedContacts)
    const getContacts = async () => {
        try {
            if (incident.recipients.length === 0) return;

            // Get all recipient IDs
            const contactIds = incident.recipients.map(recipient => recipient.id.toString());

            // Get all images from database in one call
            const contactImages = await ContactImageDB.getMultipleContactImages(contactIds);

            // Process each recipient (same logic as TrustedContacts)
            const enhanced = incident.recipients.map((recipient) => {
                const contactId = recipient.id.toString();
                const dbImage = contactImages[contactId];

                return {
                    ...recipient,
                    // Priority: Database image -> API avatar -> null
                    avatar: dbImage || recipient.avatar,
                    abbreviate: recipient.name.charAt(0)?.toUpperCase(), // Add abbreviate like TrustedContacts
                };
            });

            setEnhancedRecipients(enhanced);
        } catch (err) {
            console.log('Error getting contact images:', err);
        }
    };

    // Load contact images when component mounts or when recipients change
    useEffect(() => {
        getContacts();
    }, [incident.recipients]);

    // Check for local video files and create thumbnails
    useEffect(() => {
        const getVideoFiles = async () => {
            try {
                const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);

                const videoFiles = files.filter(file =>
                    file.name.endsWith(`-${incident.id}-VIDEO.mp4`),
                );

                console.log('StreamCard video files for incident', incident.id, ':', videoFiles);

                if (videoFiles.length > 0) {
                    console.log('Local video(s) found for incident', incident.id);
                    setHasLocalVideo(true);

                    const thumbnailVideoPath = videoFiles[1]?.path || videoFiles[0]?.path;

                    createThumbnail({
                        url: thumbnailVideoPath,
                        timeStamp: 10000,
                    })
                        .then(response => {
                            console.log('Thumbnail created:', response?.path);
                            setLocalThumbnail(response?.path);
                        })
                        .catch(error => {
                            console.error('Error creating thumbnail:', error);
                        });
                } else {
                    console.log('No local video found for incident', incident.id);
                    setHasLocalVideo(false);
                }
            } catch (error) {
                console.error('Error fetching video files:', error);
            }
        };

        getVideoFiles();
    }, [incident.id]);

    const handleViewDetails = () => {
        NavigationService.navigate(RouteNames.HomeRoutes.FootageDetails, {
            id: incident.id,
        });
    };

    const saveVideoToCameraRoll = async (localFilePath: string) => {
        if (!localFilePath) {
            Alert.alert('Error', 'No file path provided.');
            return;
        }

        try {
            const fileExists = await RNFS.exists(localFilePath);
            if (!fileExists) {
                console.error('[Save Video] File does not exist at path:', localFilePath);
                Alert.alert('Error', 'Video file not found.');
                return;
            }

            let uri = localFilePath;
            if (Platform.OS === 'ios') {
                uri = localFilePath.startsWith('file://') ? localFilePath : `file://${localFilePath}`;
            }

            console.log('[Save Video] Attempting to save URI:', uri);

            const savedUri = await CameraRoll.save(uri, {
                type: 'video'
            });

            console.log('[Save Video] Successfully saved. URI:', savedUri);
            Alert.alert('Success', 'Video saved to your Photos!');

        } catch (error) {
            console.error('[Save Video] Detailed error:', error);

            if (error.message?.includes('Permission') || error.message?.includes('authorization')) {
                Alert.alert(
                    'Permission Required',
                    'Please go to Settings > Privacy & Security > Photos and allow "Add Photos Only" or "Full Access" for this app.'
                );
            } else {
                Alert.alert('Error', `Could not save the video: ${error.message}`);
            }
        }
    };

    const handleFullscreenPress = async () => {
        try {
            const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);

            const videoFiles = files.filter(file =>
                file.name.endsWith(`-${incident.id}-VIDEO.mp4`),
            );

            console.log('Found video files for incident', incident.id, ':', videoFiles);

            if (videoFiles.length > 0) {
                console.log('Opening fullscreen videos with stream:', videoFiles);
                NavigationService.navigate(RouteNames.HomeRoutes.Videos, {
                    videos: videoFiles,
                });
            } else {
                console.log('No local videos found, opening details');
                handleViewDetails();
            }
        } catch (error) {
            console.error('Error checking for local videos:', error);
            handleViewDetails();
        }
    };

    const handleDownloadPress = async () => {
        try {
            console.log('[Download] Starting download for incident:', incident.id);

            const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
            const videoFiles = files.filter(file =>
                file.name.endsWith(`-${incident.id}-VIDEO.mp4`)
            );

            if (videoFiles.length > 0) {
                const videoPath = videoFiles[0].path;
                console.log('[Download] Found video at:', videoPath);
                await saveVideoToCameraRoll(videoPath);
            } else {
                Alert.alert('Error', 'No local video found to download.');
            }
        } catch (error) {
            console.error('[Download] Error during download:', error);
            Alert.alert('Error', 'Could not find video to download.');
        }
    };

    const handleDeletePress = async () => {
        const storedPasscode = await getPasscodeFromStorage();
        if (!storedPasscode) {
            Alert.alert(
                'No Passcode Set',
                'Please set up a passcode in settings first to delete files securely.'
            );
            return;
        }
        setShowPasscodeModal(true);
    };

    const handlePasscodeComplete = async (enteredPasscode: string) => {
        try {
            console.log('Entered passcode:', enteredPasscode);

            const storedPasscode = await getPasscodeFromStorage();
            console.log('Stored passcode:', storedPasscode);

            const isValid = await verifyStoredPasscode(enteredPasscode);
            console.log('Passcode verification result:', isValid);

            setShowPasscodeModal(false);

            if (isValid) {
                console.log('Passcode correct - deleting file');
                onDelete(incident.id, true);
                setSuccessMessage('File was deleted');
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 3000);
            } else {
                console.log('Passcode incorrect - local delete only');
                setSuccessMessage('Local file was deleted');
                setShowSuccessModal(true);

                setTimeout(() => {
                    setShowSuccessModal(false);
                    onDelete(incident.id, false);
                }, 3000);
            }
        } catch (error) {
            console.error('Error verifying passcode:', error);
            setShowPasscodeModal(false);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    const renderMediaContent = () => {
        if (hasLocalVideo && localThumbnail) {
            return (
                <View style={styles.videoContainer}>
                    <Image
                        source={{ uri: localThumbnail }}
                        style={[styles.image, styles.videoFillContainer]}
                    />
                    <Image
                        source={Images.PlayBtn}
                        resizeMode="contain"
                        style={styles.playButton}
                    />
                </View>
            );
        } else if (incident.type === 'video' && incident.thumbnailUrl) {
            return (
                <View style={styles.videoContainer}>
                    <Image
                        source={{ uri: incident.thumbnailUrl }}
                        style={styles.image}
                        defaultSource={Images.Audio}
                    />
                    <Image
                        source={Images.PlayBtn}
                        resizeMode="contain"
                        style={styles.playButton}
                    />
                </View>
            );
        } else {
            return (
                <View style={styles.audioContainer}>
                    <View style={styles.audioIconContainer}>
                        <Image
                            source={Images.Audio}
                            resizeMode="contain"
                            style={{
                                width: Metrix.HorizontalSize(85),
                                height: Metrix.VerticalSize(100),
                            }}
                        />
                    </View>
                </View>
            );
        }
    };

    const displayStreetName = resolvedStreetName || incident.streetName || `Incident #${incident.id}`;

    const renderSuccessModal = () => (
        <Modal
            visible={showSuccessModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowSuccessModal(false)}
        >
            <View style={styles.successModalOverlay}>
                <View style={styles.successModalContent}>
                    <Image
                        source={Images.Checked}
                        resizeMode="contain"
                        style={{
                            width: Metrix.HorizontalSize(35),
                            height: Metrix.VerticalSize(35),
                            marginBottom: Metrix.VerticalSize(10),
                        }}
                    />
                    <CustomText.ExtraLargeBoldText customStyle={styles.successText}>
                        Success!
                    </CustomText.ExtraLargeBoldText>
                    <CustomText.LargeSemiBoldText customStyle={styles.successText}>
                        {successMessage}
                    </CustomText.LargeSemiBoldText>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <CustomText.LargeSemiBoldText customStyle={styles.streetName}>
                        {displayStreetName}
                    </CustomText.LargeSemiBoldText>
                    <CustomText.RegularText customStyle={styles.triggerType}>
                        {incident.triggerType}
                    </CustomText.RegularText>
                </View>
                <TouchableOpacity
                    style={styles.feedbackButton}
                    onPress={() => setShowFeedbackModal(true)}
                >
                    <CustomText.SmallText customStyle={styles.feedbackButtonText}>
                        Give feedback
                    </CustomText.SmallText>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.imageContainer} onPress={handleViewDetails}>
                {renderMediaContent()}
                <View style={styles.imageOverlay}>
                    <CustomText.SmallText customStyle={styles.dateTime}>
                        {moment(incident.dateTime).format('DD.MM.YYYY - HH:mm:ss')}
                    </CustomText.SmallText>
                </View>
                <View style={styles.imageActions}>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeletePress}
                    >
                        <Image
                            source={Images.RedDelete}
                            resizeMode="contain"
                            style={{
                                width: Metrix.HorizontalSize(22),
                                height: Metrix.VerticalSize(22),
                            }}
                        />
                    </TouchableOpacity>
                    <View style={styles.rightActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={async () => handleDownloadPress()}
                        >
                            <Image
                                source={Images.Download}
                                resizeMode="contain"
                                style={{
                                    width: Metrix.HorizontalSize(22),
                                    height: Metrix.VerticalSize(22),
                                }}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleFullscreenPress}>
                            <Image
                                source={Images.Fullscreen}
                                resizeMode="contain"
                                style={{
                                    width: Metrix.HorizontalSize(22),
                                    height: Metrix.VerticalSize(22),
                                }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Recipients Section - EXACT same logic as TrustedContacts */}
            {enhancedRecipients.length > 0 && (
                <View style={styles.recipientsSection}>
                    <CustomText.MediumText customStyle={styles.recipientsTitle}>
                        Recipients
                    </CustomText.MediumText>
                    <View style={styles.recipientsContainer}>
                        <View style={styles.recipientsList}>
                            {visibleRecipients.map((recipient) => (
                                <View key={recipient.id} style={styles.recipientItem}>
                                    {/* EXACT same logic as TrustedContacts */}
                                    {recipient.avatar ? (
                                        <Image
                                            source={{ uri: recipient.avatar }}
                                            style={styles.recipientAvatar}
                                        />
                                    ) : (
                                        <View style={[styles.recipientAvatar, styles.defaultAvatar]}>
                                            <CustomText.SmallText customStyle={styles.avatarText}>
                                                {recipient?.abbreviate?.toUpperCase()}
                                            </CustomText.SmallText>
                                        </View>
                                    )}
                                </View>
                            ))}
                            {shouldShowExpandButton && !isRecipientsExpanded && additionalCount > 0 && (
                                <View style={styles.moreIndicator}>
                                    <CustomText.SmallText customStyle={styles.moreText}>
                                        +{additionalCount} more
                                    </CustomText.SmallText>
                                </View>
                            )}
                        </View>
                        {shouldShowExpandButton && (
                            <TouchableOpacity
                                style={styles.expandButton}
                                onPress={() => setIsRecipientsExpanded(!isRecipientsExpanded)}
                            >
                                <ChevronDown
                                    size={20}
                                    color="#ffffff"
                                    style={[
                                        styles.chevron,
                                        isRecipientsExpanded && styles.chevronRotated
                                    ]}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            <View style={{ width: '100%', height: 1, backgroundColor: '#5f626b' }} />

            {/* Passcode Input Modal */}
            <Modal
                visible={showPasscodeModal}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowPasscodeModal(false)}
            >
                <PasscodeInput
                    title="Enter passcode to delete"
                    onPasscodeComplete={handlePasscodeComplete}
                    onBack={() => setShowPasscodeModal(false)}
                    isVerificationMode={true}
                />
            </Modal>

            {/* Success Modal */}
            {renderSuccessModal()}

            {/* Feedback Modal */}
            <FeedbackModal
                visible={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                incidentId={incident.id}
                onSubmit={handleFeedbackSubmit}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Utills.selectedThemeColors().Base,
        borderRadius: Metrix.HorizontalSize(16),
        marginBottom: Metrix.VerticalSize(24),
        // borderWidth: 1,
        // borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: Metrix.VerticalSize(16),
    },
    headerInfo: {
        flex: 1,
    },
    streetName: {
        fontSize: Metrix.customFontSize(20),
        fontWeight: '600',
        color: Utills.selectedThemeColors().PrimaryTextColor,
        marginBottom: Metrix.VerticalSize(4),
    },
    triggerType: {
        fontSize: Metrix.customFontSize(16),
        color: Utills.selectedThemeColors().SecondaryTextColor,
    },
    feedbackButton: {
        backgroundColor: '#5f626b',
        paddingHorizontal: Metrix.HorizontalSize(16),
        paddingVertical: Metrix.VerticalSize(8),
        borderRadius: Metrix.HorizontalSize(4),
        marginLeft: Metrix.HorizontalSize(16),
    },
    feedbackButtonText: {
        color: Utills.selectedThemeColors().PrimaryTextColor,
        fontSize: Metrix.customFontSize(14),
        fontWeight: '500',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: Metrix.VerticalSize(10),
        borderRadius: Metrix.HorizontalSize(12),
        overflow: 'hidden',
        height: Metrix.VerticalSize(200),
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#333333',
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoFillContainer: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    playButton: {
        width: Metrix.HorizontalSize(60),
        height: Metrix.HorizontalSize(60),
        position: 'absolute',
        zIndex: 10,
        tintColor: Utills.selectedThemeColors().PrimaryTextColor,
    },
    audioContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
         borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',

    },
    audioIconContainer: {
        width: Metrix.HorizontalSize(80),
        height: Metrix.VerticalSize(80),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Metrix.VerticalSize(12),
    },
    audioLabel: {
        color: Utills.selectedThemeColors().PrimaryTextColor,
        fontSize: Metrix.customFontSize(16),
        fontWeight: '500',
    },
    imageOverlay: {
        position: 'absolute',
        top: Metrix.VerticalSize(16),
        left: Metrix.HorizontalSize(16),
        backgroundColor: '#232323',
        paddingHorizontal: Metrix.HorizontalSize(12),
        paddingVertical: Metrix.VerticalSize(6),
        borderRadius: Metrix.HorizontalSize(6),
    },
    dateTime: {
        color: Utills.selectedThemeColors().PrimaryTextColor,
        fontSize: Metrix.customFontSize(14),
        fontWeight: '500',
    },
    imageActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: Metrix.HorizontalSize(10),
    },
    deleteButton: {
        width: Metrix.HorizontalSize(40),
        height: Metrix.VerticalSize(40),
        borderRadius: Metrix.HorizontalSize(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightActions: {
        flexDirection: 'row',
        gap: Metrix.HorizontalSize(12),
    },
    actionButton: {
        width: Metrix.HorizontalSize(40),
        height: Metrix.VerticalSize(40),
        borderRadius: Metrix.HorizontalSize(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipientsSection: {
        paddingBottom: Metrix.VerticalSize(20),
    },
    recipientsTitle: {
        fontSize: Metrix.customFontSize(17),
        fontWeight: '600',
        color: Utills.selectedThemeColors().PrimaryTextColor,
        marginBottom: Metrix.VerticalSize(12),
    },
    recipientsContainer: {
        backgroundColor: '#5f626b',
        borderRadius: Metrix.HorizontalSize(5),
        padding: Metrix.HorizontalSize(10),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recipientsList: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    recipientItem: {
        marginRight: Metrix.HorizontalSize(12),
    },
    recipientAvatar: {
        width: Metrix.HorizontalSize(40),
        height: Metrix.VerticalSize(40),
        borderRadius: Metrix.HorizontalSize(20),
        backgroundColor: '#555555',
    },
    defaultAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Utills.selectedThemeColors().PrimaryTextColor,
    },
    avatarText: {
        color: Utills.selectedThemeColors().Base,
        fontSize: Metrix.customFontSize(20),
        fontWeight: '600',
    },
    moreIndicator: {
        paddingHorizontal: Metrix.HorizontalSize(12),
        paddingVertical: Metrix.VerticalSize(8),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: Metrix.HorizontalSize(20),
        marginRight: Metrix.HorizontalSize(12),
    },
    moreText: {
        color: Utills.selectedThemeColors().PrimaryTextColor,
        fontSize: Metrix.customFontSize(14),
        fontWeight: '500',
    },
    expandButton: {
        padding: Metrix.HorizontalSize(8),
    },
    chevron: {
        transform: [{ rotate: '0deg' }],
    },
    chevronRotated: {
        transform: [{ rotate: '180deg' }],
    },
    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalContent: {
        backgroundColor: '#61636c',
        borderRadius: Metrix.HorizontalSize(16),
        padding: Metrix.HorizontalSize(40),
        alignItems: 'center',
        marginHorizontal: Metrix.HorizontalSize(40),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    successIcon: {
        marginBottom: Metrix.VerticalSize(20),
    },
    successText: {
        color: Utills.selectedThemeColors().PrimaryTextColor,
        fontSize: Metrix.customFontSize(18),
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: Metrix.VerticalSize(24),
    },
    streetNameContainer: {
        flexDirection: 'column',
    },
    resolvingText: {
        fontSize: 10,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 2,
    },
});