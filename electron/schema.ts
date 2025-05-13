

export class User {
    id: number;
    name: string;
    password: string;
    role: 'admin' | 'user';
};

export const USER_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) NOT NULL DEFAULT 'user'
);
`

export class Image {
    digest: string // digest = image path
    patientId: string
    patientName: string
    uploadedAt: Date
    disease: string
    department: string
}

export class ImageBookMark {
    userId: number
    digest: string
}

export const IMAGE_SQL = `
CREATE TABLE IF NOT EXISTS images (
    digest TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    patientName TEXT NOT NULL,
    uploadedAt TEXT NOT NULL,
    disease TEXT NOT NULL,
    department TEXT NOT NULL
);`

export const IMAGE_BOOKMARK_SQL = `
CREATE TABLE IF NOT EXISTS image_bookmarks (
    userId INTEGER NOT NULL,
    digest TEXT NOT NULL,
    PRIMARY KEY (userId, digest),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (digest) REFERENCES images(digest)
);`