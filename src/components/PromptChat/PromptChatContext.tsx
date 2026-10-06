import { clientTools, createChatClientOptions } from '@tanstack/ai-client'
import type { UIMessage } from '@tanstack/ai-react'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useRouter } from '@tanstack/react-router'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { invalidateRouterToolDef, navigateToolDef } from '../../services/ai/tools'
import type { BrowserContext } from '../../types'
import { captureBrowserContext } from '../../utils/browserContext'
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
		const path = args.to.startsWith('/') ? args.to : `/${args.to}`
		const params = new URLSearchParams()
		if (args.search) {
			for (const [key, value] of Object.entries(args.search)) {
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

	const browserContextRef = useRef<BrowserContext | null>(null)

	const connection = useMemo(
		() =>
			fetchServerSentEvents('/api/chat', () => ({
				body: {
					browserContext: browserContextRef.current ?? captureBrowserContext(),
				},
			})),
		[],
	)

	const chatOptions = createChatClientOptions({ connection, tools })

	const { messages, sendMessage, isLoading, error, clear, stop } = useChat(chatOptions)

	const handleSubmit = useCallback(() => {
		if (!input.trim() || isLoading) return
		browserContextRef.current = captureBrowserContext()
		void sendMessage(input).finally(() => {
			browserContextRef.current = null
		})
		setInput('')
	}, [input, isLoading, sendMessage])

	const sendPrompt = useCallback(
		(text: string) => {
			if (!text.trim() || isLoading) return
			browserContextRef.current = captureBrowserContext()
			void sendMessage(text).finally(() => {
				browserContextRef.current = null
			})
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
