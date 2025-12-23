
import React from 'react';

interface BarData {
    label: string;
    value: number;
    color: string;
}

interface BarChartProps {
    title: string;
    data: BarData[];
    isLoading: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, isLoading }) => {
    if (isLoading) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
                <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg h-64 w-full"></div>
            </div>
        );
    }
    
    const hasData = data && data.some(d => d.value > 0);

    if (!hasData) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-lg h-64 w-full">
                    <p className="text-slate-500 dark:text-slate-400">Nenhum relatório de serviço encontrado.</p>
                </div>
            </div>
        );
    }
    
    const chartHeight = 250;
    const chartWidth = 500; // viewbox width
    const paddingY = 40;
    const paddingX = 20;
    const yMax = Math.max(...data.map(d => d.value), 0);
    const barWidth = (chartWidth - 2 * paddingX) / data.length * 0.6;
    const barSpacing = (chartWidth - 2 * paddingX) / data.length * 0.4;

    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
            <div className="relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* Y-axis grid lines */}
                    <g className="text-slate-200 dark:text-slate-700">
                        {[...Array(5)].map((_, i) => {
                            const y = paddingY + i * ((chartHeight - 2 * paddingY) / 4);
                            return <line key={`grid-${i}`} x1={paddingX} x2={chartWidth - paddingX} y1={y} y2={y} stroke="currentColor" strokeDasharray="2,2" />;
                        })}
                        {/* Y-axis labels */}
                         {[...Array(5)].map((_, i) => {
                            const y = paddingY + i * ((chartHeight - 2 * paddingY) / 4);
                            const value = yMax > 0 ? yMax * (1 - i / 4) : 0;
                            return (
                                <text key={`y-label-${i}`} x={paddingX - 5} y={y} textAnchor="end" alignmentBaseline="middle" className="text-sm fill-current text-slate-500 dark:text-slate-400">
                                    {Math.round(value)}
                                </text>
                            );
                        })}
                    </g>

                    {/* Bars and X-axis Labels */}
                    {data.map((d, i) => {
                        const x = paddingX + i * (barWidth + barSpacing) + barSpacing / 2;
                        const barHeight = yMax > 0 ? (d.value / yMax) * (chartHeight - 2 * paddingY) : 0;
                        const y = chartHeight - paddingY - barHeight;

                        return (
                            <g key={d.label}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={d.color}
                                    rx="2"
                                    className="transition-opacity duration-300 hover:opacity-80"
                                />
                                <text x={x + barWidth / 2} y={chartHeight - paddingY + 15} textAnchor="middle" className="text-sm fill-current text-slate-500 dark:text-slate-400">
                                    {d.label}
                                </text>
                                 <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="text-sm font-semibold fill-current text-slate-700 dark:text-slate-300">
                                    {d.value.toFixed(1)}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default BarChart;
