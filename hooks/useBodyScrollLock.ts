import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll and hide bottom navigation when a modal is open.
 * This prevents virtual keyboard layout shifting and screen freezing on mobile devices.
 */
export const useBodyScrollLock = (isOpen: boolean) => {
    useEffect(() => {
        if (!isOpen) return;

        // Only lock body scroll and hide bottom navigation on mobile/tablet viewports (under lg breakpoint)
        if (window.innerWidth >= 1024) return;

        // Save original body styles
        const originalOverflow = document.body.style.overflow;
        
        // Apply scrolling locks
        document.body.style.overflow = 'hidden';
        
        // Add class to body so that CSS can hide the bottom navigation bar
        document.body.classList.add('modal-open');

        return () => {
            // Restore original body styles
            document.body.style.overflow = originalOverflow;
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);
};
