/**
 * Mantine 9 catalog for agentic A2UI surfaces.
 *
 * Every A2UI component type that has a Mantine adapter is registered here,
 * including the aliases from the bridge catalog. A type that is not in this
 * map renders nothing.
 */

import { createComponentMapping } from '@a2ui-bridge/react'

import {
	// Disclosure
	AccordionAdapter,
	AccordionItemAdapter,
	ActionIconAdapter,
	// Feedback
	AlertAdapter,
	// Links
	AnchorAdapter,
	AspectRatioAdapter,
	// Images
	AvatarAdapter,
	// Badges
	BadgeAdapter,
	BlockquoteAdapter,
	BoxAdapter,
	BreadcrumbAdapter,
	// Buttons
	ButtonAdapter,
	// Surfaces
	CardAdapter,
	CenterAdapter,
	// Selection Inputs
	CheckboxAdapter,
	ChipAdapter,
	CodeAdapter,
	ColorInputAdapter,
	ColumnAdapter,
	ContainerAdapter,
	DateTimeInputAdapter,
	DividerAdapter,
	DrawerAdapter,
	FieldsetAdapter,
	FileInputAdapter,
	FlexAdapter,
	GridAdapter,
	HighlightAdapter,
	ImageAdapter,
	IndicatorAdapter,
	// Text Inputs
	InputAdapter,
	// Data Display
	ListAdapter,
	MantineListAdapter,
	MarkAdapter,
	MenuAdapter,
	ModalAdapter,
	MultiSelectAdapter,
	NavLinkAdapter,
	NotificationAdapter,
	NumberInputAdapter,
	PaginationAdapter,
	PaperAdapter,
	PasswordInputAdapter,
	PinInputAdapter,
	PopoverAdapter,
	ProgressAdapter,
	RadioGroupAdapter,
	RangeSliderAdapter,
	RatingAdapter,
	RingProgressAdapter,
	// Layout
	RowAdapter,
	ScrollAreaAdapter,
	SegmentedControlAdapter,
	SelectAdapter,
	SkeletonAdapter,
	// Sliders
	SliderAdapter,
	SpaceAdapter,
	SpinnerAdapter,
	SpoilerAdapter,
	StepperAdapter,
	SwitchAdapter,
	TableAdapter,
	TableBodyAdapter,
	TableCellAdapter,
	TableHeadAdapter,
	TableHeaderAdapter,
	TableHeaderCellAdapter,
	TableRowAdapter,
	TabPanelAdapter,
	// Navigation
	TabsAdapter,
	// Typography
	TextAdapter,
	TextAreaAdapter,
	TextFieldAdapter,
	ThemeIconAdapter,
	TimelineAdapter,
	TimelineItemAdapter,
	TitleAdapter,
	// Overlays
	TooltipAdapter,
} from './mantineAdapters.ts'

/**
 * Complete Mantine component mapping for A2UI.
 * Includes comprehensive case variants and semantic aliases.
 */
function UnknownA2uiNode() {
	return null
}

export const mantineTaskCatalog = createComponentMapping(
	{
		// Layout - Primary
		Row: RowAdapter,
		Column: ColumnAdapter,
		Flex: FlexAdapter,
		Grid: GridAdapter,
		SimpleGrid: GridAdapter,
		Center: CenterAdapter,
		Box: BoxAdapter,
		Space: SpaceAdapter,
		Container: ContainerAdapter,
		AspectRatio: AspectRatioAdapter,

		// Layout - Case variants
		row: RowAdapter,
		column: ColumnAdapter,
		flex: FlexAdapter,
		grid: GridAdapter,
		simpleGrid: GridAdapter,
		center: CenterAdapter,
		box: BoxAdapter,
		space: SpaceAdapter,
		container: ContainerAdapter,

		// Layout - Aliases
		Stack: ColumnAdapter,
		stack: ColumnAdapter,
		HStack: RowAdapter,
		hstack: RowAdapter,
		VStack: ColumnAdapter,
		vstack: ColumnAdapter,
		Group: RowAdapter,
		group: RowAdapter,

		// Surfaces - Primary
		Card: CardAdapter,
		Paper: PaperAdapter,
		Fieldset: FieldsetAdapter,
		Divider: DividerAdapter,
		ScrollArea: ScrollAreaAdapter,

		// Surfaces - Case variants & Aliases
		card: CardAdapter,
		paper: PaperAdapter,
		fieldset: FieldsetAdapter,
		divider: DividerAdapter,
		scrollArea: ScrollAreaAdapter,
		Separator: DividerAdapter,
		separator: DividerAdapter,
		Section: PaperAdapter,
		section: PaperAdapter,
		Panel: PaperAdapter,
		panel: PaperAdapter,

		// Typography - Primary
		Text: TextAdapter,
		Title: TitleAdapter,
		Heading: TitleAdapter,
		Code: CodeAdapter,
		Blockquote: BlockquoteAdapter,
		Highlight: HighlightAdapter,
		Mark: MarkAdapter,
		Spoiler: SpoilerAdapter,

		// Typography - Case variants & Aliases
		text: TextAdapter,
		title: TitleAdapter,
		heading: TitleAdapter,
		code: CodeAdapter,
		blockquote: BlockquoteAdapter,
		highlight: HighlightAdapter,
		mark: MarkAdapter,
		spoiler: SpoilerAdapter,
		H1: TitleAdapter,
		H2: TitleAdapter,
		H3: TitleAdapter,
		H4: TitleAdapter,
		H5: TitleAdapter,
		H6: TitleAdapter,
		h1: TitleAdapter,
		h2: TitleAdapter,
		h3: TitleAdapter,
		h4: TitleAdapter,
		h5: TitleAdapter,
		h6: TitleAdapter,
		Paragraph: TextAdapter,
		paragraph: TextAdapter,
		Label: TextAdapter,
		label: TextAdapter,

		// Badges & Indicators - Primary
		Badge: BadgeAdapter,
		Indicator: IndicatorAdapter,
		ThemeIcon: ThemeIconAdapter,
		Icon: ThemeIconAdapter,

		// Badges - Case variants & Aliases
		badge: BadgeAdapter,
		indicator: IndicatorAdapter,
		themeIcon: ThemeIconAdapter,
		icon: ThemeIconAdapter,
		Tag: BadgeAdapter,
		tag: BadgeAdapter,
		Chip: ChipAdapter,
		chip: ChipAdapter,
		Status: BadgeAdapter,
		status: BadgeAdapter,

		// Images - Primary
		Avatar: AvatarAdapter,
		Image: ImageAdapter,

		// Images - Case variants & Aliases
		avatar: AvatarAdapter,
		image: ImageAdapter,
		Img: ImageAdapter,
		img: ImageAdapter,
		ProfileImage: AvatarAdapter,
		profileImage: AvatarAdapter,

		// Buttons - Primary
		Button: ButtonAdapter,
		ActionIcon: ActionIconAdapter,
		IconButton: ActionIconAdapter,

		// Buttons - Case variants & Aliases
		button: ButtonAdapter,
		actionIcon: ActionIconAdapter,
		iconButton: ActionIconAdapter,
		Btn: ButtonAdapter,
		btn: ButtonAdapter,

		// Text Inputs - Primary
		Input: InputAdapter,
		TextField: TextFieldAdapter,
		TextInput: TextFieldAdapter,
		TextArea: TextAreaAdapter,
		Textarea: TextAreaAdapter,
		DateTimeInput: DateTimeInputAdapter,
		NumberInput: NumberInputAdapter,
		PasswordInput: PasswordInputAdapter,
		ColorInput: ColorInputAdapter,
		FileInput: FileInputAdapter,
		PinInput: PinInputAdapter,

		// Text Inputs - Case variants & Aliases
		input: InputAdapter,
		textField: TextFieldAdapter,
		textInput: TextFieldAdapter,
		textArea: TextAreaAdapter,
		textarea: TextAreaAdapter,
		dateTimeInput: DateTimeInputAdapter,
		dateInput: DateTimeInputAdapter,
		DatePicker: DateTimeInputAdapter,
		datePicker: DateTimeInputAdapter,
		DateInput: DateTimeInputAdapter,
		numberInput: NumberInputAdapter,
		passwordInput: PasswordInputAdapter,
		colorInput: ColorInputAdapter,
		fileInput: FileInputAdapter,
		pinInput: PinInputAdapter,
		Password: PasswordInputAdapter,
		password: PasswordInputAdapter,
		Number: NumberInputAdapter,
		number: NumberInputAdapter,
		File: FileInputAdapter,
		file: FileInputAdapter,
		Color: ColorInputAdapter,
		color: ColorInputAdapter,
		OTP: PinInputAdapter,
		otp: PinInputAdapter,
		PIN: PinInputAdapter,
		pin: PinInputAdapter,

		// Selection Inputs - Primary
		Checkbox: CheckboxAdapter,
		CheckBox: CheckboxAdapter,
		Switch: SwitchAdapter,
		RadioGroup: RadioGroupAdapter,
		Radio: RadioGroupAdapter,
		Select: SelectAdapter,
		MultiSelect: MultiSelectAdapter,
		SegmentedControl: SegmentedControlAdapter,

		// Selection Inputs - Case variants & Aliases
		checkbox: CheckboxAdapter,
		switch: SwitchAdapter,
		radioGroup: RadioGroupAdapter,
		radio: RadioGroupAdapter,
		select: SelectAdapter,
		multiSelect: MultiSelectAdapter,
		segmentedControl: SegmentedControlAdapter,
		Toggle: SwitchAdapter,
		toggle: SwitchAdapter,
		Dropdown: SelectAdapter,
		dropdown: SelectAdapter,
		ComboBox: SelectAdapter,
		combobox: SelectAdapter,
		Combobox: SelectAdapter,
		MultiDropdown: MultiSelectAdapter,
		multiDropdown: MultiSelectAdapter,
		ButtonGroup: SegmentedControlAdapter,
		buttonGroup: SegmentedControlAdapter,

		// Sliders - Primary
		Slider: SliderAdapter,
		RangeSlider: RangeSliderAdapter,
		Rating: RatingAdapter,

		// Sliders - Case variants & Aliases
		slider: SliderAdapter,
		rangeSlider: RangeSliderAdapter,
		rating: RatingAdapter,
		Range: RangeSliderAdapter,
		range: RangeSliderAdapter,
		Stars: RatingAdapter,
		stars: RatingAdapter,

		// Feedback - Primary
		Alert: AlertAdapter,
		Notification: NotificationAdapter,
		Progress: ProgressAdapter,
		RingProgress: RingProgressAdapter,
		Spinner: SpinnerAdapter,
		Loader: SpinnerAdapter,
		Skeleton: SkeletonAdapter,

		// Feedback - Case variants & Aliases
		alert: AlertAdapter,
		notification: NotificationAdapter,
		progress: ProgressAdapter,
		ringProgress: RingProgressAdapter,
		spinner: SpinnerAdapter,
		loader: SpinnerAdapter,
		skeleton: SkeletonAdapter,
		Toast: NotificationAdapter,
		toast: NotificationAdapter,
		Message: AlertAdapter,
		message: AlertAdapter,
		Banner: AlertAdapter,
		banner: AlertAdapter,
		ProgressBar: ProgressAdapter,
		progressBar: ProgressAdapter,
		CircularProgress: RingProgressAdapter,
		circularProgress: RingProgressAdapter,
		Loading: SpinnerAdapter,
		loading: SpinnerAdapter,

		// Overlays - Primary
		Tooltip: TooltipAdapter,
		Popover: PopoverAdapter,
		Menu: MenuAdapter,
		Modal: ModalAdapter,
		Dialog: ModalAdapter,
		Drawer: DrawerAdapter,

		// Overlays - Case variants & Aliases
		tooltip: TooltipAdapter,
		popover: PopoverAdapter,
		menu: MenuAdapter,
		modal: ModalAdapter,
		dialog: ModalAdapter,
		drawer: DrawerAdapter,
		Popup: PopoverAdapter,
		popup: PopoverAdapter,
		Sidebar: DrawerAdapter,
		sidebar: DrawerAdapter,

		// Navigation - Primary
		Tabs: TabsAdapter,
		TabsNav: TabsAdapter,
		TabPanel: TabPanelAdapter,
		Breadcrumb: BreadcrumbAdapter,
		Breadcrumbs: BreadcrumbAdapter,
		NavLink: NavLinkAdapter,
		Pagination: PaginationAdapter,
		Stepper: StepperAdapter,

		// Navigation - Case variants & Aliases
		tabs: TabsAdapter,
		tabPanel: TabPanelAdapter,
		breadcrumb: BreadcrumbAdapter,
		breadcrumbs: BreadcrumbAdapter,
		navLink: NavLinkAdapter,
		pagination: PaginationAdapter,
		stepper: StepperAdapter,
		NavigationLink: NavLinkAdapter,
		navigationLink: NavLinkAdapter,
		Pager: PaginationAdapter,
		pager: PaginationAdapter,
		Steps: StepperAdapter,
		steps: StepperAdapter,
		Wizard: StepperAdapter,
		wizard: StepperAdapter,

		// Data Display - Primary
		List: ListAdapter,
		MantineList: MantineListAdapter,
		Timeline: TimelineAdapter,
		TimelineItem: TimelineItemAdapter,
		Table: TableAdapter,
		TableHead: TableHeadAdapter,
		TableHeader: TableHeaderAdapter,
		TableBody: TableBodyAdapter,
		TableRow: TableRowAdapter,
		TableCell: TableCellAdapter,
		TableHeaderCell: TableHeaderCellAdapter,

		// Data Display - Case variants & Aliases
		list: ListAdapter,
		timeline: TimelineAdapter,
		timelineItem: TimelineItemAdapter,
		table: TableAdapter,
		tableHeader: TableHeaderAdapter,
		tableBody: TableBodyAdapter,
		tableRow: TableRowAdapter,
		tableCell: TableCellAdapter,
		tableHeaderCell: TableHeaderCellAdapter,
		DataTable: TableAdapter,
		dataTable: TableAdapter,
		THead: TableHeaderAdapter,
		thead: TableHeaderAdapter,
		TBody: TableBodyAdapter,
		tbody: TableBodyAdapter,
		TR: TableRowAdapter,
		tr: TableRowAdapter,
		TD: TableCellAdapter,
		td: TableCellAdapter,
		TH: TableHeaderCellAdapter,
		th: TableHeaderCellAdapter,

		// Disclosure - Primary
		Accordion: AccordionAdapter,
		AccordionItem: AccordionItemAdapter,

		// Disclosure - Case variants & Aliases
		accordion: AccordionAdapter,
		accordionItem: AccordionItemAdapter,
		Collapsible: AccordionAdapter,
		collapsible: AccordionAdapter,
		Expandable: AccordionAdapter,
		expandable: AccordionAdapter,

		// Links - Primary
		Anchor: AnchorAdapter,
		Link: AnchorAdapter,

		// Links - Case variants
		anchor: AnchorAdapter,
		link: AnchorAdapter,
		A: AnchorAdapter,
		a: AnchorAdapter,
	},
	UnknownA2uiNode,
)

export const A2UI_COMPONENT_TYPES = Object.keys(mantineTaskCatalog).filter((type) => type !== '__fallback__')

export type A2uiComponentType = string

const ALLOWED = new Set<string>(A2UI_COMPONENT_TYPES)

export function isAllowedA2uiComponent(type: string): type is A2uiComponentType {
	return ALLOWED.has(type)
}
