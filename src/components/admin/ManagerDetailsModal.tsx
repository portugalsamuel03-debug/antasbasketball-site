import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { listTeams, listChampions, listAwards } from '../../cms';
import { TeamRow, Champion, Award } from '../../types';
import { EditTrigger } from './EditTrigger';
import { Users, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { Manager } from './ManagersSection';

interface ManagerDetailsModalProps {
    manager: Partial<Manager>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

const BUCKET = "article-covers";

export const ManagerDetailsModal: React.FC<ManagerDetailsModalProps> = ({ manager, onClose, isDarkMode, onUpdate }) => {
    const [formData, setFormData] = useState<Partial<Manager>>({
        is_active: true, // Default to true
        teams_managed_ids: [],
        ...manager
    });
    const [msg, setMsg] = useState<string | null>(null);

    // Data filtering state
    const [allTeams, setAllTeams] = useState<TeamRow[]>([]);
    const [calculatedTitles, setCalculatedTitles] = useState<string[]>([]);
    const [calculatedAwards, setCalculatedAwards] = useState<string[]>([]);

    useEffect(() => {
        // Fetch Teams for dropdown
        listTeams().then(({ data }) => setAllTeams(data as TeamRow[] || []));

        // Calculate Titles & Awards if manager has an ID
        if (manager.id) {
            // Champions
            listChampions().then(({ data }) => {
                const champions = data as Champion[] || [];
                const wins = champions.filter(c => c.manager_id === manager.id);
                const titles = wins.map(w => `${w.year} (${w.team})`);
                setCalculatedTitles(titles);
            });

            // Awards
            listAwards().then(({ data }) => {
                const awards = data as Award[] || [];
                const myAwards = awards.filter(a => a.manager_id === manager.id);
                const awardStrings = myAwards.map(a => `${a.year}: ${a.category}`);
                setCalculatedAwards(awardStrings);
            });
        }
    }, [manager.id]);

    const handleSave = async () => {
        setMsg(null);
        if (!formData.name) return;

        setMsg('Salvando...');

        try {
            const payload = { ...formData };
            // If new (no ID), delete ID 
            if (!payload.id) delete (payload as any).id;

            const { error } = await supabase.from('managers').upsert(payload);

            if (error) throw error;

            setMsg("Salvo com sucesso!");
            onUpdate();
            setTimeout(onClose, 800);
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar: ${e.message}`);
            setMsg("Erro ao salvar.");
        }
    };

    const toggleTeam = (teamId: string) => {
        const currentIds = formData.teams_managed_ids || [];
        if (currentIds.includes(teamId)) {
            setFormData({ ...formData, teams_managed_ids: currentIds.filter(id => id !== teamId) });
        } else {
            setFormData({ ...formData, teams_managed_ids: [...currentIds, teamId] });
        }
    };

    const inputClass = `w-full bg-transparent border-b px-2 py-2 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[32px] overflow-hidden shadow-xl p-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>

                <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                    ✕
                </button>

                <h2 className={`text-xl font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                    {manager.id ? 'Editar Gestor' : 'Novo Gestor'}
                </h2>

                {/* Image Preview */}
                <div className="relative group w-24 h-24">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden shadow-xl ${!formData.image_url ? 'bg-gray-200' : 'bg-black'}`}>
                        {formData.image_url ? (
                            <img src={formData.image_url} className="w-full h-full object-cover" alt="Manager" />
                        ) : (
                            <Users size={40} className="text-gray-400" />
                        )}
                    </div>
                </div>

                <div className="w-full space-y-4 mt-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-xs font-bold uppercase text-gray-500">Gestor em Atividade?</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.is_active !== false} // Default true
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">URL da Foto</label>
                        <input value={formData.image_url || ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className={`${inputClass} text-xs`} placeholder="https://..." />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Nome</label>
                        <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} font-bold text-lg`} placeholder="Ex: Pat Riley" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Bio / Cargo (Opcional)</label>
                        <input value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} className={`${inputClass}`} placeholder="Ex: O Poderoso Chefão" />
                    </div>

                    {/* Teams Selection */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left mb-2">Times Comandados</label>
                        <div className={`p-2 rounded-xl border max-h-32 overflow-y-auto ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                            {allTeams.map(team => {
                                const isSelected = (formData.teams_managed_ids || []).includes(team.id);
                                return (
                                    <div
                                        key={team.id}
                                        onClick={() => toggleTeam(team.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-1 transition-colors ${isSelected ? 'bg-yellow-400 text-black font-bold' : 'hover:bg-white/10 text-gray-500'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-black' : 'border-gray-500'}`}>
                                            {isSelected && <Check size={10} />}
                                        </div>
                                        <span className="text-xs uppercase">{team.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Titles Section */}
                    <div className="space-y-3 pt-2 border-t border-dashed border-gray-700">
                        {/* Auto-calculated Team Titles */}
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 block text-left mb-1">
                                Títulos de Times (Automático)
                            </label>
                            {calculatedTitles.length > 0 ? (
                                <div className="text-xs text-yellow-500 font-bold bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                                    {calculatedTitles.map((t, i) => (
                                        <div key={i}>🏆 {t}</div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[10px] text-gray-600 italic">Nenhum título registrado.</div>
                            )}
                        </div>

                        {/* Awards Section */}
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 block text-left mb-1">
                                Prêmios Individuais (Automático)
                            </label>
                            {calculatedAwards.length > 0 ? (
                                <div className="text-xs text-white/80 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                                    {calculatedAwards.map((t, i) => (
                                        <div key={i}>🎖️ {t}</div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[10px] text-gray-600 italic">Nenhum prêmio registrado.</div>
                            )}
                        </div>

                        {/* Individual Titles Input (Manual) */}
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">
                                Outros Títulos (Manual)
                            </label>
                            <textarea
                                value={formData.individual_titles || ''}
                                onChange={e => setFormData({ ...formData, individual_titles: e.target.value })}
                                className={`${inputClass} min-h-[50px] resize-none`}
                                placeholder="Extras..."
                            />
                        </div>
                    </div>

                    {msg && <div className="text-xs text-center text-yellow-500 font-bold">{msg}</div>}

                    <button onClick={handleSave} className="w-full py-3 mt-2 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                        Salvar Gestor
                    </button>
                </div>
            </div>
        </div>
    );
};
