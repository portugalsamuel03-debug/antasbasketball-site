import React from 'react';

interface CardSkeletonProps {
    isDarkMode: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ isDarkMode }) => {
    const baseClass = isDarkMode ? 'bg-white/5' : 'bg-black/5';

    return (
        <div className={`rounded-[32px] p-4 mb-4 animate-pulse ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} border ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
            <div className={`h-48 w-full rounded-2xl mb-4 ${baseClass}`} />
            <div className="px-2">
                <div className={`h-4 w-1/3 rounded-full mb-4 ${baseClass}`} />
                <div className={`h-6 w-3/4 rounded-full mb-3 ${baseClass}`} />
                <div className={`h-4 w-full rounded-full mb-2 ${baseClass}`} />
                <div className={`h-4 w-2/3 rounded-full mb-6 ${baseClass}`} />
                <div className="flex justify-between items-center">
                    <div className={`h-8 w-8 rounded-full ${baseClass}`} />
                    <div className={`h-4 w-16 rounded-full ${baseClass}`} />
                </div>
            </div>
        </div>
    );
};
