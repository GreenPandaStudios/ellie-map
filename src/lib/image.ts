import type { PinPhoto } from '../features/pins/pinsSlice';

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 1600;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The selected file could not be processed as an image.'));
    image.src = dataUrl;
  });
}

function calculateScaledSize(width: number, height: number) {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }

  const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function optimizeImage(file: File) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const { width, height } = calculateScaledSize(image.width, image.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('The browser could not prepare the uploaded image.');
  }

  context.drawImage(image, 0, 0, width, height);

  if (file.type === 'image/png') {
    return canvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/jpeg', 0.82);
}

export async function fileToPhotoRecord(file: File): Promise<PinPhoto> {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`${file.name} is not a supported image type. Use JPG, PNG, or WebP.`);
  }

  const dataUrl = await optimizeImage(file);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    dataUrl,
  };
}
