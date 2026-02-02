import React, { useState, useEffect } from 'react';
import { X, BookOpen, Save, Pencil, Loader2 } from 'lucide-react';
import { getStaticContent, updateStaticContent } from '../cms';
import { useAdmin } from '../context/AdminContext';

interface HistoryStoryModalProps {
    onClose: () => void;
    isDarkMode: boolean;
}

interface StoryContent {
    title: string;
    intro: string;
    pillars: string[];
    footer: string;
    since: string;
}

const DEFAULT_CONTENT: StoryContent = {
    title: "Nossa História",
    intro: "O Antas Basketball nasceu de uma paixão compartilhada pelo esporte e pela amizade. O que começou como simples encontros em quadras de rua evoluiu para uma liga organizada, movida pela competitividade saudável e pelo amor ao jogo.",
    pillars: ["Competitividade com Respeito", "Inclusão e Comunidade", "Evolução Constante"],
    footer: "Hoje, somos mais do que um grupo de jogadores; somos uma família que celebra cada cesta, cada vitória e, acima de tudo, a união que o basquete nos proporciona.",
    since: "Since 2017 • Antas Basketball"
};

export const HistoryStoryModal: React.FC<HistoryStoryModalProps> = ({ onClose, isDarkMode }) => {
    const { isEditing: isAdmin } = useAdmin();
    const [content, setContent] = useState<StoryContent>(DEFAULT_CONTENT);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setIsLoading(true);
        const data = await getStaticContent('nossa_historia');
        if (data) {
            setContent(data);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await updateStaticContent('nossa_historia', content);
        setIsSaving(false);
        setEditMode(false);
    };

    const updatePillar = (index: number, val: string) => {
        const newPillars = [...content.pillars];
        newPillars[index] = val;
        setContent({ ...content, pillars: newPillars });
    };

    if (isLoading) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto border rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-[#0B1D33]/10'}`}>

                {/* Header Image/Banner */}
                <div className="relative h-48 bg-gradient-to-r from-yellow-500 to-yellow-300 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/basketball.png')]"></div>
                    <BookOpen size={64} className="text-black/20" />
                    <h2 className="relative z-10 text-4xl font-black italic uppercase tracking-tighter text-black transform -rotate-2">
                        {content.title}
                    </h2>

                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => editMode ? handleSave() : setEditMode(true)}
                                className={`p-2 rounded-full transition-colors ${editMode ? 'bg-green-500 text-white' : 'bg-black/10 hover:bg-black/20 text-black'}`}
                                title={editMode ? "Salvar Alterações" : "Editar História"}
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : editMode ? <Save size={20} /> : <Pencil size={20} />}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 bg-black/10 hover:bg-black/20 rounded-full text-black transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="flex items-start gap-4">
                        <span className="text-6xl font-black text-yellow-500 opacity-50">“</span>
                        {editMode ? (
                            <textarea
                                value={content.intro}
                                onChange={e => setContent({ ...content, intro: e.target.value })}
                                className="w-full h-32 bg-transparent border p-2 rounded-xl text-lg font-medium"
                            />
                        ) : (
                            <p className={`text-lg font-medium leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {content.intro}
                            </p>
                        )}
                    </div>

                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <h3 className={`text-sm font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            Nossos Pilares
                        </h3>
                        <ul className="space-y-2">
                            {content.pillars.map((pillar, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0"></div>
                                    {editMode ? (
                                        <input
                                            value={pillar}
                                            onChange={e => updatePillar(idx, e.target.value)}
                                            className="bg-transparent border-b w-full outline-none"
                                        />
                                    ) : (
                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{pillar}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {editMode ? (
                        <textarea
                            value={content.footer}
                            onChange={e => setContent({ ...content, footer: e.target.value })}
                            className="w-full h-24 bg-transparent border p-2 rounded-xl text-sm"
                        />
                    ) : (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {content.footer}
                        </p>
                    )}
                </div>

                <div className={`p-4 border-t flex justify-center ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {content.since}
                    </p>
                </div>

            </div>
        </div>
    );
};
