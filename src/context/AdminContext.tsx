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

const ADMIN_EMAILS = ["portugalsamuel03@gmail.com", "hugost74@gmail.com"];

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<Role | 'unknown'>('unknown');
    const [isEditing, setIsEditing] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isRefreshing = useRef(false);
    const currentRefreshId = useRef(0);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        const saved = localStorage.getItem('antas_admin_edit_mode');
        if (saved === 'true') setIsEditing(true);
        else if (saved === 'false') setIsEditing(false);
        return () => { mounted.current = false; };
    }, []);

    // SAFETY ESCAPE HATCH
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading && mounted.current) {
                console.warn("AdminContext: Safety timeout triggered.");
                setIsLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    const refreshRole = async () => {
        if (!mounted.current) return;
        const myId = ++currentRefreshId.current;
        isRefreshing.current = true;

        console.log(`AdminContext [${myId}]: Refresh start.`);

        try {
            const { data: { session }, error: sErr } = await supabase.auth.getSession();

            if (!mounted.current) return;
            if (myId !== currentRefreshId.current) {
                console.log(`AdminContext [${myId}]: Superseded.`);
                return;
            }

            if (sErr) throw sErr;

            const user = session?.user;
            const userId = user?.id ?? null;
            setSessionUserId(userId);

            if (!userId) {
                console.log(`AdminContext [${myId}]: No user, reader role.`);
                setRole('reader');
                setIsEditing(false);
                return;
            }

            const isUserAdminByEmail = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
            const r = await getMyRole().catch((e) => {
                const errStr = String(e?.message || e?.name || "");
                if (!errStr.toLowerCase().includes('abort')) {
                    console.warn(`AdminContext [${myId}]: Role lookup failed:`, e);
                }
                return null;
            });

            if (!mounted.current || myId !== currentRefreshId.current) return;

            const finalRole = isUserAdminByEmail ? 'admin' : (r || 'reader');
            console.log(`AdminContext [${myId}]: Final role: ${finalRole}`);
            setRole(finalRole);

            if (finalRole === 'admin') {
                const saved = localStorage.getItem('antas_admin_edit_mode');
                if (saved === 'true' || saved === null) setIsEditing(true);
            }
        } catch (e: any) {
            const errStr = String(e?.message || e?.name || "");
            if (!errStr.toLowerCase().includes('abort')) {
                console.error(`AdminContext [${myId}]: Error:`, e);
            }
        } finally {
            if (mounted.current && myId === currentRefreshId.current) {
                setIsLoading(false);
                isRefreshing.current = false;
                console.log(`AdminContext [${myId}]: Ready.`);
            }
        }
    };

    useEffect(() => {
        refreshRole();

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("AdminContext: Auth State:", event);
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
                // Throttle refresh
                setTimeout(() => {
                    if (mounted.current) refreshRole();
                }, 300);
            }
        });

        return () => {
            if (data?.subscription) data.subscription.unsubscribe();
        };
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
