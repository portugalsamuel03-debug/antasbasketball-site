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

    // Track current refresh call to avoid race conditions
    const currentRefreshId = useRef(0);

    useEffect(() => {
        const saved = localStorage.getItem('antas_admin_edit_mode');
        if (saved === 'true') setIsEditing(true);
        else if (saved === 'false') setIsEditing(false);
    }, []);

    const refreshRole = async () => {
        const myId = ++currentRefreshId.current;
        isRefreshing.current = true;
        console.log(`AdminContext: Refreshing role (ID: ${myId})...`);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Check if a newer refresh started while we were waiting for session
            if (myId !== currentRefreshId.current) {
                console.log(`AdminContext: Obsolete refresh (ID: ${myId}) ignored.`);
                return;
            }

            const user = session?.user;
            const userId = user?.id ?? null;

            setSessionUserId(userId);

            if (!userId) {
                setRole('reader');
                setIsEditing(false);
                return;
            }

            const isUserAdminByEmail = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const r = await getMyRole().catch((e) => {
                const errStr = String(e?.message || e?.name || e || "");
                if (!errStr.toLowerCase().includes('abort')) {
                    console.warn(`AdminContext [${myId}]: getMyRole failed:`, e);
                }
                return null;
            });

            if (myId !== currentRefreshId.current) return;

            const finalRole = isUserAdminByEmail ? 'admin' : (r || 'reader');
            console.log(`AdminContext [${myId}]: Role settled as ${finalRole}`);
            setRole(finalRole);

            if (finalRole === 'admin') {
                const saved = localStorage.getItem('antas_admin_edit_mode');
                if (saved === 'true' || saved === null) setIsEditing(true);
            }
        } catch (e: any) {
            const errStr = String(e?.message || e?.name || e || "");
            if (!errStr.toLowerCase().includes('abort')) {
                console.error(`AdminContext [${myId}]: refreshRole error:`, e);
            }
        } finally {
            if (myId === currentRefreshId.current) {
                setIsLoading(false);
                isRefreshing.current = false;
                console.log(`AdminContext [${myId}]: Loaded.`);
            }
        }
    };

    useEffect(() => {
        refreshRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("AdminContext: Auth Event:", event, session?.user?.email || 'no-user');

            // We refresh on any event that might change permissions or session context
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                // We use a small delay only if it's a critical change to avoid too many AbortErrors
                const delay = event === 'SIGNED_IN' ? 500 : 0;
                setTimeout(() => refreshRole(), delay);
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
