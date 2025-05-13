import { atom } from 'jotai';

export const explorerLocation = atom<ExplorerLocation | null>(null);
export enum ExplorerLocation {
    EXPLORER = 'explorer',
    UPLOADER = 'uploader',
    SETTINGS = 'settings',
    PATIENTS = 'patients', // 환자 목록 탭 추가
}

export interface UserContext {
    name: string;
    role: string;
    lastActive: Date | null;
}

export const settingsAtom = atom<DermaViewSettings | null>(null);

export interface DermaViewSettings {
    rootDirPath: string;
    userContext: UserContext | null;
    userLastActive: Date | null;
}

export function isValid(settings: DermaViewSettings | null): boolean {
    if (!isValidDirPath(settings)) {
        return false;
    }

    return !(settings && !settings.userContext);
}

export function isValidDirPath(settings: DermaViewSettings | null): boolean {
    if (!settings || !settings.rootDirPath) {
        return false;
    }

    return settings.rootDirPath !== '';
}