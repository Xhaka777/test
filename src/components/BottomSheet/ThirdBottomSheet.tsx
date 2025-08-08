import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Image, TextInput, Platform, Keyboard, Alert } from 'react-native';
import BottomSheet, { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Camera, Mic, Plus, Send, X, Square } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import _ from 'lodash';
import Voice from '@react-native-voice/voice';
import { useDispatch } from 'react-redux';
import { HomeActions } from '../../redux/actions';
import { Images } from '../../config';

interface ThirdBottomSheetProps {
  onComplete: (additionalDetails: string, image?: string) => void;
  onChange: (index: number) => void;
  selectedThreat?: { id: number, icon: any, label: string } | null;
  onThreatConfirmed?: (threatData: { id: number, icon: any, label: string }) => void;
}

interface Message {
  id: string;
  text: string;
  image?: string;
  timestamp: string;
  isBot: boolean;
  type?: 'info' | 'bot' | 'user';
}

const ThirdBottomSheet = forwardRef<BottomSheet, ThirdBottomSheetProps>(
  ({ onComplete, onChange, selectedThreat, onThreatConfirmed }, ref) => {
    const dispatch = useDispatch();
    const snapPoints = useMemo(() => ['50%'], []);

    const scrollViewRef = useRef<ScrollView>(null);
    const textInputRef = useRef<TextInput>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [hideTextInput, setHideTextInput] = useState(false);

    // Voice recognition states
    const [isRecording, setIsRecording] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [textBeforeVoice, setTextBeforeVoice] = useState(''); // Store text that was there before voice started

    useEffect(() => {
      // Add initial bot message when component mounts
      const initialMessage: Message = {
        id: '1',
        text: 'Your community update is anonymous. Only moderators can view it.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: true,
        type: 'info'
      };
      setMessages([initialMessage]);
    }, []);

    // Clean up voice when component unmounts
    useEffect(() => {
      return () => {
        if (isRecording) {
          Voice.stop().catch(console.error);
        }
      };
    }, [isRecording]);

    const handleSheetChange = useCallback((index: number) => {
      const isOpen = index !== -1;
      setIsSheetOpen(isOpen);

      if (isOpen) {
        // Sheet opened - pause safe word detection
        dispatch(HomeActions.setSafeWord({ isSafeWord: false, safeWord: 'Activate' }));
      } else {
        // Sheet closed - resume safe word detection and stop any voice recording
        dispatch(HomeActions.setSafeWord({ isSafeWord: true, safeWord: 'Activate' }));
        if (isRecording) {
          Voice.stop().catch(console.error);
          setIsRecording(false);
        }
      }

      onChange(index);
    }, [dispatch, onChange, isRecording]);

    const startVoiceRecognition = async () => {
      if (isRecording) {
        // Stop recording and finalize the voice session
        try {
          await Voice.stop();
          setIsRecording(false);
          // Don't clear textBeforeVoice here - let it stay for future voice sessions
        } catch (error) {
          console.error('Error stopping voice:', error);
        }
        return;
      }

      // Start recording - save the current text as "before voice"
      setTextBeforeVoice(inputText);

      // Start recording using the same pattern as TabStack
      try {
        // Clear any previous listeners and setup new ones like TabStack
        Voice.removeAllListeners();

        Voice.onSpeechStart = (e) => {
          console.log('onSpeechStart: ', e);
          setIsRecording(true);
        };

        Voice.onSpeechRecognized = (e) => {
          console.log('onSpeechRecognized: ', e);
        };

        Voice.onSpeechEnd = (e) => {
          console.log('onSpeechEnd: ', e);
          // Don't stop recording here - let it continue like TabStack
          if (isRecording) {
            // Restart listening to continue capturing speech like TabStack does
            setTimeout(() => {
              if (isRecording) {
                Voice.start('en-US').catch(console.error);
              }
            }, 100);
          }
        };

        Voice.onSpeechResults = (e) => {
          console.log('onSpeechResults: ', e);
          if (e.value && e.value.length > 0) {
            const latestResult = e.value[0];
            console.log('Latest speech result:', latestResult);

            // Simply combine the text before voice + latest speech result
            const newText = textBeforeVoice + (textBeforeVoice ? ' ' : '') + latestResult;
            console.log('Updated input text:', newText);
            setInputText(newText);
          }
        };

        Voice.onSpeechPartialResults = (e) => {
          console.log('onSpeechPartialResults: ', e);
          // Handle partial results for real-time feedback like TabStack
          if (e.value && e.value.length > 0) {
            const partialText = e.value[0];
            console.log('Partial result:', partialText);
          }
        };

        Voice.onSpeechError = (e) => {
          console.log('onSpeechError: ', e);

          // Only show error for actual errors, not normal operation
          if (e.error &&
            !e.error.message?.includes('No speech input') &&
            !e.error.message?.includes('Client side error') &&
            !e.error.message?.includes('7/No match')) {
            console.error('Actual speech error:', e.error);
            Alert.alert('Voice Error', 'Could not recognize speech. Please try again.');
            setIsRecording(false);
          }
        };

        Voice.onSpeechVolumeChanged = (e) => {
          console.log('onSpeechVolumeChanged: ', e);
        };

        await Voice.start('en-US');
        console.log('Voice recognition started successfully');

      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsRecording(false);
        Alert.alert('Voice Error', 'Could not start voice recognition. Please check microphone permissions.');
      }
    };

    const handleClose = useCallback(() => {
      Keyboard.dismiss();
      setMessages([]);
      setInputText('');
      setSelectedImage(null);
      setHideTextInput(false);

      // Stop voice and clean up
      if (isRecording) {
        Voice.stop().catch(console.error);
        setIsRecording(false);
        setTextBeforeVoice(''); // Clear saved text
      }

      onComplete('');
    }, [onComplete, isRecording]);

    const imagePicker = async () => {
      try {
        const image = await ImagePicker?.openPicker({
          mediaType: 'photo',
          cropping: true,
        });
        if (_.isEmpty(image?.path)) {
          Alert.alert('Error', 'Upload image field required.');
          return;
        } else {
          console.log('Selected image path:', image?.path);
          setSelectedImage(image?.path);
        }
      } catch (error: any) {
        if (error.message !== 'User cancelled image selection') {
          console.error('Error upload image', error);
          Alert.alert('Error', 'Failed to select image. Please try again.');
        }
      }
    };

    const removeSelectedImage = () => {
      setSelectedImage(null);
    };

    const sendMessage = () => {
      if (!inputText.trim() && !selectedImage) return;

      if (inputText.trim().length > 0 && inputText.trim().length < 100) {
        Alert.alert(
          'Message too short',
          'You need 100 characters minimum to send a message.',
          [{ text: 'OK' }],
          { cancelable: true }
        );
        return;
      }

      if ((inputText.trim().length >= 100) || (selectedImage && inputText.trim().length === 0)) {
        Keyboard.dismiss();
        textInputRef.current?.blur();

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMessage: Message = {
          id: Date.now().toString(),
          text: inputText,
          image: selectedImage || undefined,
          timestamp,
          isBot: false,
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        setSelectedImage(null);

        setTimeout(() => {
          const botReply: Message = {
            id: (Date.now() + 1).toString(),
            text: 'Most people keep their heads down. You gave a heads up. Your alert will be shared with the community and can be seen on the Safe Zones map. Nice one. 🙌',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isBot: true,
          };
          setMessages(prev => [...prev, botReply]);

          if (selectedThreat && onThreatConfirmed) {
            setTimeout(() => {
              onThreatConfirmed(selectedThreat);
            }, 500);
          }

          setHideTextInput(true);

          setTimeout(() => {
            onComplete(inputText, selectedImage || undefined);
          }, 2000);
        }, 1000);
      }
    };

    const renderMessage = (message: Message) => {
      if (message.type === 'info') {
        return (
          <View key={message.id} style={styles.infoMessageContainer}>
            <Text style={styles.infoMessageText}>{message.text}</Text>
          </View>
        );
      }

      const isBot = message.isBot;

      return (
        <View
          key={message.id}
          style={[
            styles.messageContainer,
            isBot ? styles.botMessageContainer : styles.userMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isBot ? styles.botBubble : styles.userBubble,
            ]}
          >
            {message.image && (
              <Image source={{ uri: message.image }} style={styles.messageImage} />
            )}
            <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
              {message.text}
            </Text>
            <Text style={[styles.timestamp, isBot ? styles.botTimestamp : styles.userTimestamp]}>
              {message.timestamp}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose
        backgroundStyle={styles.chatBottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.chatContainer}>
          <View style={styles.chatGradient}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Short description</Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(renderMessage)}
            </ScrollView>

            {!hideTextInput && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
                style={styles.keyboardAvoidingView}
              >
                <View style={styles.inputContainer}>
                  {selectedImage && (
                    <View style={styles.selectedImageContainer}>
                      <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={removeSelectedImage}
                      >
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.inputActionButton}
                      onPress={imagePicker}
                    >
                      <Plus size={24} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.textInputContainer}>
                      <BottomSheetTextInput
                        ref={textInputRef}
                        style={styles.textInput}
                        placeholder="Type a message"
                        placeholderTextColor="#666"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline={true}
                        maxLength={500}
                        returnKeyType="send"
                        onSubmitEditing={sendMessage}
                        blurOnSubmit={false}
                      />
                      <Text style={[
                        styles.characterCounter,
                        inputText.length > 0 && inputText.length < 100 && { color: '#ff4444' },
                        inputText.length >= 100 && { color: '#4ade80' }
                      ]}>
                        {inputText.length}/100
                      </Text>
                    </View>

                    {/* Only show camera icon when not typing */}
                    {inputText.trim().length === 0 && (
                      <TouchableOpacity
                        style={styles.inputActionButton}
                        onPress={imagePicker}
                      >
                        <Camera size={24} color="#666" />
                      </TouchableOpacity>
                    )}

                    {/* Only show mic icon when not typing */}
                    {inputText.trim().length === 0 && (
                      <TouchableOpacity
                        style={[
                          styles.inputActionButton,
                          isRecording && styles.recordingButton
                        ]}
                        onPress={startVoiceRecognition}
                      >
                        {isRecording ? (
                          <Square size={20} color="#ff4444" fill="#ff4444" />
                        ) : (
                          <Mic size={24} color="#666" />
                        )}
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        ((inputText.trim().length >= 100) || (selectedImage && inputText.trim().length === 0)) && styles.sendButtonActive
                      ]}
                      onPress={sendMessage}
                    >
                      <Image
                        source={Images.SendMessage}
                        style={{ width: 16, height: 16 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

ThirdBottomSheet.displayName = 'ThirdBottomSheet';

const styles = StyleSheet.create({
  chatBottomSheetBackground: {
    backgroundColor: 'rgba(51, 51, 51, 0.82)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#ccc',
    width: 40,
    height: 4,
  },
  chatContainer: {
    flex: 1,
  },
  chatGradient: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatHeaderTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '500',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(60, 60, 60, 0.59)',
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-start',
  },
  botMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    paddingHorizontal: 16,
  },
  userBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 8,
  },
  botBubble: {
    backgroundColor: '#4ade80',
    borderBottomRightRadius: 8,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  infoMessageContainer: {
    alignSelf: 'center',
    backgroundColor: '#f5f2eb',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    maxWidth: '85%',
  },
  infoMessageText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  userText: {
    color: '#000',
  },
  botText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  userTimestamp: {
    color: '#666',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#000',
    opacity: 0.7,
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputActionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  recordingButton: {
    backgroundColor: '#ffebee',
    borderRadius: 20,
  },
    keyboardAvoidingView: {
    // Remove any extra spacing/padding
    margin: 0,
    padding: 0,
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',

    marginVertical: 0,
    paddingVertical: 0,
  },
  textInput: {
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Inter-Regular',
    paddingRight: 50,
    textAlignVertical: 'center',

    margin: 0,
    marginBottom: 0,
    marginTop: 0,
    includeFontPadding: false, 

  },
  characterCounter: {
    position: 'absolute',
    bottom: 10,
    right: 8,
    fontSize: 12,
    color: '#999',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#1dab61',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 33,
    width: 33,
  },
  sendButtonActive: {
    backgroundColor: '#4ade80',
  },
});

export default ThirdBottomSheet;