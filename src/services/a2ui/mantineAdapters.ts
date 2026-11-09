/**
 * Mantine 9 adapters for the A2UI catalog.
 *
 * Adapted from @a2ui-bridge/react-mantine (MIT, Copyright (c) 2024 tpitre)
 * for this app's Mantine 9 and lucide-react stack. Icons come from mantineIcons.ts.
 */

// biome-ignore-all lint/suspicious/noExplicitAny: A2UI property bags are untyped protocol values

import { createActionHandler, createAdapter, extractValue, mapVariant } from '@a2ui-bridge/react'
import { AreaChart, BarChart, DonutChart, LineChart, PieChart, Sparkline } from '@mantine/charts'
// Mantine Components
import {
	// Disclosure
	Accordion,
	ActionIcon,
	// Feedback
	Alert,
	// Navigation
	Anchor,
	AspectRatio,
	Avatar,
	// Data Display
	Badge,
	Blockquote,
	// Layout
	Box,
	Breadcrumbs,
	// Inputs
	Button,
	// Surfaces
	Card,
	Center,
	Checkbox,
	Chip,
	Code,
	ColorInput,
	Container,
	Divider,
	Fieldset,
	FileInput,
	Flex,
	Group,
	Highlight,
	Image,
	Indicator,
	Loader,
	List as MantineList,
	Mark,
	Menu,
	MultiSelect,
	NavLink,
	Notification,
	NumberInput,
	Pagination,
	Paper,
	PasswordInput,
	PinInput,
	Popover,
	Progress,
	Radio,
	RangeSlider,
	Rating,
	RingProgress,
	ScrollArea,
	SegmentedControl,
	Select,
	SimpleGrid,
	Skeleton,
	Slider,
	Space,
	Spoiler,
	Stack,
	Stepper,
	Switch,
	Table,
	Tabs,
	// Typography
	Text,
	Textarea,
	TextInput,
	ThemeIcon,
	Timeline,
	Title,
	// Overlays
	Tooltip,
} from '@mantine/core'
import React, { type ComponentType } from 'react'

import { getIcon, IconAlertCircle, IconAlertTriangle, IconCheck, IconInfoCircle } from './mantineIcons.ts'

// Type helper for Mantine's polymorphic components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asComponent = <T>(component: T): ComponentType<any> => component as ComponentType<any>

function safeHref(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined
	const href = value.trim()
	if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\')) return href
	try {
		const url = new URL(href)
		if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') return href
	} catch {
		return undefined
	}
	return undefined
}

// Shared label styles for lighter input labels (better visual hierarchy)
const inputLabelStyles = {
	label: { fontWeight: 400 },
}

// ============================================================================
// LAYOUT ADAPTERS
// ============================================================================

/** Row adapter - horizontal flex container */
export const RowAdapter = createAdapter(Group, {
	mapProps: (a2ui, ctx) => {
		const board = extractValue(a2ui.distribution) === 'board'
		return {
			gap: board ? 'sm' : (extractValue(a2ui.gap) ?? 'xs'),
			align: board ? 'stretch' : (extractValue(a2ui.align) ?? extractValue(a2ui.alignment) ?? 'center'),
			justify: extractValue(a2ui.justify) ?? extractValue(a2ui.justifyContent),
			wrap: extractValue(a2ui.wrap) ?? 'wrap',
			grow: board || (extractValue(a2ui.grow) ?? false),
			children: ctx.children,
		}
	},
	displayName: 'RowAdapter',
})

/** Column adapter - vertical flex container */
export const ColumnAdapter = createAdapter(Stack, {
	mapProps: (a2ui, ctx) => {
		const lane = extractValue(a2ui.distribution) === 'lane'
		return {
			gap: extractValue(a2ui.gap) ?? 'xs',
			align: extractValue(a2ui.align) ?? extractValue(a2ui.alignment),
			justify: extractValue(a2ui.justify) ?? extractValue(a2ui.justifyContent),
			flex: lane ? '1 1 14rem' : undefined,
			miw: lane ? 220 : undefined,
			children: ctx.children,
		}
	},
	displayName: 'ColumnAdapter',
})

/** Flex adapter - flexible container */
export const FlexAdapter = createAdapter(asComponent(Flex), {
	mapProps: (a2ui, ctx) => ({
		gap: extractValue(a2ui.gap) ?? 'md',
		direction: extractValue(a2ui.direction) ?? 'row',
		align: extractValue(a2ui.align),
		justify: extractValue(a2ui.justify),
		wrap: extractValue(a2ui.wrap),
		children: ctx.children,
	}),
	displayName: 'FlexAdapter',
})

function gridColumns(value: unknown): number | Record<string, number> {
	const raw = unwrap(value)
	if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw
	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		const cols: Record<string, number> = {}
		for (const [key, entry] of Object.entries(raw)) {
			const count = asNumber(entry, Number.NaN)
			if (Number.isFinite(count) && count > 0) cols[key] = count
		}
		if (Object.keys(cols).length > 0) return cols
	}
	return 2
}

/** Grid adapter - grid layout. `columns` may be a count or a base/sm map. */
export const GridAdapter = createAdapter(SimpleGrid, {
	mapProps: (a2ui, ctx) => ({
		cols: gridColumns(a2ui.columns ?? a2ui.cols),
		spacing: extractValue(a2ui.gap) ?? extractValue(a2ui.spacing) ?? 'md',
		verticalSpacing: extractValue(a2ui.verticalSpacing),
		children: ctx.children,
	}),
	displayName: 'GridAdapter',
})

/** Center adapter - centering container */
export const CenterAdapter = createAdapter(asComponent(Center), {
	mapProps: (a2ui, ctx) => ({
		inline: extractValue(a2ui.inline) ?? false,
		children: ctx.children,
	}),
	displayName: 'CenterAdapter',
})

/** Box adapter - generic container */
export const BoxAdapter = createAdapter(asComponent(Box), {
	mapProps: (a2ui, ctx) => ({
		p: extractValue(a2ui.padding) ?? extractValue(a2ui.p),
		m: extractValue(a2ui.margin) ?? extractValue(a2ui.m),
		bg: extractValue(a2ui.background) ?? extractValue(a2ui.bg),
		children: ctx.children,
	}),
	displayName: 'BoxAdapter',
})

/** Space adapter - spacing utility */
export const SpaceAdapter = createAdapter(Space, {
	mapProps: (a2ui) => ({
		h: extractValue(a2ui.height) ?? extractValue(a2ui.h) ?? 'md',
		w: extractValue(a2ui.width) ?? extractValue(a2ui.w),
	}),
	displayName: 'SpaceAdapter',
})

/** Container adapter */
export const ContainerAdapter = createAdapter(asComponent(Container), {
	mapProps: (a2ui, ctx) => ({
		size: extractValue(a2ui.size) ?? 'md',
		children: ctx.children,
	}),
	displayName: 'ContainerAdapter',
})

/** AspectRatio adapter */
export const AspectRatioAdapter = createAdapter(AspectRatio, {
	mapProps: (a2ui, ctx) => ({
		ratio: extractValue(a2ui.ratio) ?? 16 / 9,
		children: ctx.children,
	}),
	displayName: 'AspectRatioAdapter',
})

// ============================================================================
// SURFACE ADAPTERS
// ============================================================================

/** Card adapter */
export const CardAdapter = createAdapter(asComponent(Card), {
	mapProps: (a2ui, ctx) => ({
		shadow: extractValue(a2ui.shadow),
		padding: extractValue(a2ui.padding) ?? 'sm',
		radius: extractValue(a2ui.radius) ?? 'md',
		withBorder: extractValue(a2ui.withBorder) ?? extractValue(a2ui.bordered) ?? true,
		children: ctx.children,
	}),
	displayName: 'CardAdapter',
})

/** Paper adapter - surface component */
export const PaperAdapter = createAdapter(asComponent(Paper), {
	mapProps: (a2ui, ctx) => ({
		shadow: extractValue(a2ui.shadow) ?? 'xs',
		p: extractValue(a2ui.padding) ?? 'md',
		radius: extractValue(a2ui.radius) ?? 'md',
		withBorder: extractValue(a2ui.withBorder) ?? false,
		children: ctx.children,
	}),
	displayName: 'PaperAdapter',
})

/** Fieldset adapter - form grouping */
export const FieldsetAdapter = createAdapter(Fieldset, {
	mapProps: (a2ui, ctx) => ({
		legend: extractValue(a2ui.legend) ?? extractValue(a2ui.title) ?? extractValue(a2ui.label),
		variant: extractValue(a2ui.variant) ?? 'default',
		children: ctx.children,
	}),
	displayName: 'FieldsetAdapter',
})

/** Divider adapter */
export const DividerAdapter = createAdapter(Divider, {
	mapProps: (a2ui) => ({
		my: extractValue(a2ui.margin) ?? 'md',
		label: extractValue(a2ui.label),
		labelPosition: extractValue(a2ui.labelPosition) ?? 'center',
		orientation: extractValue(a2ui.orientation) ?? 'horizontal',
		size: extractValue(a2ui.size) ?? 'xs',
	}),
	displayName: 'DividerAdapter',
})

/** ScrollArea adapter */
export const ScrollAreaAdapter = createAdapter(ScrollArea, {
	mapProps: (a2ui, ctx) => ({
		h: extractValue(a2ui.height) ?? 300,
		type: extractValue(a2ui.type) ?? 'auto',
		offsetScrollbars: extractValue(a2ui.offsetScrollbars) ?? true,
		children: ctx.children,
	}),
	displayName: 'ScrollAreaAdapter',
})

// ============================================================================
// TYPOGRAPHY ADAPTERS
// ============================================================================

/** Text adapter - handles usageHint for semantic text styling */
export const TextAdapter = createAdapter(asComponent(Text), {
	mapProps: (a2ui, ctx) => {
		const rawContent = a2ui.text ?? a2ui.content ?? a2ui.label ?? ctx.children
		const content = extractValue(rawContent)
		const usageHint = extractValue(a2ui.usageHint)

		// Map usageHint to size and weight for proper visual hierarchy
		const usageHintStyles: Record<string, { size?: string; fw?: number; c?: string }> = {
			h1: { size: '2rem', fw: 700 },
			h2: { size: '1.5rem', fw: 600 },
			h3: { size: '1.25rem', fw: 600 },
			h4: { size: '1.125rem', fw: 600 },
			h5: { size: '1rem', fw: 600 },
			h6: { size: '0.875rem', fw: 600 },
			body: { size: 'md' },
			caption: { size: 'xs', c: 'dimmed' },
			label: { size: 'sm', fw: 400 },
		}

		const hintStyle = usageHint ? usageHintStyles[usageHint] : {}

		return {
			size: extractValue(a2ui.size) ?? hintStyle.size ?? 'md',
			fw: extractValue(a2ui.weight) ?? extractValue(a2ui.fontWeight) ?? hintStyle.fw,
			c: extractValue(a2ui.color) ?? hintStyle.c,
			ta: extractValue(a2ui.align) ?? extractValue(a2ui.textAlign),
			fs: extractValue(a2ui.italic) ? 'italic' : undefined,
			td: extractValue(a2ui.underline) ? 'underline' : extractValue(a2ui.strikethrough) ? 'line-through' : undefined,
			tt: extractValue(a2ui.transform) ?? extractValue(a2ui.textTransform),
			lineClamp: extractValue(a2ui.lineClamp) ?? extractValue(a2ui.maxLines),
			truncate: extractValue(a2ui.truncate),
			children: content,
		}
	},
	displayName: 'TextAdapter',
})

/** Title adapter - headings */
export const TitleAdapter = createAdapter(asComponent(Title), {
	mapProps: (a2ui, ctx) => {
		const rawContent = a2ui.text ?? a2ui.content ?? a2ui.label ?? a2ui.title ?? ctx.children
		const content = extractValue(rawContent)
		const level = extractValue(a2ui.level) ?? extractValue(a2ui.order) ?? 4

		return {
			order: Math.min(Math.max(level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6,
			ta: extractValue(a2ui.align),
			c: extractValue(a2ui.color),
			children: content,
		}
	},
	displayName: 'TitleAdapter',
})

/** Code adapter - inline code or code blocks */
export const CodeAdapter = createAdapter(asComponent(Code), {
	mapProps: (a2ui, ctx) => {
		const content = extractValue(a2ui.code) ?? extractValue(a2ui.text) ?? extractValue(a2ui.content) ?? ctx.children
		return {
			block: extractValue(a2ui.block) ?? false,
			color: extractValue(a2ui.color),
			children: content,
		}
	},
	displayName: 'CodeAdapter',
})

/** Blockquote adapter */
export const BlockquoteAdapter = createAdapter(asComponent(Blockquote), {
	mapProps: (a2ui, ctx) => {
		const content = extractValue(a2ui.quote) ?? extractValue(a2ui.text) ?? extractValue(a2ui.content) ?? ctx.children
		return {
			cite: extractValue(a2ui.cite) ?? extractValue(a2ui.author) ?? extractValue(a2ui.source),
			color: extractValue(a2ui.color) ?? 'blue',
			children: content,
		}
	},
	displayName: 'BlockquoteAdapter',
})

/** Highlight adapter - highlighted text */
export const HighlightAdapter = createAdapter(asComponent(Highlight), {
	mapProps: (a2ui, ctx) => {
		const content = extractValue(a2ui.text) ?? extractValue(a2ui.content) ?? ctx.children ?? ''
		const highlight = extractValue(a2ui.highlight) ?? extractValue(a2ui.query) ?? ''
		return {
			highlight: highlight,
			highlightStyles: { backgroundColor: 'var(--mantine-color-yellow-3)' },
			children: String(content),
		}
	},
	displayName: 'HighlightAdapter',
})

/** Mark adapter - marked/highlighted text */
export const MarkAdapter = createAdapter(asComponent(Mark), {
	mapProps: (a2ui, ctx) => {
		const content = extractValue(a2ui.text) ?? extractValue(a2ui.content) ?? ctx.children
		return {
			color: extractValue(a2ui.color) ?? 'yellow',
			children: content,
		}
	},
	displayName: 'MarkAdapter',
})

/** Spoiler adapter - show more/less */
export const SpoilerAdapter = createAdapter(Spoiler, {
	mapProps: (a2ui, ctx) => ({
		maxHeight: extractValue(a2ui.maxHeight) ?? 100,
		showLabel: extractValue(a2ui.showLabel) ?? 'Show more',
		hideLabel: extractValue(a2ui.hideLabel) ?? 'Hide',
		children: ctx.children,
	}),
	displayName: 'SpoilerAdapter',
})

// ============================================================================
// BADGE & INDICATOR ADAPTERS
// ============================================================================

/** Badge adapter */
export const BadgeAdapter = createAdapter(asComponent(Badge), {
	mapProps: (a2ui) => ({
		children: extractValue(a2ui.label) ?? extractValue(a2ui.text) ?? extractValue(a2ui.content),
		color: mapVariant(
			extractValue(a2ui.variant) ?? extractValue(a2ui.color),
			{
				primary: 'blue',
				secondary: 'gray',
				success: 'green',
				warning: 'yellow',
				danger: 'red',
				error: 'red',
				info: 'cyan',
			},
			extractValue(a2ui.color) ?? 'blue',
		),
		variant: extractValue(a2ui.filled) ? 'filled' : extractValue(a2ui.outline) ? 'outline' : 'light',
		size: extractValue(a2ui.size) ?? 'md',
		radius: extractValue(a2ui.radius) ?? 'xl',
		tt: 'none',
	}),
	displayName: 'BadgeAdapter',
})

/** Indicator adapter - notification dot */
export const IndicatorAdapter = createAdapter(Indicator, {
	mapProps: (a2ui, ctx) => ({
		color: extractValue(a2ui.color) ?? 'red',
		size: extractValue(a2ui.size) ?? 10,
		offset: extractValue(a2ui.offset) ?? 5,
		position: extractValue(a2ui.position) ?? 'top-end',
		processing: extractValue(a2ui.processing) ?? extractValue(a2ui.pulse) ?? false,
		disabled: extractValue(a2ui.hidden) ?? extractValue(a2ui.disabled) ?? false,
		label: extractValue(a2ui.label) ?? extractValue(a2ui.count),
		children: ctx.children,
	}),
	displayName: 'IndicatorAdapter',
})

/** Safe ThemeIcon wrapper - returns null when no icon to render */
const SafeThemeIcon: React.FC<{
	iconName?: string
	color?: string
	variant?: string
	size?: string
	radius?: string
	children?: React.ReactNode
}> = ({ iconName, color, variant, size = 'md', radius, children }) => {
	const IconComponent = getIcon(iconName)
	const iconSize = size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'xl' ? 24 : 16

	// Don't render anything if there's no icon and no children
	const hasIcon = !!IconComponent
	const hasChildren = React.Children.count(children) > 0

	if (!hasIcon && !hasChildren) {
		return null
	}

	return React.createElement(
		ThemeIcon,
		{
			color: color ?? 'blue',
			variant: variant ?? 'filled',
			size: size,
			radius: radius ?? 'md',
		},
		hasIcon ? React.createElement(IconComponent, { size: iconSize }) : children,
	)
}

/** ThemeIcon adapter - icon in shape, returns null when no icon found */
export const ThemeIconAdapter = createAdapter(asComponent(SafeThemeIcon), {
	mapProps: (a2ui, ctx) => ({
		iconName: extractValue(a2ui.icon) ?? extractValue(a2ui.name),
		color: extractValue(a2ui.color),
		variant: extractValue(a2ui.variant),
		size: extractValue(a2ui.size),
		radius: extractValue(a2ui.radius),
		children: ctx.children,
	}),
	displayName: 'ThemeIconAdapter',
})

// ============================================================================
// IMAGE & AVATAR ADAPTERS
// ============================================================================

/** Avatar adapter */
export const AvatarAdapter = createAdapter(asComponent(Avatar), {
	mapProps: (a2ui) => ({
		src: extractValue(a2ui.src) ?? extractValue(a2ui.imageUrl) ?? extractValue(a2ui.image),
		alt: extractValue(a2ui.alt) ?? extractValue(a2ui.name),
		radius: extractValue(a2ui.radius) ?? 'xl',
		size: extractValue(a2ui.size) ?? 'md',
		color: extractValue(a2ui.color) ?? 'blue',
		children: extractValue(a2ui.initials) ?? extractValue(a2ui.fallback) ?? extractValue(a2ui.name)?.charAt(0),
	}),
	displayName: 'AvatarAdapter',
})

/** Image adapter */
export const ImageAdapter = createAdapter(asComponent(Image), {
	mapProps: (a2ui) => ({
		src: safeHref(extractValue(a2ui.src) ?? extractValue(a2ui.url)),
		alt: extractValue(a2ui.alt) ?? extractValue(a2ui.altText) ?? '',
		width: extractValue(a2ui.width),
		height: extractValue(a2ui.height),
		radius: extractValue(a2ui.radius) ?? 'md',
		fit: extractValue(a2ui.fit) ?? 'cover',
		fallbackSrc: extractValue(a2ui.fallback) ?? extractValue(a2ui.placeholder),
	}),
	displayName: 'ImageAdapter',
})

// ============================================================================
// BUTTON ADAPTERS
// ============================================================================

/** Button adapter */
export const ButtonAdapter = createAdapter(asComponent(Button), {
	mapProps: (a2ui, ctx) => {
		const label = extractValue(a2ui.label) ?? extractValue(a2ui.text)
		const iconName = extractValue(a2ui.icon) ?? extractValue(a2ui.leftIcon)
		const IconComponent = getIcon(iconName)
		const variant = extractValue(a2ui.variant)

		const card = extractValue(a2ui.appearance) === 'card'
		return {
			children: label ?? ctx.children,
			onClick: createActionHandler(a2ui.action, ctx),
			variant: card
				? 'light'
				: variant
					? mapVariant(
							variant,
							{
								primary: 'filled',
								secondary: 'outline',
								tertiary: 'subtle',
								ghost: 'subtle',
								link: 'transparent',
								danger: 'filled',
								destructive: 'filled',
								success: 'filled',
							},
							'filled',
						)
					: 'subtle',
			color: card
				? 'gray'
				: variant === 'danger' || variant === 'destructive'
					? 'red'
					: variant === 'success'
						? 'green'
						: (extractValue(a2ui.color) ?? 'gray'),
			disabled: extractValue(a2ui.disabled) ?? false,
			loading: extractValue(a2ui.loading) ?? false,
			size: extractValue(a2ui.size) ?? 'sm',
			radius: extractValue(a2ui.radius) ?? 'md',
			fullWidth: card || (extractValue(a2ui.fullWidth) ?? extractValue(a2ui.block) ?? false),
			justify: card ? 'flex-start' : undefined,
			h: card ? 'auto' : undefined,
			styles: card
				? {
						inner: { justifyContent: 'flex-start' },
						label: { width: '100%', whiteSpace: 'normal', textAlign: 'left' },
					}
				: undefined,
			leftSection: IconComponent ? React.createElement(IconComponent, { size: 16 }) : undefined,
		}
	},
	displayName: 'ButtonAdapter',
})

/** ActionIcon adapter - icon button */
export const ActionIconAdapter = createAdapter(asComponent(ActionIcon), {
	mapProps: (a2ui, ctx) => {
		const iconName = extractValue(a2ui.icon) ?? extractValue(a2ui.name)
		const IconComponent = getIcon(iconName)
		const size = extractValue(a2ui.size) ?? 'md'
		const iconSize = size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'lg' ? 22 : size === 'xl' ? 26 : 18

		return {
			onClick: createActionHandler(a2ui.action, ctx),
			variant: extractValue(a2ui.variant) ?? 'subtle',
			color: extractValue(a2ui.color),
			size: size,
			radius: extractValue(a2ui.radius) ?? 'md',
			disabled: extractValue(a2ui.disabled) ?? false,
			loading: extractValue(a2ui.loading) ?? false,
			'aria-label': extractValue(a2ui.label) ?? extractValue(a2ui.ariaLabel) ?? iconName,
			children: IconComponent ? React.createElement(IconComponent, { size: iconSize }) : ctx.children,
		}
	},
	displayName: 'ActionIconAdapter',
})

// ============================================================================
// TEXT INPUT ADAPTERS
// ============================================================================

/** TextField/Input adapter */
export const TextFieldAdapter = createAdapter(TextInput, {
	mapProps: (a2ui, ctx) => {
		const iconName = extractValue(a2ui.icon) ?? extractValue(a2ui.leftIcon)
		const IconComponent = getIcon(iconName)

		return {
			label: extractValue(a2ui.label),
			placeholder: extractValue(a2ui.placeholder) ?? extractValue(a2ui.hint),
			description: extractValue(a2ui.description) ?? extractValue(a2ui.helperText),
			error: extractValue(a2ui.error),
			required: extractValue(a2ui.required) ?? false,
			disabled: extractValue(a2ui.disabled) ?? false,
			readOnly: extractValue(a2ui.readOnly) ?? false,
			defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
			leftSection: IconComponent ? React.createElement(IconComponent, { size: 16 }) : undefined,
			styles: inputLabelStyles,
			onChange: a2ui.onChange
				? (e: React.ChangeEvent<HTMLInputElement>) => {
						ctx.onAction({
							actionName: a2ui.onChange.name,
							sourceComponentId: ctx.componentId,
							timestamp: new Date().toISOString(),
							context: { value: e.target.value },
						})
					}
				: undefined,
		}
	},
	displayName: 'TextFieldAdapter',
})

/** Input adapter (alias for TextField) */
export const InputAdapter = TextFieldAdapter

/** TextArea adapter */
export const TextAreaAdapter = createAdapter(Textarea, {
	mapProps: (a2ui, _ctx) => {
		// Extract text value - only use if it's a literal (string), not a path binding (object)
		const textValue = extractValue(a2ui.text)
		const isLiteralText = textValue !== undefined && typeof textValue !== 'object'

		return {
			label: extractValue(a2ui.label),
			placeholder: extractValue(a2ui.placeholder) ?? extractValue(a2ui.hint),
			description: extractValue(a2ui.description) ?? extractValue(a2ui.helperText),
			error: extractValue(a2ui.error),
			required: extractValue(a2ui.required) ?? false,
			disabled: extractValue(a2ui.disabled) ?? false,
			readOnly: extractValue(a2ui.readOnly) ?? false,
			minRows: extractValue(a2ui.minRows) ?? extractValue(a2ui.rows) ?? 3,
			maxRows: extractValue(a2ui.maxRows),
			autosize: extractValue(a2ui.autosize) ?? true,
			// Support 'text' (from snippets), 'defaultValue', and 'value' for initial content
			// Only use text if it's a literal value, not a path binding
			defaultValue: isLiteralText ? textValue : (extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value)),
			styles: inputLabelStyles,
		}
	},
	displayName: 'TextAreaAdapter',
})

/** DateTimeInput adapter - Uses native date/datetime-local input with Mantine styling */
function DateTimeInputComponent({
	label,
	enableDate = true,
	enableTime = false,
	value,
	description,
	error,
	required,
	disabled,
	onChange,
}: {
	label?: string
	enableDate?: boolean
	enableTime?: boolean
	value?: string
	description?: string
	error?: string
	required?: boolean
	disabled?: boolean
	onChange?: (value: string) => void
}) {
	// Determine input type based on enabled fields
	const inputType = enableDate && enableTime ? 'datetime-local' : enableTime ? 'time' : 'date'

	return React.createElement(TextInput, {
		label,
		required,
		type: inputType,
		defaultValue: value,
		description,
		error,
		disabled,
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
		styles: {
			input: {
				cursor: 'pointer',
			},
		},
	})
}

export const DateTimeInputAdapter = createAdapter(DateTimeInputComponent as ComponentType, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		enableDate: extractValue(a2ui.enableDate) ?? true,
		enableTime: extractValue(a2ui.enableTime) ?? false,
		value: extractValue(a2ui.value) ?? extractValue(a2ui.defaultValue),
		description: extractValue(a2ui.description),
		error: extractValue(a2ui.error),
		required: extractValue(a2ui.required) ?? false,
		disabled: extractValue(a2ui.disabled) ?? false,
		onChange: a2ui.onChange
			? (value: string) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { value },
					})
				}
			: undefined,
	}),
	displayName: 'DateTimeInputAdapter',
})

/** NumberInput adapter */
export const NumberInputAdapter = createAdapter(asComponent(NumberInput), {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		placeholder: extractValue(a2ui.placeholder),
		description: extractValue(a2ui.description) ?? extractValue(a2ui.helperText),
		error: extractValue(a2ui.error),
		required: extractValue(a2ui.required) ?? false,
		disabled: extractValue(a2ui.disabled) ?? false,
		min: extractValue(a2ui.min),
		max: extractValue(a2ui.max),
		step: extractValue(a2ui.step) ?? 1,
		defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
		prefix: extractValue(a2ui.prefix),
		suffix: extractValue(a2ui.suffix) ?? extractValue(a2ui.unit),
		allowDecimal: extractValue(a2ui.allowDecimal) ?? true,
		allowNegative: extractValue(a2ui.allowNegative) ?? true,
		styles: inputLabelStyles,
		onChange: a2ui.onChange
			? (value: number | string) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { value },
					})
				}
			: undefined,
	}),
	displayName: 'NumberInputAdapter',
})

/** PasswordInput adapter. The secret stays in the field and is not copied into an action. */
export const PasswordInputAdapter = createAdapter(PasswordInput, {
	mapProps: (a2ui) => ({
		label: extractValue(a2ui.label) ?? 'Password',
		placeholder: extractValue(a2ui.placeholder) ?? 'Enter password',
		description: extractValue(a2ui.description),
		error: extractValue(a2ui.error),
		required: extractValue(a2ui.required) ?? false,
		disabled: extractValue(a2ui.disabled) ?? false,
		defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
		styles: inputLabelStyles,
	}),
	displayName: 'PasswordInputAdapter',
})

/** ColorInput adapter */
export const ColorInputAdapter = createAdapter(ColorInput, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		placeholder: extractValue(a2ui.placeholder) ?? 'Pick a color',
		description: extractValue(a2ui.description),
		error: extractValue(a2ui.error),
		required: extractValue(a2ui.required) ?? false,
		disabled: extractValue(a2ui.disabled) ?? false,
		format: extractValue(a2ui.format) ?? 'hex',
		defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
		swatches: extractValue(a2ui.swatches),
		styles: inputLabelStyles,
		onChange: a2ui.onChange
			? (value: string) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { value },
					})
				}
			: undefined,
	}),
	displayName: 'ColorInputAdapter',
})

/** FileInput adapter */
export const FileInputAdapter = createAdapter(FileInput, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		placeholder: extractValue(a2ui.placeholder) ?? 'Choose file',
		description: extractValue(a2ui.description),
		error: extractValue(a2ui.error),
		required: extractValue(a2ui.required) ?? false,
		disabled: extractValue(a2ui.disabled) ?? false,
		accept: extractValue(a2ui.accept),
		multiple: extractValue(a2ui.multiple) ?? false,
		clearable: extractValue(a2ui.clearable) ?? true,
		styles: inputLabelStyles,
		onChange: a2ui.onChange
			? (file: File | File[] | null) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { file: file ? (Array.isArray(file) ? file.map((f) => f.name) : file.name) : null },
					})
				}
			: undefined,
	}),
	displayName: 'FileInputAdapter',
})

/** PinInput adapter. The PIN stays in the field and is not copied into an action. */
export const PinInputAdapter = createAdapter(PinInput, {
	mapProps: (a2ui) => ({
		length: extractValue(a2ui.length) ?? 4,
		type: extractValue(a2ui.type) ?? 'number',
		mask: extractValue(a2ui.mask) ?? false,
		placeholder: extractValue(a2ui.placeholder) ?? '',
		disabled: extractValue(a2ui.disabled) ?? false,
		error: !!extractValue(a2ui.error),
		oneTimeCode: extractValue(a2ui.oneTimeCode) ?? true,
	}),
	displayName: 'PinInputAdapter',
})

// ============================================================================
// SELECTION INPUT ADAPTERS
// ============================================================================

/** Checkbox adapter */
export const CheckboxAdapter = createAdapter(Checkbox, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		description: extractValue(a2ui.description),
		defaultChecked: extractValue(a2ui.checked) ?? extractValue(a2ui.defaultChecked) ?? false,
		disabled: extractValue(a2ui.disabled) ?? false,
		indeterminate: extractValue(a2ui.indeterminate) ?? false,
		size: extractValue(a2ui.size) ?? 'sm',
		color: extractValue(a2ui.color),
		onChange: a2ui.onChange
			? (e: React.ChangeEvent<HTMLInputElement>) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { checked: e.target.checked },
					})
				}
			: undefined,
	}),
	displayName: 'CheckboxAdapter',
})

/** Switch adapter */
export const SwitchAdapter = createAdapter(Switch, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		description: extractValue(a2ui.description),
		defaultChecked: extractValue(a2ui.checked) ?? extractValue(a2ui.defaultChecked) ?? false,
		disabled: extractValue(a2ui.disabled) ?? false,
		size: extractValue(a2ui.size) ?? 'sm',
		color: extractValue(a2ui.color),
		onLabel: extractValue(a2ui.onLabel),
		offLabel: extractValue(a2ui.offLabel),
		onChange: a2ui.onChange
			? (e: React.ChangeEvent<HTMLInputElement>) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { checked: e.target.checked },
					})
				}
			: undefined,
	}),
	displayName: 'SwitchAdapter',
})

/** RadioGroup adapter */
export const RadioGroupAdapter = createAdapter(asComponent(Radio.Group), {
	mapProps: (a2ui, ctx) => {
		const options = (extractValue(a2ui.options) ?? []).map((opt: any) => ({
			value: String(opt.value ?? opt.id ?? opt.label),
			label: opt.label ?? opt.text ?? opt.value,
			description: opt.description,
		}))

		return {
			label: extractValue(a2ui.label),
			description: extractValue(a2ui.description),
			defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
			onChange: a2ui.onChange
				? (value: string) => {
						ctx.onAction({
							actionName: a2ui.onChange.name,
							sourceComponentId: ctx.componentId,
							timestamp: new Date().toISOString(),
							context: { value },
						})
					}
				: undefined,
			children: React.createElement(
				Stack,
				{ gap: 'xs', mt: 'xs' },
				options.map((opt: any) =>
					React.createElement(Radio, {
						key: opt.value,
						value: opt.value,
						label: opt.label,
						description: opt.description,
					}),
				),
			),
		}
	},
	displayName: 'RadioGroupAdapter',
})

/** Select adapter */
export const SelectAdapter = createAdapter(asComponent(Select), {
	mapProps: (a2ui, ctx) => {
		const rawOptions = extractValue(a2ui.options) ?? []
		const data = rawOptions
			.filter((opt: any) => opt != null)
			.map((opt: any) => {
				// Handle string options
				if (typeof opt === 'string') {
					return { value: opt, label: opt }
				}
				// Handle object options - use extractValue to unwrap literalString/literalNumber etc.
				const rawValue = extractValue(opt.value) ?? extractValue(opt.id) ?? extractValue(opt.label) ?? ''
				const value = String(rawValue)
				const rawLabel = extractValue(opt.label) ?? extractValue(opt.text) ?? extractValue(opt.value) ?? value
				const label = String(rawLabel)
				return {
					value,
					label,
					disabled: extractValue(opt.disabled),
				}
			})
			.filter((opt: any) => opt.value && opt.label)

		return {
			label: extractValue(a2ui.label),
			placeholder: extractValue(a2ui.placeholder) ?? 'Select an option',
			description: extractValue(a2ui.description),
			error: extractValue(a2ui.error),
			data,
			defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
			disabled: extractValue(a2ui.disabled) ?? false,
			clearable: extractValue(a2ui.clearable) ?? false,
			searchable: extractValue(a2ui.searchable) ?? false,
			required: extractValue(a2ui.required) ?? false,
			styles: inputLabelStyles,
			onChange: a2ui.onChange
				? (value: string | null) => {
						ctx.onAction({
							actionName: a2ui.onChange.name,
							sourceComponentId: ctx.componentId,
							timestamp: new Date().toISOString(),
							context: { value },
						})
					}
				: undefined,
		}
	},
	displayName: 'SelectAdapter',
})

/** MultiSelect adapter */
export const MultiSelectAdapter = createAdapter(asComponent(MultiSelect), {
	mapProps: (a2ui, ctx) => {
		const rawOptions = extractValue(a2ui.options) ?? []
		const data = rawOptions
			.filter((opt: any) => opt != null)
			.map((opt: any) => {
				if (typeof opt === 'string') {
					return { value: opt, label: opt }
				}
				// Handle object options - use extractValue to unwrap literalString/literalNumber etc.
				const rawValue = extractValue(opt.value) ?? extractValue(opt.id) ?? extractValue(opt.label) ?? ''
				const value = String(rawValue)
				const rawLabel = extractValue(opt.label) ?? extractValue(opt.text) ?? extractValue(opt.value) ?? value
				const label = String(rawLabel)
				return {
					value,
					label,
					disabled: extractValue(opt.disabled),
				}
			})
			.filter((opt: any) => opt.value && opt.label)

		return {
			label: extractValue(a2ui.label),
			placeholder: extractValue(a2ui.placeholder) ?? 'Select options',
			description: extractValue(a2ui.description),
			error: extractValue(a2ui.error),
			data,
			defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
			disabled: extractValue(a2ui.disabled) ?? false,
			clearable: extractValue(a2ui.clearable) ?? true,
			searchable: extractValue(a2ui.searchable) ?? true,
			maxValues: extractValue(a2ui.maxValues) ?? extractValue(a2ui.max),
			styles: inputLabelStyles,
			onChange: a2ui.onChange
				? (value: string[]) => {
						ctx.onAction({
							actionName: a2ui.onChange.name,
							sourceComponentId: ctx.componentId,
							timestamp: new Date().toISOString(),
							context: { value },
						})
					}
				: undefined,
		}
	},
	displayName: 'MultiSelectAdapter',
})

/** SegmentedControl adapter */
export const SegmentedControlAdapter = createAdapter(asComponent(SegmentedControl), {
	mapProps: (a2ui, ctx) => {
		const data = (extractValue(a2ui.options) ?? extractValue(a2ui.data) ?? []).map((opt: any) =>
			typeof opt === 'string'
				? { value: opt, label: opt }
				: {
						value: String(opt.value ?? opt.id ?? opt.label),
						label: opt.label ?? opt.text ?? opt.value,
						disabled: opt.disabled,
					},
		)

		return {
			data,
			defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value),
			disabled: extractValue(a2ui.disabled) ?? false,
			fullWidth: extractValue(a2ui.fullWidth) ?? false,
			size: extractValue(a2ui.size) ?? 'sm',
			color: extractValue(a2ui.color),
			onChange: a2ui.onChange
				? (value: string) => {
						ctx.onAction({
							actionName: a2ui.onChange.name,
							sourceComponentId: ctx.componentId,
							timestamp: new Date().toISOString(),
							context: { value },
						})
					}
				: undefined,
		}
	},
	displayName: 'SegmentedControlAdapter',
})

/** Chip adapter - selectable chip */
export const ChipAdapter = createAdapter(asComponent(Chip), {
	mapProps: (a2ui, ctx) => ({
		children: extractValue(a2ui.label) ?? extractValue(a2ui.text) ?? ctx.children,
		defaultChecked: extractValue(a2ui.checked) ?? extractValue(a2ui.selected) ?? false,
		variant: extractValue(a2ui.variant) ?? 'outline',
		size: extractValue(a2ui.size) ?? 'sm',
		color: extractValue(a2ui.color),
		disabled: extractValue(a2ui.disabled) ?? false,
		onChange: a2ui.onChange
			? (checked: boolean) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { checked },
					})
				}
			: undefined,
	}),
	displayName: 'ChipAdapter',
})

// ============================================================================
// SLIDER & RATING ADAPTERS
// ============================================================================

/** Slider adapter */
export const SliderAdapter = createAdapter(Slider, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		min: extractValue(a2ui.min) ?? 0,
		max: extractValue(a2ui.max) ?? 100,
		step: extractValue(a2ui.step) ?? 1,
		defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value) ?? 50,
		disabled: extractValue(a2ui.disabled) ?? false,
		marks: extractValue(a2ui.marks),
		color: extractValue(a2ui.color),
		size: extractValue(a2ui.size) ?? 'sm',
		showLabelOnHover: extractValue(a2ui.showLabel) ?? true,
		onChangeEnd: a2ui.onChange
			? (value: number) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { value },
					})
				}
			: undefined,
	}),
	displayName: 'SliderAdapter',
})

/** RangeSlider adapter */
export const RangeSliderAdapter = createAdapter(RangeSlider, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.label),
		min: extractValue(a2ui.min) ?? 0,
		max: extractValue(a2ui.max) ?? 100,
		step: extractValue(a2ui.step) ?? 1,
		defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value) ?? [25, 75],
		disabled: extractValue(a2ui.disabled) ?? false,
		marks: extractValue(a2ui.marks),
		color: extractValue(a2ui.color),
		size: extractValue(a2ui.size) ?? 'sm',
		minRange: extractValue(a2ui.minRange),
		onChangeEnd: a2ui.onChange
			? (value: [number, number]) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { value, min: value[0], max: value[1] },
					})
				}
			: undefined,
	}),
	displayName: 'RangeSliderAdapter',
})

/** Rating adapter */
export const RatingAdapter = createAdapter(Rating, {
	mapProps: (a2ui, ctx) => ({
		defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.value) ?? 0,
		count: extractValue(a2ui.count) ?? extractValue(a2ui.max) ?? 5,
		fractions: extractValue(a2ui.fractions) ?? (extractValue(a2ui.half) ? 2 : 1),
		size: extractValue(a2ui.size) ?? 'md',
		color: extractValue(a2ui.color) ?? 'yellow',
		readOnly: extractValue(a2ui.readOnly) ?? false,
		highlightSelectedOnly: extractValue(a2ui.highlightSelectedOnly) ?? false,
		onChange: a2ui.onChange
			? (value: number) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { value },
					})
				}
			: undefined,
	}),
	displayName: 'RatingAdapter',
})

// ============================================================================
// FEEDBACK ADAPTERS
// ============================================================================

/** Alert adapter */
export const AlertAdapter = createAdapter(Alert, {
	mapProps: (a2ui, ctx) => {
		const iconMap: Record<string, React.ReactNode> = {
			info: React.createElement(IconInfoCircle, { size: 18 }),
			success: React.createElement(IconCheck, { size: 18 }),
			warning: React.createElement(IconAlertTriangle, { size: 18 }),
			error: React.createElement(IconAlertCircle, { size: 18 }),
			danger: React.createElement(IconAlertCircle, { size: 18 }),
		}

		const colorMap: Record<string, string> = {
			info: 'blue',
			success: 'green',
			warning: 'yellow',
			error: 'red',
			danger: 'red',
		}

		const variant = extractValue(a2ui.variant) ?? extractValue(a2ui.type) ?? 'info'

		return {
			title: extractValue(a2ui.title),
			color: colorMap[variant] ?? extractValue(a2ui.color) ?? 'blue',
			icon: iconMap[variant],
			radius: 'md',
			variant: extractValue(a2ui.filled) ? 'filled' : 'light',
			withCloseButton: extractValue(a2ui.closable) ?? extractValue(a2ui.withCloseButton) ?? false,
			children:
				extractValue(a2ui.message) ?? extractValue(a2ui.description) ?? extractValue(a2ui.content) ?? ctx.children,
		}
	},
	displayName: 'AlertAdapter',
})

/** Notification adapter */
export const NotificationAdapter = createAdapter(Notification, {
	mapProps: (a2ui, ctx) => {
		const iconMap: Record<string, React.ReactNode> = {
			info: React.createElement(IconInfoCircle, { size: 18 }),
			success: React.createElement(IconCheck, { size: 18 }),
			warning: React.createElement(IconAlertTriangle, { size: 18 }),
			error: React.createElement(IconAlertCircle, { size: 18 }),
		}

		const colorMap: Record<string, string> = {
			info: 'blue',
			success: 'green',
			warning: 'yellow',
			error: 'red',
		}

		const variant = extractValue(a2ui.variant) ?? extractValue(a2ui.type) ?? 'info'

		return {
			title: extractValue(a2ui.title),
			color: colorMap[variant] ?? extractValue(a2ui.color) ?? 'blue',
			icon: iconMap[variant],
			radius: 'md',
			loading: extractValue(a2ui.loading) ?? false,
			withCloseButton: extractValue(a2ui.closable) ?? true,
			withBorder: extractValue(a2ui.withBorder) ?? true,
			children: extractValue(a2ui.message) ?? extractValue(a2ui.description) ?? ctx.children,
		}
	},
	displayName: 'NotificationAdapter',
})

/** Progress adapter */
export const ProgressAdapter = createAdapter(Progress, {
	mapProps: (a2ui) => ({
		value: extractValue(a2ui.value) ?? extractValue(a2ui.progress) ?? 0,
		color: extractValue(a2ui.color) ?? 'blue',
		size: extractValue(a2ui.size) ?? 'md',
		radius: extractValue(a2ui.radius) ?? 'xl',
		striped: extractValue(a2ui.striped) ?? false,
		animated: extractValue(a2ui.animated) ?? extractValue(a2ui.indeterminate) ?? false,
	}),
	displayName: 'ProgressAdapter',
})

function unwrap(value: unknown): unknown {
	const extracted = extractValue(value)
	if (Array.isArray(extracted)) return extracted.map((item) => unwrap(item))
	if (typeof extracted === 'object' && extracted !== null) {
		const next: Record<string, unknown> = {}
		for (const [key, item] of Object.entries(extracted)) next[key] = unwrap(item)
		return next
	}
	return extracted
}

function asString(value: unknown, fallback = ''): string {
	const unwrapped = unwrap(value)
	return typeof unwrapped === 'string' ? unwrapped : fallback
}

function asNumber(value: unknown, fallback: number): number {
	const unwrapped = unwrap(value)
	return typeof unwrapped === 'number' && Number.isFinite(unwrapped) ? unwrapped : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
	const unwrapped = unwrap(value)
	return typeof unwrapped === 'boolean' ? unwrapped : fallback
}

function chartRows(value: unknown): Array<Record<string, unknown>> {
	const unwrapped = unwrap(value)
	if (!Array.isArray(unwrapped)) return []
	return unwrapped.filter(
		(row): row is Record<string, unknown> => typeof row === 'object' && row !== null && !Array.isArray(row),
	)
}

function numberList(value: unknown): number[] {
	const unwrapped = unwrap(value)
	if (!Array.isArray(unwrapped)) return []
	return unwrapped.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
}

function chartSeries(value: unknown): Array<{ name: string; color: string; label?: string }> {
	return chartRows(value).flatMap((row) => {
		const name = asString(row.name)
		if (!name) return []
		const label = asString(row.label)
		return [{ name, color: asString(row.color, 'teal'), ...(label ? { label } : {}) }]
	})
}

function sliceData(value: unknown): Array<{ name: string; value: number; color: string }> {
	return chartRows(value).flatMap((row) => {
		const name = asString(row.name)
		if (!name) return []
		return [{ name, value: asNumber(row.value, 0), color: asString(row.color, 'blue') }]
	})
}

function barRows(value: unknown): Array<Record<string, string | number>> {
	return chartRows(value).flatMap((row) => {
		const next: Record<string, string | number> = {}
		for (const [key, item] of Object.entries(row)) {
			if (typeof item === 'string' || (typeof item === 'number' && Number.isFinite(item))) next[key] = item
		}
		return Object.keys(next).length > 0 ? [next] : []
	})
}

/** Shares of a whole. Counts that sum past 100 become percentages so the ring stays a full circle. */
function ringSections(value: unknown): Array<{ value: number; color: string; tooltip?: string }> | null {
	const parsed = chartRows(value).flatMap((row) => {
		const amount = asNumber(row.value, 0)
		if (amount <= 0) return []
		const tooltip = asString(row.tooltip) || asString(row.label)
		return [{ value: amount, color: asString(row.color, 'blue'), ...(tooltip ? { tooltip } : {}) }]
	})
	if (parsed.length === 0) return null
	const sum = parsed.reduce((total, section) => total + section.value, 0)
	const scale = sum > 100 ? 100 / sum : 1
	return parsed.map((section) => ({
		...section,
		value: Math.round(section.value * scale * 10) / 10,
	}))
}

/** RingProgress adapter - one value, or a multi-section distribution. */
export const RingProgressAdapter = createAdapter(RingProgress, {
	mapProps: (a2ui) => {
		const sections = ringSections(a2ui.sections)
		const value = asNumber(a2ui.value ?? a2ui.progress, 0)
		const color = asString(a2ui.color, 'blue')
		const resolved = sections ?? [{ value, color }]
		const labelValue = sections ? resolved.reduce((total, section) => total + section.value, 0) : value

		return {
			sections: resolved,
			size: asNumber(a2ui.size, 120),
			thickness: asNumber(a2ui.thickness, 12),
			roundCaps: asBoolean(a2ui.roundCaps, true),
			label: asBoolean(a2ui.showLabel, true)
				? React.createElement(asComponent(Text), { size: 'lg', ta: 'center', fw: 700 }, `${Math.round(labelValue)}%`)
				: undefined,
		}
	},
	displayName: 'RingProgressAdapter',
})

/** Spinner/Loader adapter */
export const SpinnerAdapter = createAdapter(Loader, {
	mapProps: (a2ui) => ({
		size: extractValue(a2ui.size) ?? 'md',
		color: extractValue(a2ui.color) ?? 'blue',
		type: extractValue(a2ui.type) ?? 'oval',
	}),
	displayName: 'SpinnerAdapter',
})

/** Skeleton adapter */
export const SkeletonAdapter = createAdapter(Skeleton, {
	mapProps: (a2ui) => ({
		height: extractValue(a2ui.height) ?? 20,
		width: extractValue(a2ui.width),
		radius: extractValue(a2ui.radius) ?? 'sm',
		circle: extractValue(a2ui.circle) ?? false,
		animate: extractValue(a2ui.animate) ?? true,
	}),
	displayName: 'SkeletonAdapter',
})

// ============================================================================
// OVERLAY ADAPTERS
// ============================================================================

/** Tooltip adapter */
export const TooltipAdapter = createAdapter(Tooltip, {
	mapProps: (a2ui, ctx) => ({
		label: extractValue(a2ui.content) ?? extractValue(a2ui.label) ?? extractValue(a2ui.text),
		position: extractValue(a2ui.position) ?? 'top',
		withArrow: extractValue(a2ui.withArrow) ?? true,
		color: extractValue(a2ui.color),
		children: ctx.children,
	}),
	displayName: 'TooltipAdapter',
})

function childList(children: React.ReactNode): React.ReactNode[] {
	return React.Children.toArray(children)
}

/** Popover adapter. The first child is the target; the rest sit in the dropdown. */
function PopoverView({
	position,
	withArrow,
	shadow,
	children,
}: {
	position?: React.ComponentProps<typeof Popover>['position']
	withArrow?: boolean
	shadow?: string
	children?: React.ReactNode
}) {
	const items = childList(children)
	return React.createElement(
		Popover,
		{ position, withArrow, shadow: shadow as React.ComponentProps<typeof Popover>['shadow'] },
		React.createElement(asComponent(Popover.Target), null, React.createElement('span', null, items[0] ?? null)),
		React.createElement(asComponent(Popover.Dropdown), null, React.createElement('div', null, items.slice(1))),
	)
}

export const PopoverAdapter = createAdapter(PopoverView as ComponentType, {
	mapProps: (a2ui, ctx) => ({
		position: extractValue(a2ui.position) ?? 'bottom',
		withArrow: extractValue(a2ui.withArrow) ?? true,
		shadow: extractValue(a2ui.shadow) ?? 'md',
		children: ctx.children,
	}),
	displayName: 'PopoverAdapter',
})

export const PopoverTargetAdapter = createAdapter(asComponent(Popover.Target), {
	mapProps: (_a2ui, ctx) => ({ children: React.createElement('span', {}, ctx.children) }),
	displayName: 'PopoverTargetAdapter',
})

export const PopoverDropdownAdapter = createAdapter(asComponent(Popover.Dropdown), {
	mapProps: (_a2ui, ctx) => ({ children: ctx.children }),
	displayName: 'PopoverDropdownAdapter',
})

/** Menu adapter. The first child opens the menu; the rest are the dropdown. */
function MenuView({
	position,
	withArrow,
	shadow,
	children,
}: {
	position?: React.ComponentProps<typeof Menu>['position']
	withArrow?: boolean
	shadow?: string
	children?: React.ReactNode
}) {
	const items = childList(children)
	return React.createElement(
		Menu,
		{ position, withArrow, shadow: shadow as React.ComponentProps<typeof Menu>['shadow'] },
		React.createElement(asComponent(Menu.Target), null, React.createElement('span', null, items[0] ?? null)),
		React.createElement(asComponent(Menu.Dropdown), null, React.createElement('div', null, items.slice(1))),
	)
}

export const MenuAdapter = createAdapter(MenuView as ComponentType, {
	mapProps: (a2ui, ctx) => ({
		shadow: extractValue(a2ui.shadow) ?? 'md',
		position: extractValue(a2ui.position) ?? 'bottom-start',
		withArrow: extractValue(a2ui.withArrow) ?? false,
		children: ctx.children,
	}),
	displayName: 'MenuAdapter',
})

export const MenuTargetAdapter = createAdapter(asComponent(Menu.Target), {
	mapProps: (_a2ui, ctx) => ({ children: React.createElement('span', {}, ctx.children) }),
	displayName: 'MenuTargetAdapter',
})

export const MenuDropdownAdapter = createAdapter(asComponent(Menu.Dropdown), {
	mapProps: (_a2ui, ctx) => ({ children: ctx.children }),
	displayName: 'MenuDropdownAdapter',
})

export const MenuItemAdapter = createAdapter(asComponent(Menu.Item), {
	mapProps: (a2ui, ctx) => ({
		disabled: extractValue(a2ui.disabled) ?? false,
		color: extractValue(a2ui.color),
		onClick: createActionHandler(a2ui.action, ctx),
		children: extractValue(a2ui.label) ?? extractValue(a2ui.text) ?? ctx.children,
	}),
	displayName: 'MenuItemAdapter',
})

/** Modal/Dialog adapter */
export const ModalAdapter = createAdapter(asComponent(Paper), {
	mapProps: (a2ui, ctx) => ({
		shadow: 'lg',
		radius: 'md',
		p: 'xl',
		withBorder: true,
		children: React.createElement(React.Fragment, {}, [
			extractValue(a2ui.title) &&
				React.createElement(Title, { key: 'title', order: 3, mb: 'md' }, extractValue(a2ui.title)),
			ctx.children,
		]),
	}),
	displayName: 'ModalAdapter',
})

/** Drawer adapter - simplified as Paper */
export const DrawerAdapter = createAdapter(asComponent(Paper), {
	mapProps: (a2ui, ctx) => ({
		shadow: 'lg',
		radius: 0,
		p: 'lg',
		children: React.createElement(React.Fragment, {}, [
			extractValue(a2ui.title) &&
				React.createElement(Title, { key: 'title', order: 4, mb: 'md' }, extractValue(a2ui.title)),
			ctx.children,
		]),
	}),
	displayName: 'DrawerAdapter',
})

// ============================================================================
// NAVIGATION ADAPTERS
// ============================================================================

function tabSpecs(value: unknown): Array<{ value: string; label: string }> {
	if (!Array.isArray(value)) return []
	return value.flatMap((item) => {
		if (typeof item === 'string' && item.length > 0) return [{ value: item, label: item }]
		if (!item || typeof item !== 'object') return []
		const record = item as { value?: unknown; label?: unknown; id?: unknown; text?: unknown }
		const tabValue = typeof record.value === 'string' ? record.value : typeof record.id === 'string' ? record.id : ''
		if (!tabValue) return []
		const label =
			typeof record.label === 'string' ? record.label : typeof record.text === 'string' ? record.text : tabValue
		return [{ value: tabValue, label }]
	})
}

/** Tabs adapter. A `tabs` list builds Tabs.List; panel children stay inside Tabs. */
function TabsView({
	defaultValue,
	orientation,
	variant,
	color,
	tabs,
	children,
}: {
	defaultValue?: string | null
	orientation?: 'horizontal' | 'vertical'
	variant?: 'default' | 'outline' | 'pills'
	color?: string
	tabs?: Array<{ value: string; label: string }>
	children?: React.ReactNode
}) {
	const specs = tabs ?? []
	return React.createElement(
		Tabs,
		{
			defaultValue: defaultValue ?? specs[0]?.value ?? null,
			orientation,
			variant,
			color,
		},
		specs.length > 0
			? React.createElement(
					asComponent(Tabs.List),
					null,
					specs.map((tab) =>
						React.createElement(asComponent(Tabs.Tab), { key: tab.value, value: tab.value }, tab.label),
					),
				)
			: null,
		children,
	)
}

export const TabsAdapter = createAdapter(TabsView as ComponentType, {
	mapProps: (a2ui, ctx) => ({
		defaultValue: extractValue(a2ui.defaultValue) ?? extractValue(a2ui.defaultTab),
		orientation: extractValue(a2ui.orientation) ?? 'horizontal',
		variant: extractValue(a2ui.variant) ?? 'default',
		color: extractValue(a2ui.color),
		tabs: tabSpecs(extractValue(a2ui.tabs) ?? a2ui.tabs),
		children: ctx.children,
	}),
	displayName: 'TabsAdapter',
})

export const TabsListAdapter = createAdapter(asComponent(Tabs.List), {
	mapProps: (_a2ui, ctx) => ({ children: ctx.children }),
	displayName: 'TabsListAdapter',
})

export const TabAdapter = createAdapter(asComponent(Tabs.Tab), {
	mapProps: (a2ui, ctx) => ({
		value: extractValue(a2ui.value) ?? extractValue(a2ui.id) ?? '',
		children: extractValue(a2ui.label) ?? extractValue(a2ui.text) ?? ctx.children,
	}),
	displayName: 'TabAdapter',
})

/** TabPanel adapter */
export const TabPanelAdapter = createAdapter(asComponent(Tabs.Panel), {
	mapProps: (a2ui, ctx) => ({
		value: extractValue(a2ui.value) ?? extractValue(a2ui.id),
		children: ctx.children,
	}),
	displayName: 'TabPanelAdapter',
})

/** Breadcrumb adapter */
export const BreadcrumbAdapter = createAdapter(Breadcrumbs, {
	mapProps: (a2ui, ctx) => {
		const items = (extractValue(a2ui.items) ?? []).map((item: any, idx: number) =>
			React.createElement(
				asComponent(Anchor),
				{ href: safeHref(item.href), key: idx, size: 'sm' },
				item.label ?? item.text,
			),
		)

		return {
			separator: extractValue(a2ui.separator) ?? '/',
			children: items.length > 0 ? items : ctx.children,
		}
	},
	displayName: 'BreadcrumbAdapter',
})

/** NavLink adapter */
export const NavLinkAdapter = createAdapter(asComponent(NavLink), {
	mapProps: (a2ui, ctx) => {
		const iconName = extractValue(a2ui.icon)
		const IconComponent = getIcon(iconName)

		return {
			label: extractValue(a2ui.label) ?? extractValue(a2ui.text),
			description: extractValue(a2ui.description),
			leftSection: IconComponent ? React.createElement(IconComponent, { size: 16 }) : undefined,
			active: extractValue(a2ui.active) ?? false,
			disabled: extractValue(a2ui.disabled) ?? false,
			variant: extractValue(a2ui.variant) ?? 'subtle',
			onClick: createActionHandler(a2ui.action, ctx),
			children: ctx.children,
		}
	},
	displayName: 'NavLinkAdapter',
})

/** Pagination adapter */
export const PaginationAdapter = createAdapter(Pagination, {
	mapProps: (a2ui, ctx) => ({
		total: extractValue(a2ui.total) ?? extractValue(a2ui.pageCount) ?? 10,
		value: extractValue(a2ui.page) ?? extractValue(a2ui.currentPage) ?? 1,
		onChange: a2ui.onChange
			? (page: number) => {
					ctx.onAction({
						actionName: a2ui.onChange.name,
						sourceComponentId: ctx.componentId,
						timestamp: new Date().toISOString(),
						context: { page },
					})
				}
			: undefined,
		siblings: extractValue(a2ui.siblings) ?? 1,
		boundaries: extractValue(a2ui.boundaries) ?? 1,
		size: extractValue(a2ui.size) ?? 'sm',
		color: extractValue(a2ui.color),
		radius: extractValue(a2ui.radius) ?? 'sm',
		withEdges: extractValue(a2ui.withEdges) ?? false,
	}),
	displayName: 'PaginationAdapter',
})

/** Stepper adapter */
export const StepperAdapter = createAdapter(Stepper, {
	mapProps: (a2ui, ctx) => ({
		active: extractValue(a2ui.active) ?? extractValue(a2ui.currentStep) ?? 0,
		orientation: extractValue(a2ui.orientation) ?? 'horizontal',
		size: extractValue(a2ui.size) ?? 'sm',
		color: extractValue(a2ui.color),
		allowNextStepsSelect: extractValue(a2ui.allowNextStepsSelect) ?? false,
		children: ctx.children,
	}),
	displayName: 'StepperAdapter',
})

// ============================================================================
// DATA DISPLAY ADAPTERS
// ============================================================================

/** List adapter - renders items in a stack */
export const ListAdapter = createAdapter(Stack, {
	mapProps: (a2ui, ctx) => ({
		gap: extractValue(a2ui.gap) ?? 'sm',
		children: ctx.children,
	}),
	displayName: 'ListAdapter',
})

/** MantineList adapter - actual Mantine list component */
export const MantineListAdapter = createAdapter(MantineList, {
	mapProps: (a2ui, ctx) => ({
		type: (extractValue(a2ui.ordered) ? 'ordered' : 'unordered') as 'ordered' | 'unordered',
		size: extractValue(a2ui.size) ?? 'md',
		spacing: extractValue(a2ui.spacing) ?? 'xs',
		withPadding: extractValue(a2ui.withPadding) ?? false,
		children: ctx.children,
	}),
	displayName: 'MantineListAdapter',
})

/** Timeline adapter */
export const TimelineAdapter = createAdapter(Timeline, {
	mapProps: (a2ui, ctx) => ({
		active: extractValue(a2ui.active) ?? -1,
		bulletSize: extractValue(a2ui.bulletSize) ?? 18,
		lineWidth: extractValue(a2ui.lineWidth) ?? 2,
		color: extractValue(a2ui.color),
		children: ctx.children,
	}),
	displayName: 'TimelineAdapter',
})

/** TimelineItem adapter */
export const TimelineItemAdapter = createAdapter(Timeline.Item, {
	mapProps: (a2ui, ctx) => {
		const iconName = extractValue(a2ui.icon)
		const IconComponent = getIcon(iconName)

		return {
			title: extractValue(a2ui.title),
			bullet: IconComponent ? React.createElement(IconComponent, { size: 12 }) : undefined,
			lineVariant: extractValue(a2ui.lineVariant) ?? 'solid',
			children: ctx.children,
		}
	},
	displayName: 'TimelineItemAdapter',
})

/** Table adapter */
export const TableAdapter = createAdapter(Table, {
	mapProps: (a2ui, ctx) => ({
		striped: extractValue(a2ui.striped) ?? false,
		highlightOnHover: extractValue(a2ui.highlightOnHover) ?? true,
		withTableBorder: extractValue(a2ui.bordered) ?? extractValue(a2ui.withBorder) ?? true,
		withColumnBorders: extractValue(a2ui.columnBorders) ?? false,
		withRowBorders: extractValue(a2ui.rowBorders) ?? true,
		stickyHeader: extractValue(a2ui.stickyHeader) ?? false,
		children: ctx.children,
	}),
	displayName: 'TableAdapter',
})

/** TableHeader adapter */
export const TableHeaderAdapter = createAdapter(Table.Thead, {
	mapProps: (_, ctx) => ({
		children: ctx.children,
	}),
	displayName: 'TableHeaderAdapter',
})

/** TableBody adapter */
export const TableBodyAdapter = createAdapter(Table.Tbody, {
	mapProps: (_, ctx) => ({
		children: ctx.children,
	}),
	displayName: 'TableBodyAdapter',
})

/** TableRow adapter */
export const TableRowAdapter = createAdapter(Table.Tr, {
	mapProps: (_, ctx) => ({
		children: ctx.children,
	}),
	displayName: 'TableRowAdapter',
})

/** TableCell adapter */
export const TableCellAdapter = createAdapter(Table.Td, {
	mapProps: (a2ui, ctx) => ({
		children: extractValue(a2ui.content) ?? extractValue(a2ui.text) ?? ctx.children,
	}),
	displayName: 'TableCellAdapter',
})

/** TableHeaderCell adapter */
export const TableHeaderCellAdapter = createAdapter(Table.Th, {
	mapProps: (a2ui, ctx) => ({
		scope: 'col',
		children: extractValue(a2ui.content) ?? extractValue(a2ui.text) ?? ctx.children,
	}),
	displayName: 'TableHeaderCellAdapter',
})

/** Table head that wraps header cells in one row. Task tables use this shape. */
export const TableHeadAdapter = createAdapter(Table.Thead, {
	mapProps: (_a2ui, ctx) => ({
		children: React.createElement(Table.Tr, {}, ctx.children),
	}),
	displayName: 'TableHeadAdapter',
})

// ============================================================================
// DISCLOSURE ADAPTERS
// ============================================================================

/** Accordion adapter */
export const AccordionAdapter = createAdapter(Accordion, {
	mapProps: (a2ui, ctx) => ({
		defaultValue: extractValue(a2ui.defaultValue),
		multiple: extractValue(a2ui.multiple) ?? false,
		variant: extractValue(a2ui.variant) ?? 'default',
		radius: extractValue(a2ui.radius) ?? 'md',
		chevronPosition: extractValue(a2ui.chevronPosition) ?? 'right',
		children: ctx.children,
	}),
	displayName: 'AccordionAdapter',
})

/** AccordionItem adapter */
export const AccordionItemAdapter = createAdapter(Accordion.Item, {
	mapProps: (a2ui, ctx) => ({
		value: extractValue(a2ui.value) ?? extractValue(a2ui.id) ?? 'item',
		children: React.createElement(React.Fragment, {}, [
			React.createElement(Accordion.Control, { key: 'control' }, extractValue(a2ui.title) ?? extractValue(a2ui.label)),
			React.createElement(Accordion.Panel, { key: 'panel' }, ctx.children),
		]),
	}),
	childrenProp: null,
	displayName: 'AccordionItemAdapter',
})

// ============================================================================
// LINK ADAPTER
// ============================================================================

/** Anchor/Link adapter */
export const AnchorAdapter = createAdapter(asComponent(Anchor), {
	mapProps: (a2ui, ctx) => ({
		href: safeHref(extractValue(a2ui.href) ?? extractValue(a2ui.url)),
		target: extractValue(a2ui.target) ?? (extractValue(a2ui.external) ? '_blank' : undefined),
		rel:
			(extractValue(a2ui.target) ?? (extractValue(a2ui.external) ? '_blank' : undefined)) === '_blank'
				? 'noopener noreferrer'
				: undefined,
		underline: extractValue(a2ui.underline) ?? 'hover',
		size: extractValue(a2ui.size) ?? 'sm',
		c: extractValue(a2ui.color),
		children: extractValue(a2ui.label) ?? extractValue(a2ui.text) ?? ctx.children,
	}),
	displayName: 'AnchorAdapter',
})

// ============================================================================
// CHARTS AND CUSTOM VISUALS
// ============================================================================

const NO_CHART = 'No chart data'

function chartHeight(value: unknown): number {
	const height = asNumber(value, 220)
	return height > 0 ? height : 220
}

function barChartType(value: unknown): 'default' | 'stacked' | 'percent' | 'waterfall' {
	const type = asString(value, 'default')
	if (type === 'stacked' || type === 'percent' || type === 'waterfall') return type
	return 'default'
}

function areaChartType(value: unknown): 'default' | 'stacked' | 'percent' | 'split' | 'stream' {
	const type = asString(value, 'default')
	if (type === 'stacked' || type === 'percent' || type === 'split' || type === 'stream') return type
	return 'default'
}

function chartOrientation(value: unknown): 'horizontal' | 'vertical' {
	return asString(value) === 'vertical' ? 'vertical' : 'horizontal'
}

function BarChartView({
	data,
	dataKey,
	series,
	type,
	orientation,
	height,
	withLegend,
}: {
	data: Array<Record<string, string | number>>
	dataKey: string
	series: Array<{ name: string; color: string; label?: string }>
	type: 'default' | 'stacked' | 'percent' | 'waterfall'
	orientation: 'horizontal' | 'vertical'
	height: number
	withLegend: boolean
}) {
	if (data.length === 0 || series.length === 0) {
		return React.createElement(asComponent(Text), { size: 'sm', c: 'dimmed' }, NO_CHART)
	}
	return React.createElement(BarChart, {
		data,
		dataKey,
		series,
		type,
		orientation,
		h: height,
		mih: height,
		withLegend,
		withTooltip: true,
	})
}

/** Bar chart. `series.name` selects a numeric field on each `data` row. */
export const BarChartAdapter = createAdapter(BarChartView, {
	mapProps: (a2ui) => ({
		data: barRows(a2ui.data),
		dataKey: asString(a2ui.dataKey, 'name'),
		series: chartSeries(a2ui.series),
		type: barChartType(a2ui.type),
		orientation: chartOrientation(a2ui.orientation),
		height: chartHeight(a2ui.height),
		withLegend: asBoolean(a2ui.withLegend, true),
	}),
	displayName: 'BarChartAdapter',
})

function DonutChartView({
	data,
	chartLabel,
	withLabels,
	withLegend,
	thickness,
	size,
}: {
	data: Array<{ name: string; value: number; color: string }>
	chartLabel?: string
	withLabels: boolean
	withLegend: boolean
	thickness: number
	size: number
}) {
	const slices = data.filter((slice) => slice.value > 0)
	if (slices.length === 0) return React.createElement(asComponent(Text), { size: 'sm', c: 'dimmed' }, NO_CHART)
	return React.createElement(DonutChart, {
		data: slices,
		chartLabel,
		withLabels,
		withLegend,
		withTooltip: true,
		thickness,
		size,
	})
}

/** Donut chart. Each `data` item is a named slice with a value and a theme color. */
export const DonutChartAdapter = createAdapter(DonutChartView, {
	mapProps: (a2ui) => ({
		data: sliceData(a2ui.data),
		chartLabel: asString(a2ui.chartLabel) || undefined,
		withLabels: asBoolean(a2ui.withLabels, false),
		withLegend: asBoolean(a2ui.withLegend, true),
		thickness: asNumber(a2ui.thickness, 20),
		size: asNumber(a2ui.size, 160),
	}),
	displayName: 'DonutChartAdapter',
})

function PieChartView({
	data,
	withLabels,
	withLegend,
	size,
}: {
	data: Array<{ name: string; value: number; color: string }>
	withLabels: boolean
	withLegend: boolean
	size: number
}) {
	const slices = data.filter((slice) => slice.value > 0)
	if (slices.length === 0) return React.createElement(asComponent(Text), { size: 'sm', c: 'dimmed' }, NO_CHART)
	return React.createElement(PieChart, { data: slices, withLabels, withLegend, withTooltip: true, size })
}

/** Pie chart. Same slice shape as the donut, drawn as a filled pie. */
export const PieChartAdapter = createAdapter(PieChartView, {
	mapProps: (a2ui) => ({
		data: sliceData(a2ui.data),
		withLabels: asBoolean(a2ui.withLabels, false),
		withLegend: asBoolean(a2ui.withLegend, true),
		size: asNumber(a2ui.size, 160),
	}),
	displayName: 'PieChartAdapter',
})

function LineChartView({
	data,
	dataKey,
	series,
	height,
	withLegend,
}: {
	data: Array<Record<string, string | number>>
	dataKey: string
	series: Array<{ name: string; color: string; label?: string }>
	height: number
	withLegend: boolean
}) {
	if (data.length === 0 || series.length === 0) {
		return React.createElement(asComponent(Text), { size: 'sm', c: 'dimmed' }, NO_CHART)
	}
	return React.createElement(LineChart, {
		data,
		dataKey,
		series,
		h: height,
		mih: height,
		withLegend,
		withTooltip: true,
		curveType: 'monotone',
	})
}

/** Line chart for a numeric series across ordered rows. */
export const LineChartAdapter = createAdapter(LineChartView, {
	mapProps: (a2ui) => ({
		data: barRows(a2ui.data),
		dataKey: asString(a2ui.dataKey, 'name'),
		series: chartSeries(a2ui.series),
		height: chartHeight(a2ui.height),
		withLegend: asBoolean(a2ui.withLegend, true),
	}),
	displayName: 'LineChartAdapter',
})

function AreaChartView({
	data,
	dataKey,
	series,
	type,
	height,
	withLegend,
}: {
	data: Array<Record<string, string | number>>
	dataKey: string
	series: Array<{ name: string; color: string; label?: string }>
	type: 'default' | 'stacked' | 'percent' | 'split' | 'stream'
	height: number
	withLegend: boolean
}) {
	if (data.length === 0 || series.length === 0) {
		return React.createElement(asComponent(Text), { size: 'sm', c: 'dimmed' }, NO_CHART)
	}
	return React.createElement(AreaChart, {
		data,
		dataKey,
		series,
		type,
		h: height,
		mih: height,
		withLegend,
		withTooltip: true,
		curveType: 'monotone',
	})
}

/** Area chart. `type` can stack series when more than one is named. */
export const AreaChartAdapter = createAdapter(AreaChartView, {
	mapProps: (a2ui) => ({
		data: barRows(a2ui.data),
		dataKey: asString(a2ui.dataKey, 'name'),
		series: chartSeries(a2ui.series),
		type: areaChartType(a2ui.type),
		height: chartHeight(a2ui.height),
		withLegend: asBoolean(a2ui.withLegend, true),
	}),
	displayName: 'AreaChartAdapter',
})

function SparklineView({ data, color, height }: { data: number[]; color: string; height: number }) {
	if (data.length < 2) return React.createElement(asComponent(Text), { size: 'sm', c: 'dimmed' }, NO_CHART)
	return React.createElement(Sparkline, { data, color, h: height, curveType: 'monotone' })
}

/** Compact trend line. `data` is a list of numbers. */
export const SparklineAdapter = createAdapter(SparklineView, {
	mapProps: (a2ui) => ({
		data: numberList(a2ui.data),
		color: asString(a2ui.color, 'teal'),
		height: chartHeight(a2ui.height ?? 48),
	}),
	displayName: 'SparklineAdapter',
})

function StatCardView({
	label,
	value,
	delta,
	deltaColor,
	icon,
	color,
	sparkline,
	ring,
}: {
	label: string
	value: string
	delta?: string
	deltaColor: string
	icon?: string
	color: string
	sparkline: number[]
	ring?: number
}) {
	const IconComponent = getIcon(icon)
	const ringValue = typeof ring === 'number' ? Math.min(Math.max(ring, 0), 100) : undefined
	return React.createElement(
		asComponent(Card),
		{ withBorder: true, padding: 'md', radius: 'md' },
		React.createElement(
			Group,
			{ justify: 'space-between', align: 'flex-start', wrap: 'nowrap', gap: 'sm' },
			React.createElement(
				Stack,
				{ gap: 4 },
				React.createElement(asComponent(Text), { size: 'xs', c: 'dimmed', tt: 'uppercase', fw: 700 }, label),
				React.createElement(Title, { order: 3 }, value),
				delta
					? React.createElement(asComponent(Badge), { variant: 'light', color: deltaColor, tt: 'none' }, delta)
					: null,
			),
			IconComponent
				? React.createElement(
						ThemeIcon,
						{ variant: 'light', color, size: 'lg', radius: 'md' },
						React.createElement(IconComponent, { size: 20 }),
					)
				: ringValue !== undefined
					? React.createElement(RingProgress, {
							size: 64,
							thickness: 6,
							roundCaps: true,
							sections: [{ value: ringValue, color }],
						})
					: null,
		),
		sparkline.length >= 2
			? React.createElement(Sparkline, { data: sparkline, color, h: 40, mt: 'sm', curveType: 'monotone' })
			: null,
	)
}

/**
 * Purpose-built metric card: a label, a prominent value, an optional delta,
 * and either a theme icon, a ring, or a sparkline.
 */
export const StatCardAdapter = createAdapter(StatCardView, {
	mapProps: (a2ui) => {
		const ring = unwrap(a2ui.ring)
		return {
			label: asString(a2ui.label, 'Metric'),
			value: asString(a2ui.value ?? a2ui.metric, '—'),
			delta: asString(a2ui.delta) || undefined,
			deltaColor: asString(a2ui.deltaColor, 'gray'),
			icon: asString(a2ui.icon) || undefined,
			color: asString(a2ui.color, 'teal'),
			sparkline: numberList(a2ui.sparkline),
			ring: typeof ring === 'number' && Number.isFinite(ring) ? ring : undefined,
		}
	},
	displayName: 'StatCardAdapter',
})

function DistributionBarView({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
	const visible = segments.filter((segment) => segment.value > 0)
	const total = visible.reduce((sum, segment) => sum + segment.value, 0)
	if (total <= 0) return React.createElement(asComponent(Text), { size: 'sm', c: 'dimmed' }, NO_CHART)
	return React.createElement(
		Stack,
		{ gap: 'xs' },
		React.createElement(
			Progress.Root,
			{ size: 'lg', radius: 'xl' },
			visible.map((segment) =>
				React.createElement(Progress.Section, {
					key: segment.label,
					value: (segment.value / total) * 100,
					color: segment.color,
				}),
			),
		),
		React.createElement(
			Group,
			{ gap: 'xs' },
			visible.map((segment) =>
				React.createElement(
					asComponent(Badge),
					{ key: segment.label, variant: 'light', color: segment.color, tt: 'none' },
					`${segment.label} ${segment.value}`,
				),
			),
		),
	)
}

/** Segmented proportion bar. Each segment is a labeled count drawn as a share of the total. */
export const DistributionBarAdapter = createAdapter(DistributionBarView, {
	mapProps: (a2ui) => ({
		segments: chartRows(a2ui.segments ?? a2ui.data).flatMap((row) => {
			const label = asString(row.label) || asString(row.name)
			if (!label) return []
			return [{ label, value: asNumber(row.value, 0), color: asString(row.color, 'blue') }]
		}),
	}),
	displayName: 'DistributionBarAdapter',
})
