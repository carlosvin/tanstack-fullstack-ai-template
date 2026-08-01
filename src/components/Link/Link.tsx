import { Link as RouterLink } from '@tanstack/react-router'
import { forwardRef } from 'react'

/** Internal navigation — preserves current search params by default. */
export const Link = forwardRef<
	HTMLAnchorElement,
	React.ComponentProps<typeof RouterLink> & {
		/** Preserve current search params by default; pass `false` to omit. */
		search?: React.ComponentProps<typeof RouterLink>['search'] | true
	}
>(function Link({ search = true, ...props }, ref) {
	const resolvedSearch = search === true ? true : search
	return <RouterLink ref={ref} {...props} search={resolvedSearch} />
}) as typeof RouterLink
