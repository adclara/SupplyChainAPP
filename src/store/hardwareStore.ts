import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HardwareState {
    // Scanner State
    isScannerConnected: boolean;
    lastScannedBarcode: string | null;
    lastScanTimestamp: number | null;
    scanLatency: number | null; // Performance tracking target from research

    // Haptic/Audio Feedback
    isAudioEnabled: boolean;
    isHapticEnabled: boolean;

    // Actions
    setScannerConnected: (connected: boolean) => void;
    recordScan: (barcode: string, latency?: number) => void;
    toggleAudio: () => void;
    toggleHaptic: () => void;
    clearLastScan: () => void;
}

/**
 * DEEP DIVE: Hardware & Telemetry Store
 * Tracks scanner performance and device states to ensure <200ms targets.
 */
export const useHardwareStore = create<HardwareState>()(
    persist(
        (set) => ({
            isScannerConnected: false,
            lastScannedBarcode: null,
            lastScanTimestamp: null,
            scanLatency: null,
            isAudioEnabled: true,
            isHapticEnabled: true,

            setScannerConnected: (connected) => set({ isScannerConnected: connected }),

            recordScan: (barcode, latency) => set({
                lastScannedBarcode: barcode,
                lastScanTimestamp: Date.now(),
                scanLatency: latency ?? null,
            }),

            toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
            toggleHaptic: () => set((state) => ({ isHapticEnabled: !state.isHapticEnabled })),
            clearLastScan: () => set({ lastScannedBarcode: null, lastScanTimestamp: null }),
        }),
        {
            name: 'hardware-storage',
        }
    )
);
