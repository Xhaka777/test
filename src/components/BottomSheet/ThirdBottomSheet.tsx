import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Image, TextInput, Platform, Keyboard, Alert } from 'react-native';
import BottomSheet, { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Camera, Mic, Plus, Send, X } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker'; // Use the same library as EditProfile
import _ from 'lodash'; // Use the same library as EditProfile

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
    const snapPoints = useMemo(() => ['50%'], []);

    const scrollViewRef = useRef<ScrollView>(null);
    const textInputRef = useRef<TextInput>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [hideTextInput, setHideTextInput] = useState(false);

    useEffect(() => {
      // Add initial bot message when component mounts
      const initialMessage: Message = {
        id: '1',
        text: 'Your community update is anonymous. Only moderators can view it. False reports of serious events may be reviewed and escalated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: true,
        type: 'info'
      };
      setMessages([initialMessage]);
    }, []);

    // Dismiss keyboard when bottom sheet visibility changes
    useEffect(() => {
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        // Handle keyboard dismissal if needed
      });

      return () => {
        keyboardDidHideListener?.remove();
      };
    }, []);

    const handleClose = useCallback(() => {
      Keyboard.dismiss();
      setMessages([]);
      setInputText('');
      setSelectedImage(null);
      setHideTextInput(false);
      onComplete('');
    }, [onComplete]);

    // Use the exact same image picker function as EditProfile
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
          console.log('Selected image path:', image?.path); // Debug log
          setSelectedImage(image?.path);
        }
      } catch (error: any) {
        if (error.message !== 'User cancelled image selection') {
          console.error('Error upload image', error);
          Alert.alert('Error', 'Failed to select image. Please try again.');
        }
      }
    };

    // Remove selected image
    const removeSelectedImage = () => {
      setSelectedImage(null);
    };

    // 100 character minimum requirement with alert
    const sendMessage = () => {
      // Check if there's no content at all
      if (!inputText.trim() && !selectedImage) return;

      // Check if text is less than 100 characters (only check text, images can be sent without text)
      if (inputText.trim().length > 0 && inputText.trim().length < 100) {
        Alert.alert(
          'Message too short',
          'You need 100 characters minimum to send a message.',
          [{ text: 'OK' }],
          { cancelable: true }
        );
        return;
      }

      // Allow sending if: 
      // 1. Text is 100+ characters, OR
      // 2. Just an image with no text, OR  
      // 3. Text is 100+ characters AND an image
      if ((inputText.trim().length >= 100) || (selectedImage && inputText.trim().length === 0)) {
        // Dismiss keyboard and blur text input
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

        // Auto-reply from bot
        setTimeout(() => {
          const botReply: Message = {
            id: (Date.now() + 1).toString(),
            text: 'Most people keep their heads down. You gave a heads up. Your alert will be shared with the community and can be seen on the Safe Zones map. Nice one. 🙌',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isBot: true,
          };
          setMessages(prev => [...prev, botReply]);

          // Show threat on map after bot reply
          if (selectedThreat && onThreatConfirmed) {
            setTimeout(() => {
              onThreatConfirmed(selectedThreat);
            }, 500);
          }

          // Hide text input after this specific bot message
          setHideTextInput(true);

          // Complete the reporting process
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
        onChange={onChange}
        enablePanDownToClose
        backgroundStyle={styles.chatBottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.chatContainer}>
          <View style={styles.chatGradient}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Short description</Text>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(renderMessage)}
            </ScrollView>

            {/* Input Area */}
            {!hideTextInput && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                      onPress={() => {
                        console.log('Plus button pressed'); // Debug log
                        imagePicker(); // Use the same function as EditProfile
                      }}
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
                      {/* Character counter */}
                      <Text style={[
                        styles.characterCounter,
                        // Show red if text exists but less than 100 chars, green if 100+
                        inputText.length > 0 && inputText.length < 100 && { color: '#ff4444' },
                        inputText.length >= 100 && { color: '#4ade80' }
                      ]}>
                        {inputText.length}/100
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.inputActionButton}
                      onPress={() => {
                        console.log('Camera button pressed'); // Debug log
                        imagePicker(); // Use the same function as EditProfile
                      }}
                    >
                      <Camera size={24} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.inputActionButton}>
                      <Mic size={24} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        // Show active state if: 100+ chars OR (image with no text) OR (image with 100+ chars)
                        ((inputText.trim().length >= 100) || (selectedImage && inputText.trim().length === 0)) && styles.sendButtonActive
                      ]}
                      onPress={sendMessage}
                    >
                      <Send size={20} color="#fff" />
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
    backgroundColor: '#fff',
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
  textInputContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
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
    backgroundColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
  sendButtonActive: {
    backgroundColor: '#4ade80',
  },
});

export default ThirdBottomSheet;