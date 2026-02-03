import React, { useState, useEffect } from 'react';
import { upsertHallOfFame, listManagers } from '../../cms';
import { HallOfFame, Manager } from '../../types';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';
import { Crown } from 'lucide-react';

interface HallOfFameDetailsModalProps {
    member: HallOfFame;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const HallOfFameDetailsModal: React.FC<HallOfFameDetailsModalProps> = ({ member, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<HallOfFame>({ ...member });
    const [msg, setMsg] = useState<string | null>(null);
    const [managers, setManagers] = useState<Manager[]>([]);

    useEffect(() => {
        listManagers().then(({ data }) => setManagers(data as Manager[] || []));
    }, []);

    // Auto-enter edit mode if it's a new empty member
    useEffect(() => {
        if (!member.name && isEditing) {
            setIsEditMode(true);
        }
    }, [member, isEditing]);

    const handleManagerSelect = (managerId: string) => {
        setFormData(prev => ({ ...prev, manager_id: managerId }));

        // Optional: Auto-fill if empty
        if (managerId) {
            const mgr = managers.find(m => m.id === managerId);
            if (mgr) {
                setFormData(prev => ({
                    ...prev,
                    manager_id: managerId,
                    name: prev.name || mgr.name,
                    image_url: prev.image_url || mgr.image_url
                }));
            }
        }
    };

    const handleSave = async () => {
        setMsg(null);
        if (!formData.name) return;

        const payload = { ...formData };
        if (payload.id === "") delete (payload as any).id;
        // Ensure year_inducted is set
        if (!payload.year_inducted) payload.year_inducted = new Date().getFullYear().toString();

        const { error } = await upsertHallOfFame(payload);
        if (error) {
            console.error(error);
            alert(`Erro ao salvar HoF: ${error.message}`);
            setMsg("Erro ao salvar.");
            return;
        }

        setMsg("Salvo com sucesso!");
        onUpdate();
        setTimeout(() => {
            setIsEditMode(false);
            setMsg(null);
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

                {/* Avatar with Crown */}
                <div className="relative w-24 h-24 mt-2">
                    <img src={formData.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`} alt={formData.name} className="w-full h-full rounded-full object-cover border-2 border-yellow-500/20 shadow-xl" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black border-2 border-black shadow-lg">
                        <Crown size={14} fill="black" />
                    </div>
                </div>

                {/* Content */}
                <div className="w-full text-center space-y-3">
                    {msg && <div className="text-xs text-yellow-500 font-bold">{msg}</div>}

                    {isEditMode ? (
                        <>
                            <div className="w-full space-y-2">
                                <label className={`text-[10px] font-bold uppercase tracking-widest block text-left ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Vincular Gestor (Opcional)</label>
                                <select
                                    value={formData.manager_id || ''}
                                    onChange={e => handleManagerSelect(e.target.value)}
                                    className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs outline-none focus:border-yellow-400 ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`}
                                >
                                    <option value="" className="text-gray-500">Sem vínculo / Manual</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} text-center font-black text-lg mt-2`} placeholder="Nome" />
                            <input value={formData.year_inducted || ''} onChange={e => setFormData({ ...formData, year_inducted: e.target.value })} className={`${inputClass} text-center text-xs text-yellow-500 font-bold`} placeholder="Ano de Indução (Ex: 2026)" />

                            <div className="space-y-2 mt-2">
                                <label className={`text-[10px] font-bold uppercase tracking-widest block text-left ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Detalhes</label>
                                <input value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} className={`${inputClass} text-left text-xs`} placeholder="Função / Role" />
                                <input value={formData.achievement || ''} onChange={e => setFormData({ ...formData, achievement: e.target.value })} className={`${inputClass} text-left text-xs`} placeholder="Conquista Principal" />
                                <input value={formData.image_url || ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className={`${inputClass} text-left text-xs`} placeholder="Image URL" />
                            </div>

                            <button onClick={handleSave} className="w-full py-3 mt-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                                Salvar Lenda
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {member.name}
                                </h2>
                                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">
                                    Class of {member.year_inducted}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                            <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p><span className="font-bold opacity-50">ROLE:</span> {member.role}</p>
                                <p><span className="font-bold opacity-50">FEAT:</span> {member.achievement}</p>
                                {member.manager && (
                                    <p className="mt-2 text-[10px] italic opacity-60">Vinculado a: {member.manager.name}</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
