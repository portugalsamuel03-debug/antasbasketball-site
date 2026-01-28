import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
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

const ADMIN_EMAIL = "portugalsamuel03@gmail.com";

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<Role | 'unknown'>('unknown');
    const [isEditing, setIsEditing] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isRefreshing = useRef(false);

    useEffect(() => {
        const saved = localStorage.getItem('antas_admin_edit_mode');
        if (saved === 'true') setIsEditing(true);
        else if (saved === 'false') setIsEditing(false);
    }, []);

    const refreshRole = async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        console.log("AdminContext: Refreshing role...");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            const userId = user?.id ?? null;

            setSessionUserId(userId);

            if (!userId) {
                setRole('reader');
                setIsEditing(false);
                setIsLoading(false);
                isRefreshing.current = false;
                return;
            }

            const isUserAdminByEmail = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const r = await getMyRole().catch((e) => {
                // Ignore AbortError in role check logs
                if (e?.name !== 'AbortError' && !e?.message?.toLowerCase().includes('abort')) {
                    console.warn("AdminContext: getMyRole failed:", e);
                }
                return null;
            });

            const finalRole = isUserAdminByEmail ? 'admin' : (r || 'reader');
            setRole(finalRole);

            if (finalRole === 'admin') {
                const saved = localStorage.getItem('antas_admin_edit_mode');
                if (saved === 'true' || saved === null) setIsEditing(true);
            }
        } catch (e: any) {
            if (e?.name !== 'AbortError' && !e?.message?.toLowerCase().includes('abort')) {
                console.error('AdminContext: refreshRole error:', e);
            }
        } finally {
            setIsLoading(false);
            isRefreshing.current = false;
        }
    };

    useEffect(() => {
        refreshRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            console.log("AdminContext: Auth Event:", event);
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                // Delay refresh to let session settle and avoid AbortErrors
                setTimeout(() => refreshRole(), 300);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleEditing = () => {
        setIsEditing(prev => {
            const next = !prev;
            localStorage.setItem('antas_admin_edit_mode', String(next));
            return next;
        });
    };

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
