
import React from 'react';

interface LineChartProps {
    title: string;
    data: number[];
    labels: string[];
    isLoading: boolean;
}

const LineChart: React.FC<LineChartProps> = ({ title, data, labels, isLoading }) => {
    if (isLoading) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
                <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg h-64 w-full"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-lg h-64 w-full">
                    <p className="text-slate-500 dark:text-slate-400">Dados insuficientes para exibir o gráfico.</p>
                </div>
            </div>
        );
    }
    
    const chartHeight = 250;
    const chartWidth = 500; // viewbox width
    const padding = 40;
    const yMax = Math.max(...data, 0);
    const yMin = 0;
    const xStep = (chartWidth - 2 * padding) / (data.length > 1 ? data.length - 1 : 1);
    
    const getPath = () => {
        if (data.length === 0) return "";
        const points = data.map((d, i) => {
            const yRange = yMax - yMin;
            const yValue = (yRange > 0) ? ((d - yMin) / yRange) * (chartHeight - 2 * padding) : 0;
            const x = padding + i * xStep;
            const y = chartHeight - padding - yValue;
            return `${x},${y}`;
        });
        return `M ${points.join(" L ")}`;
    };

    const yAxisLabels = () => {
        const labels = [];
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const value = yMin + (i / steps) * (yMax - yMin);
            const yPos = chartHeight - padding - (i / steps) * (chartHeight - 2 * padding);
            labels.push(
                <text key={`y-label-${i}`} x={padding - 10} y={yPos} textAnchor="end" alignmentBaseline="middle" className="text-sm fill-current text-slate-500 dark:text-slate-400">
                    {Math.round(value)}
                </text>
            );
        }
        return labels;
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
            <div className="relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* Y-axis grid lines */}
                    <g className="text-slate-200 dark:text-slate-700">
                         {[...Array(5)].map((_, i) => (
                             <line key={`grid-${i}`} x1={padding} x2={chartWidth - padding} y1={padding + i * ((chartHeight - 2 * padding)/4)} y2={padding + i * ((chartHeight - 2 * padding)/4)} stroke="currentColor" strokeDasharray="2,2"/>
                         ))}
                    </g>

                    {/* Y Axis Labels */}
                    {yAxisLabels()}

                    {/* X Axis Labels */}
                    {labels.map((label, i) => (
                         <text key={`x-label-${i}`} x={padding + i * xStep} y={chartHeight - padding + 20} textAnchor="middle" className="text-sm fill-current text-slate-500 dark:text-slate-400">
                            {label}
                        </text>
                    ))}

                    {/* Line Path */}
                    <path d={getPath()} stroke="#3b82f6" strokeWidth="2" fill="none" />

                    {/* Data Points */}
                    {data.map((d, i) => {
                        const yRange = yMax - yMin;
                        const yValue = (yRange > 0) ? ((d - yMin) / yRange) * (chartHeight - 2 * padding) : 0;
                        const x = padding + i * xStep;
                        const y = chartHeight - padding - yValue;
                        return (
                             <circle key={`point-${i}`} cx={x} cy={y} r="3" fill="#3b82f6" className="transition-transform duration-200 hover:scale-150" />
                        )
                    })}
                </svg>
            </div>
        </div>
    );
};

export default LineChart;
