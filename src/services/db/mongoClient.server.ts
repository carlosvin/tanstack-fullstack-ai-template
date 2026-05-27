import { type Db, MongoClient } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Returns a singleton MongoDB database connection.
 * Lazily connects on first call.
 */
export async function getDb(): Promise<Db> {
	if (db) return db

	const uri = process.env.MONGODB_URI
	if (!uri) {
		throw new Error('MONGODB_URI environment variable is required for MongoDB repository.')
	}

	const dbName = process.env.MONGODB_DB_NAME ?? 'app-db'

	client = new MongoClient(uri)
	await client.connect()
	console.info(`[db] Connected to MongoDB database: ${dbName}`)
	db = client.db(dbName)
	return db
}
