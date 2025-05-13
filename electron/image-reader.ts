import fs from "node:fs";

export const getCreationTime = async (filePath: string): Promise<Date> => {
    try {
        const stat = fs.statSync(filePath);
        console.log(stat);
        return stat.birthtime;
    } catch (error) {
        console.error(`Error reading metadata for ${filePath}:`, error);
        return new Date();
    }
}
