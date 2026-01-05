import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { User } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted user
        const storedUser = localStorage.getItem('talentlayer_user');
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (!parsedUser.avatar) {
                    parsedUser.avatar = DEFAULT_AVATAR_URL;
                }
                setUser(parsedUser);
            } catch (e) {
                console.error('Failed to parse user from local storage:', e);
                localStorage.removeItem('talentlayer_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, data } = response;
            const userData = data?.user;

            if (!userData) {
                throw new Error("User data not found in response");
            }

            if (!userData.avatar) {
                userData.avatar = DEFAULT_AVATAR_URL;
            }

            setUser(userData);
            localStorage.setItem('talentlayer_token', token);
            localStorage.setItem('talentlayer_user', JSON.stringify(userData));
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
            localStorage.setItem('talentlayer_token', token);
            localStorage.setItem('talentlayer_user', JSON.stringify(userData));
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('talentlayer_user');
        localStorage.removeItem('talentlayer_token');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
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
