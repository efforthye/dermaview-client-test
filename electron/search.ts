import {Image} from "./schema";
import assert from "node:assert";
import {conn} from "./database";

export function searchImages(
    query: string,
    queryField: string,
): Image[] {
    assert.ok(conn, 'Database connection is not established');

    if (!queryField || !query) {
        const images = conn
            .prepare(`SELECT * FROM images;`)
            .all();

        return images;
    }

    // check if queryField is really a field of Image
    const fields = Object.keys(new Image());
    if (!fields.includes(queryField)) {
        console.error(`Invalid query field: ${queryField}`);
        return [];
    }

    const images = conn
        .prepare(`SELECT * FROM images WHERE ${queryField} LIKE '%${query}%';`)
        .all();

    console.log(images);
    return images;
}