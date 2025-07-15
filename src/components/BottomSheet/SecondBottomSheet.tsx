import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Check, Star, X, Circle as XCircle } from 'lucide-react-native';

interface SecondBottomSheetProps {
    onYes: () => void;
    onNo: () => void;
    onChange: (index: number) => void;
}

const SecondBottomSheet = forwardRef<BottomSheet, SecondBottomSheetProps>(
    ({ onYes, onNo, onChange }, ref) => {
        const snapPoints = useMemo(() => ['40%'], []);

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
                <BottomSheetView style={styles.contentContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Report an incident?</Text>
                        <Text style={styles.subtitle}>
                            Help keep your community safe by reporting what you see
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={onNo}>
                            <X size={24} color='#666' />
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.confirmButton]}
                            onPress={onYes}>
                            <Check size={24} color='#fff' />
                            <Text style={styles.confirmButtonText}>Report</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

SecondBottomSheet.displayName = 'SecondBottomSheet';

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: 'rgba(60, 60, 60, 0.95)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    handleIndicator: {
        width: 40,
        height: 4,
    },
    contentContainer: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fffbeb',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        gap: 12,
    },
    yesButton: {
        backgroundColor: '#f59e0b',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    yesButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    noButton: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    noButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    confirmButton: {
        backgroundColor: '#4ade80',
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#666',
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#fff',
    },
});

export default SecondBottomSheet;