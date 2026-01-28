import React from 'react';
import { Pencil, Settings, Trash2, Plus } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface EditTriggerProps {
    type?: 'edit' | 'delete' | 'add' | 'config';
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    size?: number;
}

export const EditTrigger: React.FC<EditTriggerProps> = ({
    type = 'edit',
    onClick,
    className = '',
    size = 16
}) => {
    const { isEditing, isAdmin } = useAdmin();

    // config type should always be visible if in admin mode, regardless of isEditing
    if (!isAdmin) return null;
    if (!isEditing && type !== 'config') return null;

    const getIcon = () => {
        switch (type) {
            case 'delete': return Trash2;
            case 'add': return Plus;
            case 'config': return Settings;
            default: return Pencil;
        }
    };

    const Icon = getIcon();

    const baseClasses = "flex items-center justify-center rounded-full transition-all hover:scale-110 shadow-lg cursor-pointer z-[50]";
    const typeClasses = {
        edit: "bg-yellow-400 text-black hover:bg-yellow-300",
        delete: "bg-red-500 text-white hover:bg-red-400 opacity-90 hover:opacity-100",
        add: "bg-yellow-400 text-black hover:bg-yellow-300",
        config: "bg-gray-800 text-white hover:bg-gray-700"
    };

    const finalSize = type === 'delete' ? size * 0.8 : size;

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick(e);
            }}
            className={`${baseClasses} ${typeClasses[type]} ${className}`}
            style={{ padding: type === 'delete' ? finalSize / 4 : size / 3 }}
        >
            <Icon size={finalSize} strokeWidth={2.5} />
        </button>
    );
};
