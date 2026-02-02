import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';
import { EditTrigger } from './EditTrigger';
import { Users, Trash2, Award, Briefcase } from 'lucide-react';
import { ManagerDetailsModal } from './ManagerDetailsModal';

export interface Manager {
    id: string;
    name: string;
    image_url?: string;
    teams_managed?: string;
    titles_won?: string;
    bio?: string;
    is_active?: boolean;
}

interface ManagersSectionProps {
    isDarkMode: boolean;
}

export const ManagersSection: React.FC<ManagersSectionProps> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [managers, setManagers] = useState<Manager[]>([]);
    const [selectedManager, setSelectedManager] = useState<Partial<Manager> | null>(null);

    const fetchManagers = async () => {
        const { data, error } = await supabase.from('managers').select('*').order('created_at', { ascending: true });
        if (data) setManagers(data);
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Deletar este gestor?')) {
            await supabase.from('managers').delete().eq('id', id);
            fetchManagers();
        }
    };

    const activeManagers = managers.filter(m => m.is_active !== false);
    const historicManagers = managers.filter(m => m.is_active === false);

    const ManagerCard = ({ manager }: { manager: Manager }) => (
        <div
            className={`relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:scale-[1.01] ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
            onClick={() => isEditing && setSelectedManager(manager)}
        >
            {/* Background Gradient */}
            <div className={`absolute inset-0 opacity-10 ${isDarkMode ? 'bg-white' : 'bg-black'}`} />

            <div className="relative p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                {/* Manager Image */}
                <div className={`w-24 h-24 rounded-full border-4 overflow-hidden shadow-xl flex-shrink-0 bg-gray-300 ${manager.is_active !== false ? 'border-yellow-400' : 'border-gray-500 grayscale'}`}>
                    {manager.image_url ? (
                        <img src={manager.image_url} alt={manager.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Users size={32} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className={`text-2xl font-black uppercase leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {manager.name}
                        </h3>
                        {manager.bio && <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">{manager.bio}</p>}
                    </div>

                    <div className="flex flex-col gap-2 text-xs">
                        {manager.teams_managed && (
                            <div className="flex items-center gap-2 justify-center sm:justify-start text-gray-400">
                                <Briefcase size={12} className="text-yellow-400" />
                                <span>{manager.teams_managed}</span>
                            </div>
                        )}
                        {manager.titles_won && (
                            <div className="flex items-center gap-2 justify-center sm:justify-start text-gray-400">
                                <Award size={12} className="text-yellow-400" />
                                <span>{manager.titles_won}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => handleDelete(manager.id, e)}
                        className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="px-6 pb-20 space-y-12">

            {/* Active Managers */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="text-xs font-black uppercase tracking-widest text-yellow-500">Gestores em Atividade</div>
                    {isEditing && <EditTrigger type="add" onClick={() => setSelectedManager({})} />}
                </div>
                <div className="grid gap-6">
                    {activeManagers.map(manager => (
                        <ManagerCard key={manager.id} manager={manager} />
                    ))}
                    {activeManagers.length === 0 && (
                        <div className="text-gray-500 text-sm italic">Nenhum gestor ativo.</div>
                    )}
                </div>
            </div>

            {/* Historic Managers */}
            {historicManagers.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-gray-800">
                    <div className="text-xs font-black uppercase tracking-widest text-gray-500">Lendas & Históricos</div>
                    <div className="grid gap-6 opacity-80">
                        {historicManagers.map(manager => (
                            <ManagerCard key={manager.id} manager={manager} />
                        ))}
                    </div>
                </div>
            )}

            {selectedManager && (
                <ManagerDetailsModal
                    manager={selectedManager}
                    isDarkMode={isDarkMode}
                    onClose={() => setSelectedManager(null)}
                    onUpdate={fetchManagers}
                />
            )}
        </div>
    );
};
