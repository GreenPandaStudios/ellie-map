import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ExperienceMap } from './components/ExperienceMap';
import { PinEditor, type PinEditorValues } from './components/PinEditor';
import { type AppDispatch, type RootState } from './app/store';
import { addEntry, deleteEntry, replaceEntries, updateEntry } from './features/pins/pinsSlice';
import { clearSelection, closeEditor, selectPin, startCreate } from './features/ui/uiSlice';
import { downloadPins, parseImportedPins } from './lib/exportImport';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState('');
  const [importError, setImportError] = useState('');

  const entries = useSelector((state: RootState) =>
    [...state.pins.entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );
  const selectedPinId = useSelector((state: RootState) => state.ui.selectedPinId);
  const editorMode = useSelector((state: RootState) => state.ui.editorMode);
  const draftCoordinates = useSelector((state: RootState) => state.ui.draftCoordinates);

  const selectedEntry = entries.find((entry) => entry.id === selectedPinId) ?? null;
  const activeMode = draftCoordinates ? 'create' : selectedEntry ? 'edit' : null;
  const activeCoordinates = draftCoordinates
    ? draftCoordinates
    : selectedEntry
      ? {
          lat: selectedEntry.lat,
          lng: selectedEntry.lng,
        }
      : null;

  function resetMessages() {
    setFeedback('');
    setImportError('');
  }

  function handleMapClick(coords: { lat: number; lng: number }) {
    resetMessages();
    dispatch(startCreate(coords));
  }

  function handlePinSelect(pinId: string) {
    resetMessages();
    dispatch(selectPin(pinId));
  }

  function handleCloseEditor() {
    dispatch(clearSelection());
    dispatch(closeEditor());
  }

  function handleDownload() {
    resetMessages();
    downloadPins(entries);
    setFeedback(`Downloaded ${entries.length} ${entries.length === 1 ? 'pin' : 'pins'} as JSON.`);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    resetMessages();

    try {
      const contents = await file.text();
      const importedEntries = parseImportedPins(contents);
      dispatch(replaceEntries(importedEntries));
      dispatch(clearSelection());
      dispatch(closeEditor());
      setFeedback(`Imported ${importedEntries.length} ${importedEntries.length === 1 ? 'pin' : 'pins'} from ${file.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The selected file could not be imported.';
      setImportError(message);
    } finally {
      event.target.value = '';
    }
  }

  function handleSave(values: PinEditorValues) {
    resetMessages();

    if (editorMode === 'create' && draftCoordinates) {
      const timestamp = new Date().toISOString();
      const id = crypto.randomUUID();
      dispatch(
        addEntry({
          id,
          lat: draftCoordinates.lat,
          lng: draftCoordinates.lng,
          title: values.title,
          notes: values.notes,
          photos: values.photos,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
      );
      dispatch(selectPin(id));
      dispatch(closeEditor());
      return;
    }

    if (selectedEntry) {
      dispatch(
        updateEntry({
          ...selectedEntry,
          title: values.title,
          notes: values.notes,
          photos: values.photos,
          updatedAt: new Date().toISOString(),
        }),
      );
    }
  }

  function handleDelete(pinId: string) {
    resetMessages();
    dispatch(deleteEntry(pinId));
    dispatch(clearSelection());
    dispatch(closeEditor());
    setFeedback('Pin deleted.');
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Wisconsin Memory Map</p>
          <h1>Pin the places that matter, then open each one as its own full post.</h1>
          <p className="hero-copy">
            Click the map to drop a pin, write the full story in a full-screen editor, and keep a local archive you
            can download or upload at any time.
          </p>
        </div>
        <div className="toolbar-card">
          <div className="toolbar-buttons">
            <button className="primary-button" type="button" onClick={handleDownload}>
              Download Pins
            </button>
            <button className="ghost-button" type="button" onClick={() => uploadInputRef.current?.click()}>
              Upload Pins
            </button>
            <input ref={uploadInputRef} type="file" accept="application/json" hidden onChange={handleUpload} />
          </div>
          <p className="toolbar-note">{entries.length} saved {entries.length === 1 ? 'pin' : 'pins'} in this browser.</p>
          {feedback ? <p className="success-text">{feedback}</p> : null}
          {importError ? <p className="error-text">{importError}</p> : null}
        </div>
      </header>

      <main className="map-layout">
        <section className="map-panel">
          <ExperienceMap
            entries={entries}
            selectedPinId={selectedPinId}
            onMapClick={handleMapClick}
            onPinSelect={handlePinSelect}
          />
        </section>
      </main>

      {activeMode && activeCoordinates ? (
        <PinEditor
          mode={activeMode}
          coordinates={activeCoordinates}
          entry={selectedEntry ?? undefined}
          onClose={handleCloseEditor}
          onDelete={selectedEntry ? () => handleDelete(selectedEntry.id) : undefined}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}

export default App;
