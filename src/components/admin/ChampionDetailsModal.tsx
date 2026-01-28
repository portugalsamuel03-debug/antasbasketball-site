import React, { useState } from 'react';
import { upsertChampion } from '../../cms';
import { Champion } from '../../types';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';
import { Trophy } from 'lucide-react';

interface ChampionDetailsModalProps {
    champion: Partial<Champion>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const ChampionDetailsModal: React.FC<ChampionDetailsModalProps> = ({ champion, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<Champion>>({ ...champion });
    const [msg, setMsg] = useState<string | null>(null);

    // Auto-enter edit mode if it's a new empty champion
    React.useEffect(() => {
        if (!champion.year && isEditing) {
            setIsEditMode(true);
        }
    }, [champion, isEditing]);

    const handleSave = async () => {
        setMsg(null);
        if (!formData.year || !formData.team) return;

        const { error } = await upsertChampion(formData);
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

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center text-black shadow-xl mt-2 animate-bounce">
                    <Trophy size={32} />
                </div>

                {/* Content */}
                <div className="w-full text-center space-y-3">
                    {msg && <div className="text-xs text-yellow-500 font-bold">{msg}</div>}

                    {isEditMode ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Ano</label>
                                    <input value={formData.year || ''} onChange={e => setFormData({ ...formData, year: e.target.value })} className={`${inputClass} font-black text-lg`} placeholder="2024" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Placar</label>
                                    <input value={formData.score || ''} onChange={e => setFormData({ ...formData, score: e.target.value })} className={`${inputClass} font-black text-lg`} placeholder="102 - 98" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Time Campeão</label>
                                <input value={formData.team || ''} onChange={e => setFormData({ ...formData, team: e.target.value })} className={`${inputClass} uppercase`} placeholder="NOME DO TIME" />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">MVP das Finais</label>
                                <input value={formData.mvp || ''} onChange={e => setFormData({ ...formData, mvp: e.target.value })} className={`${inputClass}`} placeholder="Nome do Jogador" />
                            </div>

                            <button onClick={handleSave} className="w-full py-3 mt-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                                Salvar Campeão
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <div className="text-4xl font-black italic text-yellow-500 mb-1 leading-none">{champion.year}</div>
                                <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {champion.team}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    SCORE: {champion.score}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                            <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                <p className="text-[10px] font-bold text-yellow-500 uppercase mb-1">MVP DA TEMPORADA</p>
                                <p className={`text-sm font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{champion.mvp}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
