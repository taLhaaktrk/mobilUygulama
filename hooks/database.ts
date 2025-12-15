// hooks/database.ts (veya nereye koyduysak)

import * as SQLite from "expo-sqlite";

// Uygulama genelinde kullanacağımız DB nesnesi
export const db = SQLite.openDatabase("focus.db");

// Tablo satırı için tip (ileride işimize yarar)
export type SessionRow = {
  id: number;
  category: string;
  duration: number;
  distractions: number;
  created_at: string;
};

// Uygulama açılırken 1 kere çağıracağız
export const initDatabase = () => {
  db.transaction((tx: SQLite.SQLTransaction) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        duration INTEGER NOT NULL,
        distractions INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );`
    );
  });
};
