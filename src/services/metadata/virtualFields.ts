/**
 * Virtual or computed fields whose semantics cannot be fully captured in entity schemas.
 * Exposed via explainField for AI and UI introspection.
 */
export interface VirtualFieldEntry {
	entity: string
	field: string
	description: string
	/** Fields or concepts this virtual field is derived from. */
	derivedFrom?: string[]
}

export const VIRTUAL_FIELD_REGISTRY: VirtualFieldEntry[] = [
	{
		entity: 'task',
		field: 'creatorOnly',
		description:
			'Only the user whose email matches task.createdBy may update or delete the task. Other authenticated users can still read the task.',
		derivedFrom: ['createdBy', 'currentUser.email'],
	},
	{
		entity: 'task',
		field: 'permissions',
		description:
			'Read: anyone. Create: any authenticated user. Update/delete: task creator only (check task.createdBy against current user email).',
		derivedFrom: ['createdBy', 'currentUser.email'],
	},
	{
		entity: 'app',
		field: 'auth',
		description:
			'Authentication is header-based (JWT in Authorization header). There is no cookie login UI — anonymous users can browse but cannot mutate.',
	},
	{
		entity: 'app',
		field: 'repository',
		description:
			'Data is stored in-memory (seed) when MONGODB_URI is unset, or in MongoDB when configured. Repository type is exposed in environment metadata.',
	},
]

const virtualFieldKey = (entity: string, field: string) => `${entity.toLowerCase()}:${field.toLowerCase()}`

const virtualFieldByKey = new Map(
	VIRTUAL_FIELD_REGISTRY.map((entry) => [virtualFieldKey(entry.entity, entry.field), entry]),
)

/** Look up a virtual field explanation. Returns null when not found. */
export function explainVirtualField(entity: string, field: string): VirtualFieldEntry | null {
	return virtualFieldByKey.get(virtualFieldKey(entity, field)) ?? null
}
