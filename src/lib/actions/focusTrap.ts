import type { Options } from 'focus-trap';
import { createFocusTrap } from 'focus-trap';

/*
 * This traps the tab focus within the element it is applied to. It is simply an
 * action wrapper that uses the focus-trap library – read more at https://github.com/focus-trap/focus-trap on usage and options.
 */

export function focusTrap(node: HTMLElement, options: Options = { fallbackFocus: node }) {
	const trappedElement = createFocusTrap(node, options);
	trappedElement.activate();

	return {
		destroy() {
			trappedElement.deactivate();
		},
	};
}