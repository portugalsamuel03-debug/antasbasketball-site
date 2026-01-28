import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getMyRole } from '../admin';

type Role = 'admin' | 'reader';

interface AdminContextType {
    userId: string | null;
    role: Role | 'unknown';
    isAdmin: boolean;
    isEditing: boolean;
    isLoading: boolean;
    toggleEditing: () => void;
    refreshRole: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
    userId: null,
    role: 'unknown',
    isAdmin: false,
    isEditing: false,
    isLoading: true,
    toggleEditing: () => { },
    refreshRole: async () => { },
});

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<Role | 'unknown'>('unknown');
    const [isEditing, setIsEditing] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load persisted edit state
    useEffect(() => {
        const isAdminUrl = window.location.search.includes('admin');
        const saved = localStorage.getItem('antas_admin_edit_mode');
        if (isAdminUrl || saved === 'true') {
            setIsEditing(true);
        }
    }, []);

    const toggleEditing = () => {
        setIsEditing(prev => {
            const next = !prev;
            localStorage.setItem('antas_admin_edit_mode', String(next));
            return next;
        });
    };

    const refreshRole = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            const user = data.session?.user;
            const userId = user?.id ?? null;

            setSessionUserId(userId);

            if (!userId) {
                setRole('reader');
                setIsEditing(false);
                setIsLoading(false);
                return;
            }

            const adminEmail = "portugalsamuel03@gmail.com";
            const isUserAdminByEmail = user?.email?.toLowerCase() === adminEmail.toLowerCase();

            // Perform redirection if admin is on the wrong URL
            if (isUserAdminByEmail && !window.location.search.toLowerCase().includes("admin")) {
                const url = new URL(window.location.href);
                url.searchParams.set("admin", "1");
                window.location.replace(url.toString());
                return;
            }

            const r = await getMyRole().catch(() => null);
            const finalRole = isUserAdminByEmail ? 'admin' : (r || 'reader');
            setRole(finalRole);

            const isAdminUrl = window.location.search.toLowerCase().includes('admin');
            const saved = localStorage.getItem('antas_admin_edit_mode');
            if (finalRole === 'admin' && (isAdminUrl || saved === 'true' || saved === null)) {
                setIsEditing(true);
                if (saved === null) localStorage.setItem('antas_admin_edit_mode', 'true');
            }
        } catch (e) {
            console.error('refreshRole error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial check
        refreshRole();

        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event, session?.user?.email);

            // If signed in, ensure we refresh role and handle potential redirection
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                await refreshRole();
            } else if (event === 'SIGNED_OUT') {
                setRole('reader');
                setSessionUserId(null);
                setIsEditing(false);
            }
        });

        return () => {
            data.subscription.unsubscribe();
        };
    }, []);

    const value = useMemo(() => ({
        userId: sessionUserId,
        role,
        isAdmin: role === 'admin',
        isEditing: role === 'admin' && isEditing,
        isLoading,
        toggleEditing,
        refreshRole
    }), [sessionUserId, role, isEditing, isLoading]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};
