import React from 'react';
import { Ghost } from 'lucide-react';

interface EmptyStateProps {
    message?: string;
    isDarkMode: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = "Nada por aqui ainda...", isDarkMode }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-500">
            <div className={`p-6 rounded-full mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-[#0B1D33]/5'}`}>
                <Ghost size={48} className={`opacity-50 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`} strokeWidth={1.5} />
            </div>
            <p className={`text-sm font-bold uppercase tracking-widest opacity-60 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                {message}
            </p>
        </div>
    );
};
