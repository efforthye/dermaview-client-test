import SQlite3, { SqliteError } from 'better-sqlite3';
import { ipcMain } from 'electron';
import * as assert from 'node:assert';
import { IPC_CALLS } from '../src/IPC_CALLS';
import {Image, IMAGE_BOOKMARK_SQL, IMAGE_SQL, USER_SQL} from "./schema";
import {searchImages} from "./search";

export let conn: SQlite3.Database | null;
export function setConnection(databasePath: string) {
  if (!conn) {
    conn = new SQlite3(databasePath);
  } else {
    console.log('Connection is cached.');
  }
}

ipcMain.handle(IPC_CALLS.CHECK_DB_HEALTH, async () => {
  try {
    assert.ok(conn, 'Database connection is not established');
    return true;
  } catch (e) {
    // if the table does not exist, create the table
    return false;
  }
});

ipcMain.handle(IPC_CALLS.INITIALIZE_DATABASE, async () => {
  return ensureTables();
});

const ensureTables = () => {
  assert.ok(conn, 'Database connection is not established');
  const tables = conn
    .prepare(`SELECT name FROM sqlite_master WHERE type='table';`)
    .all() as Array<{ name: string }>;

  const isUserTableExistedBefore = tables.some(
    (table: { name: string }) => table.name === 'users'
  );

  createUserTable(isUserTableExistedBefore);
  createImageTable();
  createImageBookmarkTable();
};

const createUserTable = (isUserTableExistedBefore: boolean) => {
    assert.ok(conn, 'Database connection is not established');
    conn.exec(USER_SQL);

    // unique constraint by name
    conn.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name ON users (name);
    `);

    // insert admin : admin as default
    if (!isUserTableExistedBefore) {
        conn.exec(`
            INSERT INTO users (name, password, role) VALUES ('admin', 'admin', 'admin');
        `);
    }
};

const createImageTable = () => {
    assert.ok(conn, 'Database connection is not established');
    conn.exec(IMAGE_SQL);

    // unique constraint by digest
    conn.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_images_digest ON images (digest);
    `);
}

const createImageBookmarkTable = () => {
    assert.ok(conn, 'Database connection is not established');
    conn.exec(IMAGE_BOOKMARK_SQL);

    // unique constraint by digest
    conn.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users ON image_bookmarks (userId, digest);
    `);
}

ipcMain.handle(
  IPC_CALLS.CREATE_USER,
  async (event, role: string, name: string, password: string) => {
    assert.ok(conn, 'Database connection is not established');

    // if admin exists and the role is admin, return with alert
    const admin = conn
      .prepare(
        `
        SELECT * FROM users WHERE role = "admin";
    `
      )
      .get();

    console.log(admin);
    if (admin && role === 'admin') {
      return 'Admin already exists';
    }

    const result = conn.exec(`
        INSERT INTO users (name, password, role) VALUES ('${name}', '${password}', '${role}');
    `);

    console.log(result);
    return result;
  }
);

ipcMain.handle(
    IPC_CALLS.LIST_USERS,
    async () => {
        assert.ok(conn, 'Database connection is not established');

        const users = conn
            .prepare(`SELECT * FROM users;`)
            .all();

        console.log(users);
        return users;
    },
);

ipcMain.handle(
    IPC_CALLS.LIST_IMAGES,
    async (event, query: string, queryField: string) => {
        return searchImages(query, queryField);
    }
);

ipcMain.handle(
    IPC_CALLS.UPLOAD_IMAGES,
    async (event, images: Image[]) => {
        assert.ok(conn, 'Database connection is not established');

        const stmt = conn.prepare(`
            INSERT INTO images (digest, patientId, patientName, uploadedAt, disease, department) VALUES (@digest, @patientId, @patientName, @uploadedAt, @disease, @department);
        `);

        const result = images.map((image) => {
            return stmt.run(image);
        });

        console.log(result);
        return result;
    }
);

ipcMain.handle(
  IPC_CALLS.SIGN_IN,
  async (event, name: string, password: string) => {
    assert.ok(conn, 'Database connection is not established');

    try {
      const user = conn
        .prepare(
          `
            SELECT * FROM users WHERE name = '${name}' AND password = '${password}';
        `
        )
        .get();
      return user;
    } catch (e) {
      // if the table does not exist, create the table
      console.error(e);
      if (e instanceof SqliteError && e.message.includes('no such table')) {
        ensureTables();
      }
    }
  }
);

ipcMain.handle(
  IPC_CALLS.SIGN_UP,
  async (event, name: string, password: string) => {
    assert.ok(conn, 'Database connection is not established');

    const result = conn.exec(`
        INSERT INTO users (name, password) VALUES ('${name}', '${password}');
    `);

    console.log(result);

    // TODO: 중복된 ID로 생성 시도 시 duplicate error code 내려주기
    return result;
  }
);

export const ensureAllTableExists = () => {
  assert.ok(conn, 'Database connection is not established');
  ensureTables();
};
