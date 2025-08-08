import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    Dimensions
} from 'react-native';
import { DayScheduleRow } from './DayScheduleRow';
import { Images, Metrix, Utills } from '../../config';

interface ScheduleTime {
    startTime: string;
    endTime: string;
    enabled: boolean;
}

interface WeekSchedule {
    [key: string]: ScheduleTime;
}

interface ProtectionScheduleModalProps {
    visible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export function ProtectionScheduleModal({ visible, onClose }: ProtectionScheduleModalProps) {
    const [schedule, setSchedule] = useState<WeekSchedule>({
        Mon: { startTime: '10:00 PM', endTime: '7:00 AM', enabled: true },
        Tue: { startTime: '10:00 PM', endTime: '7:00 AM', enabled: true },
        Wed: { startTime: '10:00 PM', endTime: '7:00 AM', enabled: true },
        Thu: { startTime: '10:00 PM', endTime: '7:00 AM', enabled: true },
        Fri: { startTime: '10:00 PM', endTime: '7:00 AM', enabled: true },
        Sat: { startTime: '10:00 PM', endTime: '7:00 AM', enabled: true },
        Sun: { startTime: '10:00 PM', endTime: '7:00 AM', enabled: true },
    });

    // Add internal visible state to handle animation properly
    const [internalVisible, setInternalVisible] = useState(visible);


    // Calculate responsive modal dimensions
    const modalWidth = Math.min(width * 0.9, 400); // Maximum 400px, 90% of screen width
    const modalPadding = width * 0.04; // 4% padding

    // Sync internal state with prop and handle closing animation
    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
        } else {
            // Add a small delay to let the closing animation complete
            const timer = setTimeout(() => {
                setInternalVisible(false);
            }, 300); // Adjust timing based on your modal animation duration
            
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const updateSchedule = (day: string, field: keyof ScheduleTime, value: string | boolean) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value,
            },
        }));
    };

    const handleSafeZones = () => {
        Alert.alert(
            'Safe Zones',
            'Configure locations where auto detection are inactive.',
            [{ text: 'OK' }]
        );
    };

    const handleClose = () => {
        // Set visible to false immediately to start closing animation
        onClose();
    };

    // Don't render the modal at all if it's not supposed to be visible
    if (!internalVisible) {
        return null;
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { width: modalWidth }]}>
                    <View style={[styles.header]}>
                        <View style={styles.titleContainer}>
                            <Image 
                                source={Images.Premium} 
                                style={[styles.premiumIcon, {
                                }]}
                            />
                            <Text style={styles.title}>Protection schedule</Text>
                        </View>
                    </View>

                    <Text style={[styles.description, { 
                        paddingHorizontal: modalPadding,
                        paddingBottom: modalPadding * 0.5,
                    }]}>
                        Schedule auto monitoring only during key times to save battery.
                    </Text>

                    <ScrollView 
                        style={[styles.scheduleContainer, { paddingHorizontal: modalPadding * 0.5 }]} 
                        showsVerticalScrollIndicator={false}
                    >
                        {Object.entries(schedule).map(([day, daySchedule]) => (
                            <DayScheduleRow
                                key={day}
                                day={day}
                                schedule={daySchedule}
                                onUpdateSchedule={updateSchedule}
                            />
                        ))}
                    </ScrollView>

                    <View style={[styles.footer, { padding: modalPadding }]}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.safeZonesButton}
                            onPress={handleSafeZones}
                        >
                            <Text style={styles.safeZonesText}>
                                * Locations where auto detection are inactive can be set in <Text style={styles.safeZonesLink}>Safe Zones</Text>.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        margin: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        borderBottomColor: '#E5E5EA',
        marginBottom: -15,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // Space between icon and text
        marginLeft: 10,
        marginBottom: 10,
        marginTop: 10,
    },
    premiumIcon: {
        tintColor: '#000000', // Black color
        resizeMode: 'contain',
        width: Metrix.HorizontalSize(35),
        height: Metrix.VerticalSize(35),
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        textAlign: 'left',
        flex: 1, // Take remaining space
    },
    description: {
        fontSize: Math.min(width * 0.05, 16), // Responsive font size
        color: '#000',
        lineHeight: 18,
        marginTop: 8,
    },
    scheduleContainer: {
        maxHeight: 350,
    },
    // DayScheduleRow Styles
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        minHeight: 60, // Ensure minimum touch target
    },
    dayContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    dayText: {
        fontSize: Math.min(width * 0.04, 16), // Responsive font size
        fontWeight: '500',
        color: '#000',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: width * 0.02, // Responsive margin
    },
    timeButton: {
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        minHeight: 40, // Ensure minimum touch target
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        fontSize: Math.min(width * 0.035, 14), // Responsive font size
        color: '#000',
        fontWeight: '500',
    },
    dashText: {
        fontSize: Math.min(width * 0.04, 16), // Responsive font size
        color: '#8E8E93',
        marginHorizontal: 8,
        fontWeight: '300',
    },
    switch: {
        borderRadius: 25,
        justifyContent: 'center',
        padding: 2,
    },
    switchThumb: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    // Footer Styles
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    cancelButton: {
        borderRadius: 12,
        paddingVertical: 16,
    },
    cancelButtonText: {
        color: '#000',
        fontSize: Math.min(width * 0.04, 16), // Responsive font size
        fontWeight: '600',
        textAlign: 'center',
    },
    safeZonesButton: {
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    safeZonesText: {
        fontSize: Math.min(width * 0.035, 14), // Responsive font size
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 16,
        fontStyle: 'italic',
    },
    safeZonesLink: {
        color: '#000',
        fontWeight: '500',
    },
});