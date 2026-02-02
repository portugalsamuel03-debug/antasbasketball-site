import React, { useState } from 'react';
import { upsertChampion, listTeams, listManagers } from '../../cms';
import { Champion, TeamRow } from '../../types';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';
import { Trophy, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChampionDetailsModalProps {
    champion: Partial<Champion>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

const BUCKET = "article-covers";

export const ChampionDetailsModal: React.FC<ChampionDetailsModalProps> = ({ champion, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [isEditMode, setIsEditMode] = useState(false);

    // Parse historic_players if string/json
    const initialPlayers = Array.isArray(champion.historic_players)
        ? champion.historic_players.map(p => typeof p === 'string' ? p : p.name)
        : ["", "", ""];

    const [formData, setFormData] = useState<Partial<Champion>>({ ...champion });
    const [highlightPlayers, setHighlightPlayers] = useState<string[]>(
        initialPlayers.length === 3 ? initialPlayers : [...initialPlayers, "", "", ""].slice(0, 3)
    );

    const [msg, setMsg] = useState<string | null>(null);

    // Auto-enter edit mode if it's a new empty champion
    React.useEffect(() => {
        if (!champion.year && isEditing) {
            setIsEditMode(true);
        }
    }, [champion, isEditing]);

    const [teams, setTeams] = useState<TeamRow[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    React.useEffect(() => {
        listTeams().then(({ data }) => setTeams(data as TeamRow[] || []));
        listManagers().then(({ data }) => setManagers(data || []));
    }, []);

    const handleSave = async () => {
        setMsg(null);
        if (!formData.year || !formData.team) return;

        const payload = { ...formData };
        if (payload.id === "") delete payload.id;

        // Remove joined data that shouldn't be valid columns
        delete (payload as any).manager;

        // Save highlights as JSON array of objects
        payload.historic_players = highlightPlayers
            .filter(n => n.trim() !== "")
            .map(n => ({ name: n.trim() }));

        // Remove old MVP field update if we want to rely on manager
        // But for safety, we can sync MVP field to Manager Name if needed, 
        // or just let it be. User asked to replace use of MVP.
        const selectedManager = managers.find(m => m.id === formData.manager_id);
        if (selectedManager) {
            payload.mvp = selectedManager.name; // Sync for backward capability if needed
        }

        const { error } = await upsertChampion(payload);
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

                {/* Icon/Logo */}
                <div className="relative group w-20 h-20">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl mt-2 ${!formData.logo_url ? 'bg-yellow-400 text-black' : 'bg-white/5'}`}>
                        {formData.logo_url ? (
                            <img src={formData.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                        ) : (
                            <Trophy size={40} />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="w-full text-center space-y-3">
                    {msg && <div className="text-xs text-yellow-500 font-bold">{msg}</div>}

                    {isEditMode ? (
                        <>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">URL da Logo (Icon)</label>
                                <input
                                    value={formData.logo_url || ''}
                                    onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                                    className={`${inputClass} text-xs`}
                                    placeholder="https://..."
                                />
                            </div>

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
                                <select
                                    value={teams.find(t => t.name === formData.team)?.id || ''}
                                    onChange={e => {
                                        const t = teams.find(team => team.id === e.target.value);
                                        if (t) setFormData({ ...formData, team: t.name, team_id: t.id, logo_url: t.logo_url });
                                    }}
                                    className={`${inputClass} uppercase appearance-none ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
                                >
                                    <option value="" className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>Selecione um time...</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id} className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block text-left mb-1">Gestor do Time</label>
                                <select
                                    value={formData.manager_id || ''}
                                    onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                                    className={`${inputClass} uppercase appearance-none ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
                                >
                                    <option value="">Selecione o Gestor...</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 border-t border-dashed border-gray-700 mt-2">
                                <label className="text-[10px] font-bold uppercase text-yellow-500 block text-left mb-2">Jogadores Destaque (Max 3)</label>
                                <div className="space-y-2">
                                    {[0, 1, 2].map(idx => (
                                        <input
                                            key={idx}
                                            value={highlightPlayers[idx] || ''}
                                            onChange={e => {
                                                const newArr = [...highlightPlayers];
                                                newArr[idx] = e.target.value;
                                                setHighlightPlayers(newArr);
                                            }}
                                            className={`${inputClass}`}
                                            placeholder={`Jogador ${idx + 1}`}
                                        />
                                    ))}
                                </div>
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

                            <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                            {/* Manager Display */}
                            {champion.manager ? (
                                <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                    <p className="text-[10px] font-bold text-yellow-500 uppercase mb-2">GESTOR DO TIME</p>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500">
                                            <img src={champion.manager.image_url} alt={champion.manager.name} className="w-full h-full object-cover" />
                                        </div>
                                        <p className={`text-sm font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                            {champion.manager.name}
                                        </p>
                                    </div>
                                </div>
                            ) : (champion.mvp && (
                                <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                    <p className="text-[10px] font-bold text-yellow-500 uppercase mb-1">MVP DA TEMPORADA</p>
                                    <p className={`text-sm font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{champion.mvp}</p>
                                </div>
                            ))}

                            {/* Highlight Players */}
                            {champion.historic_players && champion.historic_players.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-2 tracking-widest">DESTAQUES - BIG THREE</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {champion.historic_players.map((p: any, i: number) => (
                                            <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                                                {typeof p === 'string' ? p : p.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
