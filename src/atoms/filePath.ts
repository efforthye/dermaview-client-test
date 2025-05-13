import { atom } from 'jotai';

export const imagesAtom = atom<string[]>([]);
export const selectedImageAtom = atom<string | null>(null);

export const rootPathAtom = atom<string | null>(null);