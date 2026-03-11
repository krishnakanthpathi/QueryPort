import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, SESSION_EXPIRED_EVENT } from '../lib/api';
import type { User } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';

/** Decode JWT payload and return exp (seconds since epoch), or null if invalid/missing. */
function getJwtExp(token: string): number | null {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = atob(padded);
        const exp = JSON.parse(json).exp;
        return typeof exp === 'number' ? exp : null;
    } catch {
        return null;
    }
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    register: (name: string, username: string, email: string, password: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const navigate = useNavigate();

    const clearExpiryTimer = useCallback(() => {
        if (expiryTimerRef.current !== null) {
            clearTimeout(expiryTimerRef.current);
            expiryTimerRef.current = null;
        }
    }, []);

    const scheduleExpiry = useCallback((token: string) => {
        clearExpiryTimer();
        const exp = getJwtExp(token);
        if (exp === null) return;
        const delay = exp * 1000 - Date.now();
        if (delay <= 0) {
            window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
            return;
        }
        expiryTimerRef.current = setTimeout(() => {
            expiryTimerRef.current = null;
            window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        }, delay);
    }, [clearExpiryTimer]);

    useEffect(() => {
        const handleSessionExpired = () => {
            setUser(null);
            localStorage.removeItem('queryport_user');
            localStorage.removeItem('queryport_token');
            clearExpiryTimer();
            navigate('/login');
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    }, [navigate, clearExpiryTimer]);

    useEffect(() => {
        const token = localStorage.getItem('queryport_token');
        const storedUser = localStorage.getItem('queryport_user');
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
            try {
                if (token) {
                    const exp = getJwtExp(token);
                    if (exp !== null && exp * 1000 <= Date.now()) {
                        localStorage.removeItem('queryport_token');
                        localStorage.removeItem('queryport_user');
                        setIsLoading(false);
                        return;
                    }
                }
                const parsedUser = JSON.parse(storedUser);
                if (!parsedUser.avatar) {
                    parsedUser.avatar = DEFAULT_AVATAR_URL;
                }
                setUser(parsedUser);
                if (token) scheduleExpiry(token);
            } catch (e) {
                console.error('Failed to parse user from local storage:', e);
                localStorage.removeItem('queryport_token');
                localStorage.removeItem('queryport_user');
            }
        }
        setIsLoading(false);
    }, [scheduleExpiry]);

    const login = async (identifier: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { identifier, password });
            const { token, data } = response;
            const userData = data?.user;

            if (!userData) {
                throw new Error("User data not found in response");
            }

            if (!userData.avatar) {
                userData.avatar = DEFAULT_AVATAR_URL;
            }

            setUser(userData);
            localStorage.setItem('queryport_token', token);
            localStorage.setItem('queryport_user', JSON.stringify(userData));
            scheduleExpiry(token);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, username: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/signup', { name, username, email, password });
            const { token, data } = response;
            const userData = data?.user;

            if (!userData) {
                throw new Error("User data not found in response");
            }

            if (!userData.avatar) {
                userData.avatar = DEFAULT_AVATAR_URL;
            }

            setUser(userData);
            localStorage.setItem('queryport_token', token);
            localStorage.setItem('queryport_user', JSON.stringify(userData));
            scheduleExpiry(token);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = async (credential: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/google', { credential });
            const { token, data } = response;
            const userData = data?.user;

            if (!userData) throw new Error("User data not found");

            if (!userData.avatar) userData.avatar = DEFAULT_AVATAR_URL;

            setUser(userData);
            localStorage.setItem('queryport_token', token);
            localStorage.setItem('queryport_user', JSON.stringify(userData));
            scheduleExpiry(token);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearExpiryTimer();
        setUser(null);
        localStorage.removeItem('queryport_user');
        localStorage.removeItem('queryport_token');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
