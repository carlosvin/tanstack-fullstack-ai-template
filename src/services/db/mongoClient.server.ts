import { type Db, MongoClient } from 'mongodb'
import { MongoRepository } from '../repository/mongoRepository.server'
import type { Repository } from '../repository/types'

export type MongoConnector = (uri: string) => Promise<MongoClient>

/**
 * Process-scoped owner of the Mongo client.
 * Disposal closes the client. It does not delete persisted documents.
 */
export class MongoRepositoryScope implements AsyncDisposable {
	readonly repository: Repository

	constructor(
		private readonly client: MongoClient,
		repository: MongoRepository,
	) {
		this.repository = repository
	}

	async [Symbol.asyncDispose](): Promise<void> {
		await this.client.close()
	}
}

async function closeQuietly(client: MongoClient): Promise<void> {
	try {
		await client.close()
	} catch {
		// Keep the original connection or initialization failure.
	}
}

async function connectMongoClient(uri: string): Promise<MongoClient> {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		return client
	} catch (error) {
		await closeQuietly(client)
		throw error
	}
}

/**
 * Connects, constructs collection repositories, and creates indexes.
 * Closes the client when initialization fails.
 */
export async function openMongoRepositoryScope(
	uri: string,
	dbName: string,
	connect: MongoConnector = connectMongoClient,
): Promise<MongoRepositoryScope> {
	const client = await connect(uri)
	try {
		const db: Db = client.db(dbName)
		const repository = new MongoRepository(db)
		await repository.createIndexes()
		return new MongoRepositoryScope(client, repository)
	} catch (error) {
		await closeQuietly(client)
		throw error
	}
}
