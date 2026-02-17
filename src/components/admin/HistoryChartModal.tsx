import React from 'react';
import { X } from 'lucide-react';

interface ChartDataPoint {
    label: string;
    value: number;
    meta?: {
        entityName?: string;
        wins?: number;
        losses?: number;
        ties?: number;
    };
}

interface HistoryChartModalProps {
    title: string;
    data: ChartDataPoint[];
    isDarkMode: boolean;
    onClose: () => void;
    color?: string; // Hex color for line
    type?: 'position' | 'trades'; // Default 'position'
}

export const HistoryChartModal: React.FC<HistoryChartModalProps> = ({ title, data, isDarkMode, onClose, color = '#FACC15', type = 'position' }) => {
    // 1. Process Data
    // We want position 1 at the top. Max position at bottom.
    // Let's find min and max position to scale Y axis.
    // However, usually positions are 1..20. Let's fix Y axis 1..20 or dynamic?
    // Let's make it dynamic but inverted.

    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    // If trades, min is 0 (or min value), max is max value.
    // If position, min is 1, max is max value (at least 10).
    const minVal = type === 'trades' ? 0 : 1;
    const maxVal = type === 'trades' ? (Math.max(...values, 5)) : Math.max(...values, 10);

    // Dimensions
    const width = 600;
    const height = 300;
    const padding = 40;

    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    // Scales
    // X: Index 0..length-1 -> padding..width-padding
    const getX = (index: number) => padding + (index / (data.length - 1 || 1)) * chartW;

    // Y: value
    // If Position: 1..maxVal -> padding..height-padding (Inverted: 1 is top (padding), maxVal is bottom)
    // If Trades: 0..maxVal -> height-padding..padding (Normal: 0 is bottom, maxVal is top)
    const getY = (val: number) => {
        if (type === 'trades') {
            // Normal axis (0 at bottom)
            // val=0 -> height-padding
            // val=max -> padding
            return (height - padding) - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
        } else {
            // Inverted axis (1 at top)
            return padding + ((val - minVal) / (maxVal - minVal || 1)) * chartH;
        }
    };

    // Points
    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>

                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <h3 className={`text-xl font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                        HISTÓRICO: {title}
                    </h3>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-black'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Chart Container */}
                <div className="p-6 overflow-x-auto">
                    <div className="min-w-[500px]">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                            {/* Grid Lines Y (Dynamic) */}
                            {Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 5) * (i + 1))).map(v => (
                                <g key={v}>
                                    <line
                                        x1={padding} y1={getY(v)}
                                        x2={width - padding} y2={getY(v)}
                                        stroke={isDarkMode ? '#333' : '#eee'}
                                        strokeDasharray="4"
                                    />
                                    <text
                                        x={padding - 10} y={getY(v)}
                                        fill={isDarkMode ? '#666' : '#999'}
                                        fontSize="10"
                                        textAnchor="end"
                                        alignmentBaseline="middle"
                                    >
                                        {v}{type === 'position' ? 'º' : ''}
                                    </text>
                                </g>
                            ))}

                            {/* Line */}
                            <polyline
                                points={points}
                                fill="none"
                                stroke={color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Dots */}
                            {data.map((d, i) => (
                                <g key={i} className="group">
                                    <circle
                                        cx={getX(i)} cy={getY(d.value)}
                                        r="4"
                                        fill={isDarkMode ? '#121212' : '#fff'}
                                        stroke={color}
                                        strokeWidth="3"
                                        className="transition-all duration-300 group-hover:r-6"
                                    />

                                    {/* Tooltip on Hover (Enhanced) */}
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                        {/* Background rect auto-sized (approx) */}
                                        <rect
                                            x={getX(i) - 75}
                                            y={getY(d.value) - 90}
                                            width="150"
                                            height="80"
                                            rx="12"
                                            fill={isDarkMode ? '#1A1A1A' : '#FFFFFF'}
                                            stroke={isDarkMode ? '#333' : '#E5E7EB'}
                                            strokeWidth="1"
                                            className="shadow-xl"
                                        />

                                        {/* Year */}
                                        <text x={getX(i)} y={getY(d.value) - 65} textAnchor="middle" fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="10" fontWeight="bold">
                                            {d.label}
                                        </text>

                                        {/* Position */}
                                        <text x={getX(i)} y={getY(d.value) - 48} textAnchor="middle" fill={color} fontSize="16" fontWeight="black">
                                            {d.value}{type === 'position' ? 'º Lugar' : ' Trades'}
                                        </text>

                                        {/* Entity Name (Team/Manager) */}
                                        <text x={getX(i)} y={getY(d.value) - 30} textAnchor="middle" fill={isDarkMode ? '#FFFFFF' : '#000000'} fontSize="11" fontWeight="bold" className="uppercase">
                                            {d.meta?.entityName === 'Sem Time' ? '---' : (d.meta?.entityName?.length && d.meta.entityName.length > 18 ? d.meta.entityName.substring(0, 18) + '...' : d.meta?.entityName || '-')}
                                        </text>

                                        {/* Record */}
                                        <text x={getX(i)} y={getY(d.value) - 15} textAnchor="middle" fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="9" fontWeight="bold">
                                            {d.meta?.wins}V - {d.meta?.losses}D - {d.meta?.ties}E
                                        </text>
                                    </g>

                                    {/* X Label */}
                                    <text
                                        x={getX(i)} y={height - padding + 20}
                                        textAnchor="middle"
                                        fill={isDarkMode ? '#999' : '#666'}
                                        fontSize="10"
                                        className="font-bold"
                                    >
                                        {d.label.split('/')[0]}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                    {/* Swipe Hint for Mobile */}
                    <div className="md:hidden flex items-center justify-center gap-2 mt-4 text-[10px] text-gray-500 font-bold uppercase animate-pulse">
                        <span>arraste pro lado</span>
                        <div className="flex gap-1">
                            <span>←</span>
                            <span>→</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                        {type === 'position' ? 'Evolução de posição por temporada (Menor é melhor)' : 'Evolução de Trades por temporada (Maior é melhor)'}
                    </p>
                    {/* Total Record Summary */}
                    {data.length > 0 && (
                        <div className={`inline-flex items-center gap-4 px-4 py-2 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="text-xs font-black uppercase text-gray-500">Total:</div>
                            <div className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {type === 'position' ?
                                    `${data.reduce((acc, curr) => acc + (curr.meta?.wins || 0), 0)}V - ${data.reduce((acc, curr) => acc + (curr.meta?.losses || 0), 0)}D`
                                    : `${data.reduce((acc, curr) => acc + curr.value, 0)} Trades`
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
