import { useState, useEffect } from 'react';

export const useIsInputFocused = () => {
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const onFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                setIsFocused(true);
            }
        };
        const onBlur = () => {
            setIsFocused(false);
        };

        window.addEventListener('focusin', onFocus);
        window.addEventListener('focusout', onBlur);

        return () => {
            window.removeEventListener('focusin', onFocus);
            window.removeEventListener('focusout', onBlur);
        };
    }, []);

    return isFocused;
};
