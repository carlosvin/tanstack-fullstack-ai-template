import { clientTools, createChatClientOptions } from '@tanstack/ai-client'
import type { UIMessage } from '@tanstack/ai-react'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useRouter } from '@tanstack/react-router'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { invalidateRouterToolDef, NavigateInputSchema, navigateToolDef } from '../../services/ai/tools'
import { toInternalRouterLinkTarget } from '../../utils/internalLinks'

export interface PromptChatContextValue {
	messages: UIMessage[]
	isLoading: boolean
	error: Error | null
	input: string
	setInput: (value: string) => void
	sendMessage: (text: string) => void
	handleSubmit: () => void
	handleKeyDown: (e: React.KeyboardEvent) => void
	stop: () => void
	clear: () => void
}

const PromptChatContext = createContext<PromptChatContextValue | null>(null)

export function usePromptChat(): PromptChatContextValue {
	const ctx = useContext(PromptChatContext)
	if (!ctx) {
		throw new Error('usePromptChat must be used within PromptChatProvider')
	}
	return ctx
}

export function PromptChatProvider({ children }: { children: ReactNode }) {
	const [input, setInput] = useState('')
	const router = useRouter()

	const navigateClient = navigateToolDef.client((args) => {
		const parsed = NavigateInputSchema.safeParse(args)
		if (!parsed.success) return { success: false }
		const navInput = parsed.data
		const path = navInput.to.startsWith('/') ? navInput.to : `/${navInput.to}`
		const params = new URLSearchParams()
		if (navInput.search) {
			for (const [key, value] of Object.entries(navInput.search)) {
				if (value !== undefined) params.set(key, value)
			}
		}
		const query = params.toString()
		const href = query ? `${path}?${query}` : path
		const linkTarget = toInternalRouterLinkTarget(href)
		if (!linkTarget) return { success: false }
		router.navigate({
			to: linkTarget.to,
			...(linkTarget.params ? { params: linkTarget.params } : {}),
			...(linkTarget.search ? { search: linkTarget.search } : {}),
		})
		return { success: true }
	})

	const invalidateClient = invalidateRouterToolDef.client(() => {
		router.invalidate()
		return { success: true }
	})

	const tools = clientTools(navigateClient, invalidateClient)

	const connection = useMemo(
		() =>
			fetchServerSentEvents('/api/chat', () => ({
				body: {
					browserContext: {
						timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						locale: navigator.language,
						currentTime: new Date().toISOString(),
						currentPathname: window.location.pathname,
						currentSearch: window.location.search,
						currentHref: window.location.href,
					},
				},
			})),
		[],
	)

	const chatOptions = createChatClientOptions({ connection, tools })

	const { messages, sendMessage, isLoading, error, clear, stop } = useChat(chatOptions)

	const handleSubmit = useCallback(() => {
		if (!input.trim() || isLoading) return
		sendMessage(input)
		setInput('')
	}, [input, isLoading, sendMessage])

	const sendPrompt = useCallback(
		(text: string) => {
			if (!text.trim() || isLoading) return
			sendMessage(text)
		},
		[isLoading, sendMessage],
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				handleSubmit()
			}
		},
		[handleSubmit],
	)

	const value = useMemo<PromptChatContextValue>(
		() => ({
			messages,
			isLoading,
			error: error ?? null,
			input,
			setInput,
			sendMessage: sendPrompt,
			handleSubmit,
			handleKeyDown,
			stop,
			clear,
		}),
		[messages, isLoading, error, input, sendPrompt, handleSubmit, handleKeyDown, stop, clear],
	)

	return <PromptChatContext.Provider value={value}>{children}</PromptChatContext.Provider>
}
