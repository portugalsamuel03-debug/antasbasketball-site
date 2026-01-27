import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getMyRole } from '../admin';

type Role = 'admin' | 'reader';

interface AdminContextType {
    role: Role | 'unknown';
    isAdmin: boolean;
    isEditing: boolean;
    toggleEditing: () => void;
    refreshRole: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
    role: 'unknown',
    isAdmin: false,
    isEditing: false,
    toggleEditing: () => { },
    refreshRole: async () => { },
});

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<Role | 'unknown'>('unknown');
    const [isEditing, setIsEditing] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);

    // Load persisted edit state
    useEffect(() => {
        const saved = localStorage.getItem('antas_admin_edit_mode');
        if (saved === 'true') setIsEditing(true);
    }, []);

    const toggleEditing = () => {
        setIsEditing(prev => {
            const next = !prev;
            localStorage.setItem('antas_admin_edit_mode', String(next));
            return next;
        });
    };

    const refreshRole = async () => {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? null;
        setSessionUserId(userId);

        if (!userId) {
            setRole('reader'); // Default to reader if not logged in
            return;
        }

        try {
            const r = await getMyRole();
            setRole(r || 'reader');
        } catch (e) {
            console.error('Failed to get role', e);
            setRole('reader');
        }
    };

    useEffect(() => {
        refreshRole();

        const { data } = supabase.auth.onAuthStateChange(() => {
            refreshRole();
        });

        return () => {
            data.subscription.unsubscribe();
        };
    }, []);

    const value = useMemo(() => ({
        role,
        isAdmin: role === 'admin',
        isEditing: role === 'admin' && isEditing,
        toggleEditing,
        refreshRole
    }), [role, isEditing]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};
