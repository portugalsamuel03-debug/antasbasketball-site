import React, { useState, useEffect } from 'react';
import { Award } from '../../types';
import { listAwards, deleteAward } from '../../cms';
import { useAdmin } from '../../context/AdminContext';
import { EditTrigger } from './EditTrigger';
import { Trophy } from 'lucide-react';
import { AwardDetailsModal } from './AwardDetailsModal';

interface AwardsSectionProps {
    isDarkMode: boolean;
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [awards, setAwards] = useState<Award[]>([]);
    const [editingAward, setEditingAward] = useState<Award | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchAwards();
    }, []);

    async function fetchAwards() {
        const { data } = await listAwards();
        setAwards(data || []);
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm('Deletar este prêmio?')) return;
        await deleteAward(id);
        fetchAwards();
    }

    function handleCreate() {
        setEditingAward({ id: '', year: '', category: '', winner_name: '', team_id: '' } as Award);
        setShowModal(true);
    }

    function handleEdit(award: Award) {
        setEditingAward(award);
        setShowModal(true);
    }

    function handleClose() {
        setShowModal(false);
        setEditingAward(null);
        fetchAwards();
    }

    // Group awards by year
    const awardsByYear = awards.reduce((acc, award) => {
        if (!acc[award.year]) acc[award.year] = [];
        acc[award.year].push(award);
        return acc;
    }, {} as Record<string, Award[]>);

    return (
        <div className="px-6 pb-20">
            {isEditing && (
                <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Admin: Awards</div>
                    <EditTrigger type="add" onClick={handleCreate} />
                </div>
            )}

            <div className="space-y-8">
                {Object.keys(awardsByYear).sort((a, b) => b.localeCompare(a)).map(year => (
                    <div key={year} className={`rounded-3xl p-6 ${isDarkMode ? 'bg-white/5' : 'bg-[#0B1D33]/5'}`}>
                        <h3 className={`text-xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            Temporada {year}
                        </h3>
                        <div className="space-y-3">
                            {awardsByYear[year].map(award => (
                                <div
                                    key={award.id}
                                    className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white'
                                        } group cursor-pointer hover:scale-[1.02] transition-transform`}
                                    onClick={() => isEditing && handleEdit(award)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Trophy className="w-5 h-5 text-yellow-400" />
                                        <div>
                                            <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                {award.category}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {award.winner_name}
                                                {award.team && ` - ${award.team.name}`}
                                            </div>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <EditTrigger type="edit" onClick={(e) => { e.stopPropagation(); handleEdit(award); }} />
                                            <EditTrigger type="delete" onClick={(e) => handleDelete(award.id, e)} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {awards.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                        Nenhum prêmio cadastrado ainda.
                    </div>
                )}
            </div>

            {showModal && editingAward && (
                <AwardDetailsModal
                    award={editingAward}
                    isDarkMode={isDarkMode}
                    onClose={handleClose}
                />
            )}
        </div>
    );
};
