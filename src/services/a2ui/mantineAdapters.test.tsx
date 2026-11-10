import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
	BarChartAdapter,
	DateTimeInputAdapter,
	DistributionBarAdapter,
	DonutChartAdapter,
	PasswordInputAdapter,
	PinInputAdapter,
	PopoverAdapter,
	StatCardAdapter,
	TabsAdapter,
} from '@/services/a2ui/mantineAdapters'

describe('secret field adapters', () => {
	it('does not copy a password into an action', () => {
		const onAction = vi.fn()
		render(
			<MantineProvider>
				<PasswordInputAdapter
					node={{
						id: 'secret',
						type: 'PasswordInput',
						properties: {
							label: { literalString: 'Password' },
							onChange: { name: 'save-password' },
						},
					}}
					onAction={onAction}
					surfaceId="@default"
					components={{}}
				/>
			</MantineProvider>,
		)

		fireEvent.change(screen.getByLabelText('Password'), { target: { value: 's3cret-value' } })

		expect(onAction).not.toHaveBeenCalled()
		expect(JSON.stringify(onAction.mock.calls)).not.toContain('s3cret-value')
	})

	it('does not copy a completed PIN into an action', () => {
		const onAction = vi.fn()
		const view = render(
			<MantineProvider>
				<PinInputAdapter
					node={{
						id: 'secret',
						type: 'PinInput',
						properties: {
							length: { literalNumber: 4 },
							onComplete: { name: 'save-pin' },
						},
					}}
					onAction={onAction}
					surfaceId="@default"
					components={{}}
				/>
			</MantineProvider>,
		)

		const inputs = view.container.querySelectorAll('input')
		expect(inputs.length).toBeGreaterThan(0)
		for (const [index, input] of inputs.entries()) {
			fireEvent.change(input, { target: { value: String(index + 1) } })
		}

		expect(onAction).not.toHaveBeenCalled()
		expect(JSON.stringify(onAction.mock.calls)).not.toContain('1234')
	})

	it('associates a date input with its label', () => {
		render(
			<MantineProvider>
				<DateTimeInputAdapter
					node={{
						id: 'due',
						type: 'DateTimeInput',
						properties: { label: { literalString: 'Due date' }, required: { literalBool: true } },
					}}
					onAction={vi.fn()}
					surfaceId="@default"
					components={{}}
				/>
			</MantineProvider>,
		)
		expect(screen.getByLabelText(/Due date/)).toBeTruthy()
	})

	it('puts popover content in a dropdown and tab labels in a tab list', async () => {
		render(
			<MantineProvider>
				<PopoverAdapter
					node={{ id: 'pop', type: 'Popover', properties: {} }}
					onAction={vi.fn()}
					surfaceId="@default"
					components={{}}
				>
					<button type="button">Open menu</button>
					<span>Hidden note</span>
				</PopoverAdapter>
				<TabsAdapter
					node={{
						id: 'tabs',
						type: 'Tabs',
						properties: {
							defaultValue: { literalString: 'one' },
							tabs: [{ value: 'one', label: 'First tab' }],
						},
					}}
					onAction={vi.fn()}
					surfaceId="@default"
					components={{}}
				>
					<span>Panel copy</span>
				</TabsAdapter>
			</MantineProvider>,
		)
		expect(screen.getByRole('tab', { name: 'First tab' })).toBeTruthy()
		expect(screen.getByText('Panel copy')).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
		expect(await screen.findByText('Hidden note')).toBeTruthy()
	})
})

describe('chart and custom visual adapters', () => {
	it('renders a stat card with its metric and delta', () => {
		render(
			<MantineProvider>
				<StatCardAdapter
					node={{
						id: 'total',
						type: 'StatCard',
						properties: {
							label: { literalString: 'Total' },
							value: { literalString: '12' },
							delta: { literalString: '4 done' },
							icon: { literalString: 'layers' },
							color: { literalString: 'teal' },
						},
					}}
					onAction={vi.fn()}
					surfaceId="@default"
					components={{}}
				/>
			</MantineProvider>,
		)
		expect(screen.getByText('Total')).toBeTruthy()
		expect(screen.getByText('12')).toBeTruthy()
		expect(screen.getByText('4 done')).toBeTruthy()
	})

	it('draws a distribution bar from labeled counts', () => {
		render(
			<MantineProvider>
				<DistributionBarAdapter
					node={{
						id: 'mix',
						type: 'DistributionBar',
						properties: {
							segments: [
								{
									label: { literalString: 'Pending' },
									value: { literalNumber: 3 },
									color: { literalString: 'yellow' },
								},
								{ label: { literalString: 'Done' }, value: { literalNumber: 1 }, color: { literalString: 'green' } },
							],
						},
					}}
					onAction={vi.fn()}
					surfaceId="@default"
					components={{}}
				/>
			</MantineProvider>,
		)
		expect(screen.getByText('Pending 3')).toBeTruthy()
		expect(screen.getByText('Done 1')).toBeTruthy()
	})

	it('says when a chart has no slices or rows', () => {
		render(
			<MantineProvider>
				<DonutChartAdapter
					node={{ id: 'empty-donut', type: 'DonutChart', properties: { data: [] } }}
					onAction={vi.fn()}
					surfaceId="@default"
					components={{}}
				/>
				<BarChartAdapter
					node={{ id: 'empty-bar', type: 'BarChart', properties: { data: [], series: [] } }}
					onAction={vi.fn()}
					surfaceId="@default"
					components={{}}
				/>
			</MantineProvider>,
		)
		expect(screen.getAllByText('No chart data')).toHaveLength(2)
	})
})
