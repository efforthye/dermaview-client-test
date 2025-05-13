import {DermaViewSettings} from "../atoms/states.ts";
import {ipcRenderer} from "electron";

export const refreshSettings = async (newSetting: DermaViewSettings | null) => {
    await ipcRenderer.invoke('update-settings', newSetting);
}