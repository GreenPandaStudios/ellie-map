import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PinPhoto {
  id: string;
  name: string;
  dataUrl: string;
}

export interface PinEntry {
  id: string;
  lat: number;
  lng: number;
  title: string;
  notes: string;
  photos: PinPhoto[];
  createdAt: string;
  updatedAt: string;
}

interface PinsState {
  entries: PinEntry[];
}

const initialState: PinsState = {
  entries: [],
};

const pinsSlice = createSlice({
  name: 'pins',
  initialState,
  reducers: {
    addEntry(state, action: PayloadAction<PinEntry>) {
      state.entries.push(action.payload);
    },
    updateEntry(state, action: PayloadAction<PinEntry>) {
      const index = state.entries.findIndex((entry) => entry.id === action.payload.id);
      if (index >= 0) {
        state.entries[index] = action.payload;
      }
    },
    deleteEntry(state, action: PayloadAction<string>) {
      state.entries = state.entries.filter((entry) => entry.id !== action.payload);
    },
    replaceEntries(state, action: PayloadAction<PinEntry[]>) {
      state.entries = action.payload;
    },
  },
});

export const { addEntry, updateEntry, deleteEntry, replaceEntries } = pinsSlice.actions;

export default pinsSlice.reducer;
