import { create } from "zustand";
import { QueueEntry } from "@/types";
import { queueApi } from "@/lib/api/queue.api";

interface QueueState {
  currentEntry: QueueEntry | null;
  isLoading: boolean;
  watchId: number | null;
  setCurrentEntry: (entry: QueueEntry | null) => void;
  fetchCurrentEntry: () => Promise<void>;
  startLocationTracking: (entryId: string) => void;
  stopLocationTracking: () => void;
  leaveQueue: (entryId: string) => Promise<void>;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  currentEntry: null,
  isLoading: false,
  watchId: null,

  setCurrentEntry: (entry) => set({ currentEntry: entry }),

  fetchCurrentEntry: async () => {
    set({ isLoading: true });
    try {
      const response = await queueApi.getMyEntry();
      set({ currentEntry: response.entry, isLoading: false });
    } catch {
      set({ currentEntry: null, isLoading: false });
    }
  },

  startLocationTracking: (entryId: string) => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    const { watchId } = get();
    if (watchId !== null) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        queueApi.updateLocation({
          queueEntryId: entryId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
    set({ watchId: id });
  },

  stopLocationTracking: () => {
    const { watchId } = get();
    if (watchId !== null && typeof window !== "undefined") {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
    }
  },

  leaveQueue: async (entryId: string) => {
    const { stopLocationTracking } = get();
    stopLocationTracking();
    await queueApi.leave(entryId);
    set({ currentEntry: null });
  },
}));
