import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EditTrigger } from './EditTrigger';
import { Users, Loader2, Image as ImageIcon } from 'lucide-react';
import { Manager } from './ManagersSection';

interface ManagerDetailsModalProps {
    manager: Partial<Manager>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

const BUCKET = "article-covers";

export const ManagerDetailsModal: React.FC<ManagerDetailsModalProps> = ({ manager, onClose, isDarkMode, onUpdate }) => {
    const [formData, setFormData] = useState<Partial<Manager>>({ ...manager });
    const [msg, setMsg] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMsg(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `manager-${Date.now()}.${fileExt}`;
            const filePath = `managers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
            setMsg("Foto carregada!");
        } catch (error: any) {
            console.error("Upload error:", error);
            setMsg("Erro no upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setMsg(null);
        if (!formData.name) return;

        setMsg('Salvando...');

        try {
            const payload = { ...formData };
            // If new (no ID), delete ID to let DB generate UUID if it was empty string
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

                {/* Image Upload */}
                <div className="relative group w-24 h-24">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden shadow-xl ${!formData.image_url ? 'bg-gray-200' : 'bg-black'}`}>
                        {formData.image_url ? (
                            <img src={formData.image_url} className="w-full h-full object-cover" alt="Manager" />
                        ) : (
                            <Users size={40} className="text-gray-400" />
                        )}

                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity rounded-full">
                            {uploading ? <Loader2 className="animate-spin text-white" /> : <ImageIcon className="text-white" />}
                            <span className="text-[8px] font-bold text-white uppercase mt-1">Alterar</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="w-full space-y-4 mt-2">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Nome</label>
                        <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} font-bold text-lg`} placeholder="Ex: Pat Riley" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Bio / Cargo (Opcional)</label>
                        <input value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} className={`${inputClass}`} placeholder="Ex: O Poderoso Chefão" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Times que comandou</label>
                        <textarea
                            value={formData.teams_managed || ''}
                            onChange={e => setFormData({ ...formData, teams_managed: e.target.value })}
                            className={`${inputClass} min-h-[60px] resize-none`}
                            placeholder="Ex: Lakers (80s), Heat (90s-Presente)"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Títulos Conquistados</label>
                        <textarea
                            value={formData.titles_won || ''}
                            onChange={e => setFormData({ ...formData, titles_won: e.target.value })}
                            className={`${inputClass} min-h-[60px] resize-none`}
                            placeholder="Ex: 5x NBA Champion, 3x Coach of the Year"
                        />
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
