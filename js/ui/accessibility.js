const previousFocus = new WeakMap();

export function announce(message, regionId = 'game-status') {
    const region = document.getElementById(regionId);
    if (region) region.textContent = message;
}

export function openAccessibleDialog(dialog, initialFocus) {
    previousFocus.set(dialog, document.activeElement);
    dialog.classList.remove('hidden');
    const focusable = () => [...dialog.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
    dialog.onkeydown = event => {
        if (event.key !== 'Tab') return;
        const items = focusable();
        if (!items.length) return;
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };
    requestAnimationFrame(() => (initialFocus || focusable()[0] || dialog).focus());
}

export function closeAccessibleDialog(dialog) {
    dialog.classList.add('hidden');
    dialog.onkeydown = null;
    previousFocus.get(dialog)?.focus?.();
    previousFocus.delete(dialog);
}
