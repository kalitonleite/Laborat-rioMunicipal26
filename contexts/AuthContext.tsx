
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { authService, dbService } from '../services/apiService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (cpf: string, password?: string) => Promise<void>;
    signOut: () => Promise<void>;
    fetchProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    signOut: async () => { },
    fetchProfile: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Error parsing stored user", e);
            }
        }
        setLoading(false);
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const data = await dbService.from('profiles').select({ id: userId });
            
            if (data && data.length > 0) {
                const profile = data[0];
                const mappedUser: User = {
                    id: profile.id,
                    name: profile.name,
                    cpf: profile.cpf,
                    sus_number: profile.sus_number,
                    role: (profile.role || '').trim().toUpperCase() as UserRole,
                    avatar: profile.avatar,
                };
                setUser(mappedUser);
                localStorage.setItem('user_data', JSON.stringify(mappedUser));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const login = async (cpf: string, password?: string) => {
        try {
            const result = await authService.login(cpf, password);
            if (result.token) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user_data', JSON.stringify(result.user));
                setUser(result.user);
            }
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signOut, fetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
