import { Link as RouterLink } from '@tanstack/react-router'
import { isInternalPath, toInternalRouterLinkTarget } from '../../utils/internalLinks'

export function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
	if (!href) return <span>{children}</span>

	const linkTarget = toInternalRouterLinkTarget(href)
	if (linkTarget) {
		return (
			<RouterLink
				to={linkTarget.to}
				{...(linkTarget.params ? { params: linkTarget.params } : {})}
				{...(linkTarget.search ? { search: linkTarget.search } : {})}
				preload="intent"
				style={{ color: 'inherit', textDecoration: 'underline' }}
			>
				{children}
			</RouterLink>
		)
	}

	if (isInternalPath(href)) return <span>{children}</span>

	return (
		<a href={href} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	)
}
