import React, { useEffect } from 'react';
import { SESSION_EXPIRED_EVENT } from '../lib/api';
import { useToast } from './Toast';

/**
 * Listens for session-expired events (e.g. 401 from API) and shows a toast.
 * Rendered inside ToastProvider so useToast is available.
 */
const SessionExpiryHandler: React.FC = () => {
    const { showToast } = useToast();

    useEffect(() => {
        const handleSessionExpired = () => {
            showToast('Your session has expired. Please log in again.', 'error');
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    }, [showToast]);

    return null;
};

export default SessionExpiryHandler;
