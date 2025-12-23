// Notification helper functions

/**
 * Checks if notification permission has been granted.
 */
export const hasNotificationPermission = (): boolean => {
    return Notification.permission === 'granted';
};

/**
 * Requests permission to show notifications.
 * @returns A promise that resolves to the permission status ('granted', 'denied', or 'default').
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        console.log('Notification permission granted.');
    } else {
        console.log('Unable to get permission to show notifications.');
    }
    return permission;
};

/**
 * Shows a test notification directly through the service worker.
 */
export const showTestNotification = () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Este navegador não suporta notificações push.');
        return;
    }

    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Notificação de Teste', {
                body: 'Esta é uma notificação de teste do aplicativo!',
                icon: '/icon-192.png',
                badge: '/icon-192.png'
            });
        });
    } else {
        alert('Você precisa permitir as notificações primeiro.');
    }
};

/**
 * Shows a notification for a new assignment.
 */
export const showNewAssignmentNotification = (brotherName: string, assignmentType: string) => {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Nova Designação', {
                body: `${brotherName} recebeu uma nova designação: ${assignmentType}.`,
                icon: '/icon-192.png'
            });
        });
    }
};
