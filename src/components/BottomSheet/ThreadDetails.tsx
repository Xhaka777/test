import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GOOGLE_API_KEY } from '../../services/config';
import Geocoder from 'react-native-geocoding';
import { HomeAPIS } from '../../services/home';
import ImagePicker from 'react-native-image-crop-picker';
import { Plus } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

Geocoder.init(GOOGLE_API_KEY);

interface ImageItem {
  id: string;
  uri: string;
}

interface ThreatDetails {
  id: string;
  icon: any;
  label: string;
  streetName: string;
  image?: string;
  timestamp: string;
  description?: string;
  latitude: number;
  longitude: number;
}

interface ThreatDetailsBottomSheetProps {
  threatDetails: ThreatDetails | null;
  onClose: () => void;
  onChange: (index: number) => void;
  onConfirm?: (threatId: string) => void;
  onDeny?: (threatId: string) => void;
  onImageAdded?: (threatId: string, newImageUrl: string) => void;
  userCoordinates?: { latitude: number; longitude: number };
}

type ConfirmationStatus = 'unconfirmed' | 'confirmed' | 'denied' | 'loading';

const ThreatDetailsBottomSheet = forwardRef<BottomSheet, ThreatDetailsBottomSheetProps>(
  ({ threatDetails, onClose, onChange, onConfirm, onDeny, onImageAdded, userCoordinates }, ref) => {
    const snapPoints = useMemo(() => ['65%'], []); // Increased height to accommodate new elements
    const [streetName, setStreetName] = useState<string>('Loading address...');
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [confirmationStatus, setConfirmationStatus] = useState<ConfirmationStatus>('unconfirmed');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isLoadingVoteStatus, setIsLoadingVoteStatus] = useState(false);


    console.log('threatDetails', threatDetails);

    const getStreetName = useCallback(async (latitude: number, longitude: number) => {
      try {
        const response = await Geocoder.from(latitude, longitude);

        if (response.results && response.results.length > 0) {
          const result = response.results[0];

          // Try to get a more specific address
          const addressComponents = result.address_components;
          let streetNumber = '';
          let streetName = '';
          let neighborhood = '';
          let city = '';

          // Parse address components for better formatting
          addressComponents.forEach((component: any) => {
            const types = component.types;

            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              streetName = component.long_name;
            } else if (types.includes('neighborhood') || types.includes('sublocality')) {
              neighborhood = component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            }
          });

          // Build a formatted address
          let formattedAddress = '';
          if (streetNumber && streetName) {
            formattedAddress = `${streetNumber} ${streetName}`;
          } else if (streetName) {
            formattedAddress = streetName;
          } else if (neighborhood) {
            formattedAddress = neighborhood;
          } else if (city) {
            formattedAddress = city;
          } else {
            // Fallback to full formatted address
            formattedAddress = result.formatted_address;
          }

          return formattedAddress;
        } else {
          return 'Address not found';
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }, []);

    const fetchUserVoteStatus = useCallback(async (threatId: string) => {
      try {
        setIsLoadingVoteStatus(true);

        // Call the getThreatReports API
        const response = await HomeAPIS.getThreatReports();

        // Fix: Use response.data.results instead of response.data
        if (response.data && response.data.results && Array.isArray(response.data.results)) {
          const threatReport = response.data.results.find((report: any) => report.id === threatId);

          if (threatReport) {
            if (threatReport.user_vote === null) {
              setConfirmationStatus('unconfirmed');
            } else if (threatReport.user_vote === 'confirm') {
              setConfirmationStatus('confirmed');
            } else if (threatReport.user_vote === 'deny') {
              setConfirmationStatus('denied');
            } else {
              setConfirmationStatus('unconfirmed');
            }
          } else {
            setConfirmationStatus('unconfirmed');
          }
        }
      } catch (error) {
        console.error('Error fetching user vote status:', error);
        setConfirmationStatus('unconfirmed');
      } finally {
        setIsLoadingVoteStatus(false);
      }
    }, []);

    useEffect(() => {
      if (!threatDetails) return;

      setIsLoadingAddress(true);
      setStreetName('Loading address...');

      setConfirmationStatus('unconfirmed');
      fetchUserVoteStatus(threatDetails.id);

      // Initialize images array with existing threat image ONLY if it exists
      if (threatDetails.image) {
        setImages([{
          id: 'original',
          uri: threatDetails.image
        }]);
      } else {
        setImages([]); // Start with empty array if no original image
      }
      // Check if streetName is actually coordinates (contains comma and numbers)
      const isCoordinates = typeof threatDetails.streetName === 'string' &&
        threatDetails.streetName.includes(',') &&
        /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(threatDetails.streetName.replace(/\s/g, ''));

      if (isCoordinates || !threatDetails.streetName || threatDetails.streetName === 'Loading address...') {
        // Convert coordinates to address
        getStreetName(threatDetails.latitude, threatDetails.longitude)
          .then((address) => {
            setStreetName(address);
            setIsLoadingAddress(false);
          })
          .catch(() => {
            setStreetName(`${threatDetails.latitude.toFixed(4)}, ${threatDetails.longitude.toFixed(4)}`);
            setIsLoadingAddress(false);
          });
      } else {
        // Use the existing street name if it's valid
        setStreetName(threatDetails.streetName);
        setIsLoadingAddress(false);
      }
    }, [threatDetails, getStreetName, fetchUserVoteStatus]);

    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleAddImage = () => {
      if (!threatDetails) return;

      Alert.alert(
        'Add Image',
        'Add an additional image to this threat report',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Choose from Library', onPress: selectImageFromLibrary },
        ]
      );
    };

    const selectImageFromLibrary = () => {
      ImagePicker.openPicker({
        width: 1024,
        height: 1024,
        cropping: true,
        cropperChooseText: 'Choose',
        cropperCancelText: 'Cancel',
        mediaType: 'photo',
        compressImageQuality: 0.8,
      }).then(image => {
        if (image && image.path) {
          const newImage: ImageItem = {
            id: Date.now().toString(),
            uri: image.path,
          };

          // If no images exist, make this the first image
          // Otherwise, add it to the end
          if (images.length === 0) {
            setImages([newImage]);
          } else {
            setImages(prevImages => [...prevImages, newImage]);
          }

          uploadAdditionalImage(image.path);
        }
      }).catch(error => {
        if (error.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Error', 'Failed to pick image');
        }
      });
    };

    const removeImage = (imageId: string) => {
      if (imageId === 'original') {
        Alert.alert(
          'Cannot Remove',
          'Cannot remove the original threat image',
          [{ text: 'OK' }]
        );
        return;
      }

      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      // You might want to call an API to remove the image from server here
    };

    const uploadAdditionalImage = async (imageUri: string) => {
      if (!threatDetails) return;

      try {
        setIsUploadingImage(true);

        // Create FormData for the additional image
        const formData = new FormData();
        formData.append('photo', {
          uri: imageUri,
          type: 'image/jpeg',
          name: `additional_image_${Date.now()}.jpg`,
        } as any);

        // Call API to add image to existing threat report
        // const response = await HomeAPIS.updateThreatReport(threatDetails.id, formData);

        // console.log('Additional image uploaded successfully:', response);

        // Update the threat details with new image
        // if (response.data && response.data.photo) {
        //   onImageAdded?.(threatDetails.id, response.data.photo);
        // }

        Alert.alert(
          'Success',
          'Additional image has been added to the threat report.',
          [{ text: 'OK' }]
        );

      } catch (error) {
        console.error('Error uploading additional image:', error);

        // Remove the image from local state if upload failed
        setImages(prevImages => prevImages.filter(img => img.uri !== imageUri));

        Alert.alert(
          'Error',
          'Failed to upload additional image. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsUploadingImage(false);
      }
    };

    const renderImageLayout = () => {
      if (images.length === 0) {
        return (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>No image available</Text>
          </View>
        );
      }

      if (images.length === 1) {
        return (
          <View style={styles.singleImageContainer}>
            <Image source={{ uri: images[0].uri }} style={styles.singleImage} />
            {images[0].id !== 'original' && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(images[0].id)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }

      if (images.length === 2) {
        return (
          <View style={styles.twoImagesContainer}>
            <View style={styles.mainImageContainer}>
              <Image source={{ uri: images[0].uri }} style={styles.mainImage} />
              {images[0].id !== 'original' && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(images[0].id)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sideImageContainer}>
              <View style={styles.sideImageWrapper}>
                <Image source={{ uri: images[1].uri }} style={styles.sideImage} />
                {images[1].id !== 'original' && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(images[1].id)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      }

      // 3 or more images
      const mainImage = images[0];
      const sideImages = images.slice(1);

      return (
        <View style={styles.multipleImagesContainer}>
          <View style={styles.mainImageContainer}>
            <Image source={{ uri: mainImage.uri }} style={styles.mainImage} />
            {mainImage.id !== 'original' && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(mainImage.id)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sideImagesContainer}>
            {sideImages.slice(0, 2).map((image, index) => (
              <View key={image.id} style={styles.sideImageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.multipleSideImage} />
                {image.id !== 'original' && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(image.id)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                )}
                {sideImages.length > 2 && index === 1 && (
                  <View style={styles.moreImagesOverlay}>
                    <Text style={styles.moreImagesText}>+{sideImages.length - 2}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    };

    const handleConfirm = async () => {
      if (!threatDetails) return;

      try {
        setConfirmationStatus('loading');

        console.log('before the vote threat!')

        // Call the voting API with "confirm" vote
        const response = await HomeAPIS.voteThreatReport(threatDetails.id, { vote: "confirm" });

        console.log('Vote confirmed successfully:', response);

        setConfirmationStatus('confirmed');
        onConfirm?.(threatDetails.id);

        // Show success message
        Alert.alert(
          'Vote Submitted',
          'Thank you for confirming this threat report.',
          [{ text: 'OK' }]
        );

      } catch (error) {
        console.error('Error confirming threat:', error);
        setConfirmationStatus('unconfirmed'); // Reset to original state

        Alert.alert(
          'Error',
          'Failed to submit your vote. Please try again.',
          [{ text: 'OK' }]
        );
      }
    };

    const handleDeny = async () => {
      if (!threatDetails) return;

      try {
        setConfirmationStatus('loading');

        // Call the voting API with "deny" vote  
        const response = await HomeAPIS.voteThreatReport(threatDetails.id, { vote: "deny" });

        console.log('Vote denied successfully:', response);

        setConfirmationStatus('denied');
        onDeny?.(threatDetails.id);

        // Show success message
        Alert.alert(
          'Vote Submitted',
          'Thank you for your feedback on this threat report.',
          [{ text: 'OK' }]
        );

      } catch (error) {
        console.error('Error denying threat:', error);
        setConfirmationStatus('unconfirmed'); // Reset to original state

        Alert.alert(
          'Error',
          'Failed to submit your vote. Please try again.',
          [{ text: 'OK' }]
        );
      }
    };

    const getStatusLabel = () => {
      if (isLoadingVoteStatus) {
        return { text: 'Loading...', style: styles.loadingLabel }
      }

      switch (confirmationStatus) {
        case 'confirmed':
          return { text: 'Confirmed', style: styles.confirmedLabel };
        case 'denied':
          return { text: 'Denied', style: styles.deniedLabel };
        case 'loading':
          return { text: 'Voting...', style: styles.loadingLabel };
        default:
          return { text: 'Unconfirmed', style: styles.unconfirmedLabel };
      }
    };

    const getButtonText = (type: 'confirm' | 'deny') => {
      if (confirmationStatus === 'loading') {
        return type === 'confirm' ? 'Confirming...' : 'Denying...';
      }
      return type === 'confirm' ? '✓ Confirm' : '✗ Deny';
    };

    if (!threatDetails) return null;

    console.log('streetName', streetName);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={onChange}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.header}>
            {/* LEFT */}
            <View style={styles.headerLeft}>
              <Text style={styles.streetName}>
                {isLoadingAddress ? (
                  <Text style={styles.loadingText}>Loading address...</Text>
                ) : (
                  streetName
                )}
              </Text>
            </View>

            {/* CENTER */}
            <View style={styles.headerCenter}>
              <View style={styles.threatIconContainer}>
                <Image
                  source={threatDetails.icon}
                  style={styles.threatIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* RIGHT */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleAddImage}
                disabled={isUploadingImage}
              >
                {/* <Text style={styles.addImageButtonText}>
                  {isUploadingImage ? '...' : '+'}
                </Text> */}
                <Plus size={20} color='#fff' />
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Image Gallery */}
            <View style={styles.imageGallery}>
              {renderImageLayout()}
            </View>

            {/* Status Label */}
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusLabel, getStatusLabel().style]}>
                <Text style={styles.statusLabelText}>{getStatusLabel().text}</Text>
              </View>
            </View>

            {/* Date/Time */}
            <Text style={styles.dateTimeText}>
              {formatTimestamp(threatDetails.timestamp)}
            </Text>

            <View style={styles.line} />


            {/* Description */}
            {threatDetails.description && (
              <Text style={styles.descriptionText}>
                {threatDetails.description}
              </Text>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.confirmButton,
                  confirmationStatus === 'confirmed' && styles.activeConfirmButton
                ]}
                onPress={handleConfirm}
                disabled={confirmationStatus === 'confirmed' || confirmationStatus === 'denied' || confirmationStatus === 'loading' || isLoadingVoteStatus}
              >
                <Text style={[
                  styles.confirmButtonEmoji,
                  (confirmationStatus === 'confirmed' || confirmationStatus === 'loading') && styles.activeButtonEmoji
                ]}>
                  ✅
                </Text>
                <Text style={[
                  styles.confirmButtonText,
                  (confirmationStatus === 'confirmed' || confirmationStatus === 'loading') && styles.activeButtonText
                ]}>
                  Confirm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.denyButton,
                  confirmationStatus === 'denied' && styles.activeDenyButton
                ]}
                onPress={handleDeny}
                disabled={confirmationStatus === 'confirmed' || confirmationStatus === 'denied' || confirmationStatus === 'loading' || isLoadingVoteStatus}
              >
                <Text style={[
                  styles.denyButtonEmoji,
                  (confirmationStatus === 'denied' || confirmationStatus === 'loading') && styles.activeButtonEmoji
                ]}>
                  ❌
                </Text>
                <Text style={[
                  styles.denyButtonText,
                  (confirmationStatus === 'denied' || confirmationStatus === 'loading') && styles.activeButtonText
                ]}>
                  Deny
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

ThreatDetailsBottomSheet.displayName = 'ThreatDetailsBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  streetName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  threatIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  threatIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderWidth: 2,
    borderColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButtonText: {
    color: '#34C759',
    fontSize: 24,
    fontWeight: '600',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  imageGallery: {
    height: 200,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  singleImageContainer: {
    flex: 1,
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  twoImagesContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  mainImageContainer: {
    flex: 2,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  sideImageContainer: {
    flex: 1,
  },
  sideImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  sideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  multipleImagesContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  sideImagesContainer: {
    flex: 1,
    gap: 8,
  },
  multipleSideImage: {
    width: '100%',
    height: '48%',
    borderRadius: 10,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusLabelContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  noImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  noImageText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  statusLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  unconfirmedLabel: {
    backgroundColor: '#00d5fa',
  },
  confirmedLabel: {
    backgroundColor: '#34C759',
  },
  deniedLabel: {
    backgroundColor: '#FF3B30',
  },
  loadingLabel: {
    backgroundColor: '#FF9500',
  },
  statusLabelText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 25,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-start',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 0,
    gap: 15,
  },
  actionButton: {
    // flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    // paddingHorizontal: 1,
    borderRadius: 25,
    justifyContent: 'flex-start',
  },
  confirmButton: {
    // backgroundColor: '#34C759',
    borderWidth: 0,
  },
  activeConfirmButton: {
    // backgroundColor: '#34C759',
  },
  denyButton: {
    // backgroundColor: '#FF3B30',
    borderWidth: 0,
  },
  activeDenyButton: {
    // backgroundColor: '#FF3B30',
  },
  confirmButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
    marginRight: 4,
  },
  denyButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
    marginRight: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  denyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,

  },
  activeButtonEmoji: {
    // Emoji color stays the same when active
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  line: {
    width: '100%',
    height: 2,
    backgroundColor: '#666',
    marginBottom: 14
  },
});

export default ThreatDetailsBottomSheet;