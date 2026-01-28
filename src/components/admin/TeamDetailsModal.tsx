import React, { useState } from 'react';
import { upsertTeam } from '../../cms';
import { TeamRow } from '../../types';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';
import { Users } from 'lucide-react';

interface TeamDetailsModalProps {
    team: Partial<TeamRow>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ team, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<TeamRow>>({ ...team });
    const [msg, setMsg] = useState<string | null>(null);

    // Auto-enter edit mode if it's a new empty team
    React.useEffect(() => {
        if (!team.name && isEditing) {
            setIsEditMode(true);
        }
    }, [team, isEditing]);

    const handleSave = async () => {
        setMsg(null);
        if (!formData.name) return;

        const payload = { ...formData };
        if (payload.id === "") delete payload.id;

        const { error } = await upsertTeam(payload);
        if (error) {
            console.error(error);
            setMsg("Erro ao salvar.");
            return;
        }

        setMsg("Salvo com sucesso!");
        onUpdate();
        setTimeout(() => {
            setIsEditMode(false);
            setMsg(null);
            onClose();
        }, 800);
    };

    const inputClass = `w-full bg-transparent border-b px-2 py-1 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[32px] overflow-hidden shadow-xl p-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>

                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {isEditing && !isEditMode && (
                        <EditTrigger type="edit" size={16} onClick={() => setIsEditMode(true)} />
                    )}
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        ✕
                    </button>
                </div>

                {/* Team Logo / Placeholder */}
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl mt-2 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    {formData.logo_url ? (
                        <img src={formData.logo_url} alt={formData.name} className="w-full h-full object-contain p-2" />
                    ) : (
                        <Users size={48} className="text-yellow-400" />
                    )}
                </div>

                {/* Content */}
                <div className="w-full text-center space-y-3">
                    {msg && <div className="text-xs text-yellow-500 font-bold">{msg}</div>}

                    {isEditMode ? (
                        <>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Nome do Time</label>
                                <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} font-black text-lg uppercase`} placeholder="EX: CHICAGO BULLS" />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Logo URL</label>
                                <input value={formData.logo_url || ''} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} className={`${inputClass}`} placeholder="https://..." />
                            </div>

                            <button onClick={handleSave} className="w-full py-3 mt-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                                Salvar Time
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <h2 className={`text-2xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {team.name}
                                </h2>
                                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">
                                    TIME OFICIAL ANTAS
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                            <p className={`text-xs px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Participante das ligas oficiais do Antas Basketball.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
