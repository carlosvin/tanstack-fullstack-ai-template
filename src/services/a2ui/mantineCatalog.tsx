/**
 * Narrow Mantine 9 catalog for agentic A2UI surfaces.
 *
 * `@a2ui-bridge/react-mantine@0.1.0` peers Mantine 8 and Tabler icons.
 * This app is Mantine 9 with lucide-react, so the host maps the few
 * component types task views need and drops every other type.
 */

import type { A2UIComponentProps } from '@a2ui-bridge/react'
import { createActionHandler, createComponentMapping, extractValue } from '@a2ui-bridge/react'
import { Badge, Button, Card, Group, Stack, Table, Text, Title } from '@mantine/core'

export const A2UI_COMPONENT_TYPES = [
	'Column',
	'Row',
	'Card',
	'Text',
	'Title',
	'Badge',
	'Button',
	'Table',
	'TableHead',
	'TableBody',
	'TableRow',
	'TableHeaderCell',
	'TableCell',
] as const

export type A2uiComponentType = (typeof A2UI_COMPONENT_TYPES)[number]

const ALLOWED = new Set<string>(A2UI_COMPONENT_TYPES)

export function isAllowedA2uiComponent(type: string): type is A2uiComponentType {
	return ALLOWED.has(type)
}

function field(properties: object, key: string): unknown {
	for (const [entryKey, value] of Object.entries(properties)) {
		if (entryKey === key) return value
	}
	return undefined
}

function readText(value: unknown): string {
	const extracted = extractValue(value)
	return typeof extracted === 'string' ? extracted : ''
}

function asAction(value: unknown): { name: string; context?: Array<{ key: string; value: unknown }> } | undefined {
	if (typeof value !== 'object' || value === null || !('name' in value)) return undefined
	const name = value.name
	if (typeof name !== 'string' || name.length === 0) return undefined
	const context = 'context' in value && Array.isArray(value.context) ? value.context : undefined
	return { name, context }
}

function TextAdapter({ node }: A2UIComponentProps) {
	const hintValue = field(node.properties, 'usageHint')
	const hint = typeof hintValue === 'string' ? hintValue : 'body'
	const caption = hint === 'caption'
	return (
		<Text
			size={caption ? 'xs' : hint === 'h3' ? 'lg' : 'sm'}
			fw={hint === 'h3' ? 600 : undefined}
			c={caption ? 'dimmed' : undefined}
		>
			{readText(field(node.properties, 'text'))}
		</Text>
	)
}

function TitleAdapter({ node }: A2UIComponentProps) {
	return <Title order={4}>{readText(field(node.properties, 'text'))}</Title>
}

function BadgeAdapter({ node }: A2UIComponentProps) {
	const colorValue = field(node.properties, 'color')
	const color = typeof colorValue === 'string' ? colorValue : 'gray'
	return (
		<Badge variant="light" color={color} tt="none">
			{readText(field(node.properties, 'text'))}
		</Badge>
	)
}

function ButtonAdapter({ node, onAction, components, surfaceId, children }: A2UIComponentProps) {
	const card = field(node.properties, 'appearance') === 'card'
	return (
		<Button
			type="button"
			variant={card ? 'light' : 'subtle'}
			color="gray"
			fullWidth={card}
			justify="flex-start"
			h={card ? 'auto' : undefined}
			styles={
				card
					? {
							inner: { justifyContent: 'flex-start' },
							label: { width: '100%', whiteSpace: 'normal', textAlign: 'left' },
						}
					: undefined
			}
			onClick={createActionHandler(asAction(field(node.properties, 'action')), {
				onAction,
				surfaceId,
				componentId: node.id,
				children,
				components,
			})}
		>
			{children}
		</Button>
	)
}

function CardAdapter({ children }: A2UIComponentProps) {
	return (
		<Card withBorder radius="md" padding="sm">
			{children}
		</Card>
	)
}

function ColumnAdapter({ children }: A2UIComponentProps) {
	return <Stack gap="xs">{children}</Stack>
}

function RowAdapter({ children }: A2UIComponentProps) {
	return <Group gap="xs">{children}</Group>
}

function TableAdapter({ children }: A2UIComponentProps) {
	return <Table withTableBorder>{children}</Table>
}

function TableHeadAdapter({ children }: A2UIComponentProps) {
	return (
		<Table.Thead>
			<Table.Tr>{children}</Table.Tr>
		</Table.Thead>
	)
}

function TableBodyAdapter({ children }: A2UIComponentProps) {
	return <Table.Tbody>{children}</Table.Tbody>
}

function TableRowAdapter({ children }: A2UIComponentProps) {
	return <Table.Tr>{children}</Table.Tr>
}

function TableHeaderCellAdapter({ children }: A2UIComponentProps) {
	return <Table.Th scope="col">{children}</Table.Th>
}

function TableCellAdapter({ children }: A2UIComponentProps) {
	return <Table.Td>{children}</Table.Td>
}

function UnknownA2uiNode() {
	return null
}

export const mantineTaskCatalog = createComponentMapping(
	{
		Column: ColumnAdapter,
		Row: RowAdapter,
		Card: CardAdapter,
		Text: TextAdapter,
		Title: TitleAdapter,
		Badge: BadgeAdapter,
		Button: ButtonAdapter,
		Table: TableAdapter,
		TableHead: TableHeadAdapter,
		TableBody: TableBodyAdapter,
		TableRow: TableRowAdapter,
		TableHeaderCell: TableHeaderCellAdapter,
		TableCell: TableCellAdapter,
	},
	UnknownA2uiNode,
)
