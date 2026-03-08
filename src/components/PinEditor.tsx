import { useEffect, useState } from 'react';
import type { PinEntry, PinPhoto } from '../features/pins/pinsSlice';
import { fileToPhotoRecord } from '../lib/image';

export interface PinEditorValues {
  title: string;
  notes: string;
  photos: PinPhoto[];
}

interface PinEditorProps {
  mode: 'create' | 'edit';
  coordinates: { lat: number; lng: number };
  entry?: PinEntry;
  onClose: () => void;
  onDelete?: () => void;
  onSave: (values: PinEditorValues) => void;
}

function formatDate(timestamp?: string) {
  if (!timestamp) {
    return 'Not saved yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function PinEditor({ mode, coordinates, entry, onClose, onDelete, onSave }: PinEditorProps) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [photos, setPhotos] = useState<PinPhoto[]>(entry?.photos ?? []);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setTitle(entry?.title ?? '');
    setNotes(entry?.notes ?? '');
    setPhotos(entry?.photos ?? []);
    setError('');
  }, [entry, mode]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const newPhotos = await Promise.all(files.map((file) => fileToPhotoRecord(file)));
      setPhotos((current) => [...current, ...newPhotos]);
    } catch (processingError) {
      const message = processingError instanceof Error ? processingError.message : 'Unable to add the selected images.';
      setError(message);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  }

  function handleRemovePhoto(photoId: string) {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const normalizedNotes = notes.trim();

    if (!normalizedTitle) {
      setError('Add a title before saving this pin.');
      return;
    }

    onSave({
      title: normalizedTitle,
      notes: normalizedNotes,
      photos,
    });
  }

  const leadPhoto = photos[0] ?? null;

  return (
    <section className="editor-screen" aria-label={mode === 'create' ? 'New pin post editor' : 'Pin post editor'}>
      <form className="editor-shell" onSubmit={handleSubmit}>
        <header className="editor-topbar">
          <div>
            <p className="eyebrow">{mode === 'create' ? 'New Pin Post' : 'Pinned Story'}</p>
            <h2>{mode === 'create' ? 'Turn this location into a full blog post.' : 'Open the pin as a full-screen post.'}</h2>
            <p className="editor-subtitle">
              {mode === 'create'
                ? 'Write the story first, then head back to the map when it is ready.'
                : `Started ${formatDate(entry?.createdAt)} · Last updated ${formatDate(entry?.updatedAt)}`}
            </p>
          </div>
          <div className="editor-actions">
            {onDelete ? (
              <button className="danger-button" type="button" onClick={onDelete}>
                Delete Pin
              </button>
            ) : null}
            <button className="ghost-button" type="button" onClick={onClose}>
              Back to Map
            </button>
            <button className="primary-button" type="submit" disabled={isProcessing}>
              {mode === 'create' ? 'Save Post' : 'Save Changes'}
            </button>
          </div>
        </header>

        <div className="editor-workspace">
          <article className="editor-main-column">
            {leadPhoto ? (
              <figure className="post-cover">
                <img src={leadPhoto.dataUrl} alt={leadPhoto.name} />
                <figcaption>Lead photo: {leadPhoto.name}</figcaption>
              </figure>
            ) : (
              <div className="post-cover post-cover-placeholder">
                <div>
                  <p className="eyebrow">Lead Image</p>
                  <h3>Give the post a visual anchor.</h3>
                  <p className="helper-text">Upload one or more photos and the first image becomes the cover for this pin.</p>
                </div>
              </div>
            )}

            <label className="editor-field">
              Post Title
              <input
                className="editor-title-input"
                type="text"
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Devil's Lake sunset after the storm"
              />
            </label>

            <div className="editor-meta-grid">
              <div className="editor-meta-card">
                <p className="eyebrow">Location</p>
                <div className="coordinates-chip">
                  <span>Latitude {coordinates.lat.toFixed(4)}</span>
                  <span>Longitude {coordinates.lng.toFixed(4)}</span>
                </div>
              </div>
              <div className="editor-meta-card">
                <p className="eyebrow">Post Status</p>
                <p className="editor-meta-copy">
                  {mode === 'create'
                    ? 'Drafting a brand-new post for this map pin.'
                    : `This pin already lives on the map. Save when the story is ready.`}
                </p>
              </div>
            </div>

            <label className="editor-field">
              Story
              <textarea
                className="editor-story-input"
                rows={18}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Write the full story here: the setup, the details you want to remember, and why this pin deserves its own post."
              />
            </label>
          </article>

          <aside className="editor-sidebar">
            <section className="editor-side-card">
              <div className="editor-side-heading">
                <div>
                  <p className="eyebrow">Photo Essay</p>
                  <h3>Build the post around images.</h3>
                </div>
                <label className="ghost-button upload-trigger">
                  Add Photos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelection}
                  />
                </label>
              </div>

              {isProcessing ? <p className="helper-text">Preparing photos for storage...</p> : null}

              {photos.length > 0 ? (
                <div className="photo-grid photo-grid-editor">
                  {photos.map((photo, index) => (
                    <figure key={photo.id} className="photo-card">
                      <img src={photo.dataUrl} alt={photo.name} />
                      <figcaption>{index === 0 ? `${photo.name} · Cover image` : photo.name}</figcaption>
                      <button type="button" className="tiny-button" onClick={() => handleRemovePhoto(photo.id)}>
                        Remove
                      </button>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="helper-text">The first uploaded image becomes the cover photo, and the rest stay in the sidebar gallery.</p>
              )}
            </section>

            <section className="editor-side-card">
              <p className="eyebrow">Publishing Notes</p>
              <h3>What this workspace is for.</h3>
              <p className="editor-meta-copy">
                Every selected pin now opens as a full post workspace, so the story and images can live in one place
                instead of a small preview panel.
              </p>
            </section>

            {error ? <p className="error-text">{error}</p> : null}
          </aside>
        </div>
      </form>
    </section>
  );
}
