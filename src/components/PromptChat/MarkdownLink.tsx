import { isInternalPath, toInternalRouterLinkTarget } from '../../utils/internalLinks'
import { Link } from '../Link/Link'

export function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
	if (!href) return <span>{children}</span>

	const linkTarget = toInternalRouterLinkTarget(href)
	if (linkTarget) {
		return (
			<Link
				to={linkTarget.to}
				{...(linkTarget.params ? { params: linkTarget.params } : {})}
				search={linkTarget.search ?? {}}
				preload="intent"
				style={{ color: 'inherit', textDecoration: 'underline' }}
			>
				{children}
			</Link>
		)
	}

	if (isInternalPath(href)) return <span>{children}</span>

	return (
		<a href={href} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	)
}
