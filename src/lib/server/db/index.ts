import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export function createDb(file: string, migrationsFolder = path.resolve('drizzle')): Db {
	if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
	const sqlite = new Database(file);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	const db = drizzle(sqlite, { schema }) as Db;
	migrate(db, { migrationsFolder });
	return db;
}

let instance: Db | undefined;

export function getDb(): Db {
	if (!instance) instance = createDb(process.env.DATABASE_PATH ?? 'data/app.db');
	return instance;
}
