import React, { useState, useEffect } from 'react';
import { Trade } from '../../types';
import { listTrades, deleteTrade } from '../../cms';
import { useAdmin } from '../../context/AdminContext';
import { EditTrigger } from './EditTrigger';
import { ArrowLeftRight } from 'lucide-react';
import { TradeDetailsModal } from './TradeDetailsModal';

interface TradesSectionProps {
    isDarkMode: boolean;
}

export const TradesSection: React.FC<TradesSectionProps> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchTrades();
    }, []);

    async function fetchTrades() {
        const { data } = await listTrades();
        setTrades(data || []);
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm('Deletar esta trade?')) return;
        await deleteTrade(id);
        fetchTrades();
    }

    function handleCreate() {
        setEditingTrade({ id: '', season: '', date: '', description: '' } as Trade);
        setShowModal(true);
    }

    function handleEdit(trade: Trade) {
        setEditingTrade(trade);
        setShowModal(true);
    }

    function handleClose() {
        setShowModal(false);
        setEditingTrade(null);
        fetchTrades();
    }

    // Group trades by season
    const tradesBySeason = trades.reduce((acc, trade) => {
        if (!acc[trade.season]) acc[trade.season] = [];
        acc[trade.season].push(trade);
        return acc;
    }, {} as Record<string, Trade[]>);

    return (
        <div className="px-6 pb-20">
            {isEditing && (
                <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Admin: Trades</div>
                    <EditTrigger type="add" onClick={handleCreate} />
                </div>
            )}

            <div className="space-y-8">
                {Object.keys(tradesBySeason).sort((a, b) => b.localeCompare(a)).map(season => (
                    <div key={season} className={`rounded-3xl p-6 ${isDarkMode ? 'bg-white/5' : 'bg-[#0B1D33]/5'}`}>
                        <h3 className={`text-xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            Temporada {season}
                        </h3>
                        <div className="space-y-3">
                            {tradesBySeason[season].map(trade => (
                                <div
                                    key={trade.id}
                                    className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white'
                                        } group cursor-pointer hover:scale-[1.02] transition-transform`}
                                    onClick={() => isEditing && handleEdit(trade)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <ArrowLeftRight className="w-5 h-5 text-blue-400 mt-1" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                        {trade.team_a?.name || 'Time A'}
                                                    </span>
                                                    <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                                                    <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                        {trade.team_b?.name || 'Time B'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mb-1">{trade.description}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    {new Date(trade.date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        {isEditing && (
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <EditTrigger type="edit" onClick={(e) => { e.stopPropagation(); handleEdit(trade); }} />
                                                <EditTrigger type="delete" onClick={(e) => handleDelete(trade.id, e)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {trades.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                        Nenhuma trade cadastrada ainda.
                    </div>
                )}
            </div>

            {showModal && editingTrade && (
                <TradeDetailsModal
                    trade={editingTrade}
                    isDarkMode={isDarkMode}
                    onClose={handleClose}
                />
            )}
        </div>
    );
};
