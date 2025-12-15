import { openDatabaseSync } from "expo-sqlite";

export const db = openDatabaseSync("focus.db");

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      duration INTEGER NOT NULL,
      distractions INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
};
