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
    const isRefreshing = React.useRef(false);

    // Load persisted edit state
    useEffect(() => {
        const saved = localStorage.getItem('antas_admin_edit_mode');
        if (saved === 'true') {
            setIsEditing(true);
        } else if (saved === 'false') {
            setIsEditing(false);
        }
    }, []);

    // Safety timeout to ensure loading screen doesn't get stuck forever
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                console.warn("AdminContext: Loading safety timeout triggered.");
                setIsLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    const toggleEditing = () => {
        setIsEditing(prev => {
            const next = !prev;
            localStorage.setItem('antas_admin_edit_mode', String(next));
            return next;
        });
    };

    const refreshRole = async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        console.log("AdminContext: Refreshing role...");

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

            const r = await getMyRole().catch((e) => {
                console.warn("AdminContext: getMyRole failed:", e);
                return null;
            });
            const finalRole = isUserAdminByEmail ? 'admin' : (r || 'reader');
            setRole(finalRole);

            const saved = localStorage.getItem('antas_admin_edit_mode');
            if (finalRole === 'admin') {
                if (saved === 'true' || saved === null) {
                    setIsEditing(true);
                } else {
                    setIsEditing(false);
                }
            }
        } catch (e) {
            console.error('AdminContext: refreshRole error:', e);
        } finally {
            setIsLoading(false);
            isRefreshing.current = false;
        }
    };

    useEffect(() => {
        refreshRole();

        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event, session?.user?.email);

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
                refreshRole();
            } else if (event === 'SIGNED_OUT') {
                setRole('reader');
                setSessionUserId(null);
                setIsEditing(false);
                setIsLoading(false);
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
