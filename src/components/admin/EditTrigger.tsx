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

    if (!isAdmin || !isEditing) return null;

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
        delete: "bg-red-500 text-white hover:bg-red-400",
        add: "bg-green-500 text-white hover:bg-green-400",
        config: "bg-gray-700 text-white hover:bg-gray-600"
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick(e);
            }}
            className={`${baseClasses} ${typeClasses[type]} ${className}`}
            style={{ padding: size / 3 }}
        >
            <Icon size={size} strokeWidth={2.5} />
        </button>
    );
};
