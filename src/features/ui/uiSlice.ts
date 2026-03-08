import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type EditorMode = 'closed' | 'create' | 'edit';

interface DraftCoordinates {
  lat: number;
  lng: number;
}

interface UiState {
  selectedPinId: string | null;
  editorMode: EditorMode;
  draftCoordinates: DraftCoordinates | null;
}

const initialState: UiState = {
  selectedPinId: null,
  editorMode: 'closed',
  draftCoordinates: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectPin(state, action: PayloadAction<string | null>) {
      state.selectedPinId = action.payload;
      if (action.payload === null && state.editorMode === 'edit') {
        state.editorMode = 'closed';
      }
    },
    startCreate(state, action: PayloadAction<DraftCoordinates>) {
      state.editorMode = 'create';
      state.draftCoordinates = action.payload;
      state.selectedPinId = null;
    },
    startEdit(state, action: PayloadAction<string>) {
      state.editorMode = 'edit';
      state.selectedPinId = action.payload;
      state.draftCoordinates = null;
    },
    closeEditor(state) {
      state.editorMode = 'closed';
      state.draftCoordinates = null;
    },
    clearSelection(state) {
      state.selectedPinId = null;
      if (state.editorMode === 'edit') {
        state.editorMode = 'closed';
      }
    },
  },
});

export const { clearSelection, closeEditor, selectPin, startCreate, startEdit } = uiSlice.actions;

export default uiSlice.reducer;
