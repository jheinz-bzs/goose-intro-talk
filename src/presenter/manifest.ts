export interface ManifestSlide {
  id: string;
  name: string;
  /** The clip that plays when arriving at this slide. */
  clip: string;
  still: string;
  thumb: string;
}

export interface Manifest {
  version: string;
  fps: number;
  width: number;
  height: number;
  slides: ManifestSlide[];
}

export const PRERENDER_DIR = '/prerender/';

export async function loadManifest(): Promise<Manifest> {
  const response = await fetch(`${PRERENDER_DIR}manifest.json`, {cache: 'no-cache'});
  if (!response.ok) throw new Error(`Missing prerender manifest (${response.status}); run npm run present`);
  return (await response.json()) as Manifest;
}
