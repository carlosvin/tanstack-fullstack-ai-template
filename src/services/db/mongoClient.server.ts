import { createServerOnlyFn } from '@tanstack/react-start'
import { type Db, MongoClient } from 'mongodb'
import { webServerEnv } from '../../env/webEnv.server'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Returns a singleton MongoDB database connection.
 * Lazily connects on first call. Never callable from the client.
 */
export const getDb = createServerOnlyFn(async (): Promise<Db> => {
	if (db) return db

	const uri = webServerEnv.MONGODB_URI
	if (!uri) {
		throw new Error('MONGODB_URI environment variable is required for MongoDB repository.')
	}

	const dbName = webServerEnv.MONGODB_DB_NAME ?? 'app-db'

	client = new MongoClient(uri)
	await client.connect()
	console.info(`[db] Connected to MongoDB database: ${dbName}`)
	db = client.db(dbName)
	return db
})
