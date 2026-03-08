import type { PinEntry } from '../features/pins/pinsSlice';

interface PinDetailsProps {
  entry: PinEntry | null;
  onEdit: (pinId: string) => void;
  onDelete: (pinId: string) => void;
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function PinDetails({ entry, onEdit, onDelete }: PinDetailsProps) {
  if (!entry) {
    return (
      <section className="side-panel empty-panel">
        <p className="eyebrow">No pin selected</p>
        <h2>Choose a memory to revisit.</h2>
        <p>
          Click a pin to view the photos and notes, or click the map to add a new experience anywhere in
          Wisconsin.
        </p>
      </section>
    );
  }

  return (
    <section className="side-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Saved Memory</p>
          <h2>{entry.title}</h2>
        </div>
        <div className="inline-actions">
          <button className="ghost-button" type="button" onClick={() => onEdit(entry.id)}>
            Edit
          </button>
          <button className="danger-button" type="button" onClick={() => onDelete(entry.id)}>
            Delete
          </button>
        </div>
      </div>
      <p className="panel-meta">
        Added {formatDate(entry.createdAt)} • {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
      </p>
      <p className="panel-notes">{entry.notes || 'No notes yet for this stop.'}</p>
      {entry.photos.length > 0 ? (
        <div className="detail-photo-grid">
          {entry.photos.map((photo) => (
            <figure key={photo.id} className="detail-photo-card">
              <img src={photo.dataUrl} alt={photo.name} />
              <figcaption>{photo.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="helper-text">This pin does not have any photos yet.</p>
      )}
    </section>
  );
}
