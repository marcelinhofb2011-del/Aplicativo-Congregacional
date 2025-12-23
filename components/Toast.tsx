
import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    onClear: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClear, duration = 3000 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                // Allow time for fade-out animation before clearing message
                setTimeout(onClear, 300); 
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClear]);

    return (
        <div
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white bg-emerald-500 transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
            {message}
        </div>
    );
};

export default Toast;
