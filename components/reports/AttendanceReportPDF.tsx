
import React from 'react';

interface AnalysisData {
    summary: {
        totalMeetings: number;
        overallAverage: number;
        peakAttendance: number;
    };
    monthlyBreakdown: {
        month: string;
        total: number;
        average: number;
        meetings: number;
    }[];
}

interface AttendanceReportPDFProps {
    data: AnalysisData;
    period: { start: string; end: string };
}

const AttendanceReportPDF: React.FC<AttendanceReportPDFProps> = ({ data, period }) => {
    
    const formatDate = (dateString: string) => {
        const [year, month] = dateString.split('-');
        const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15));
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    };

    return (
        <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', color: 'black', fontFamily: 'sans-serif', fontSize: '10pt' }}>
            {/* Header */}
            <header style={{ textAlign: 'center', borderBottom: '2px solid #EEE', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, color: '#333' }}>Relatório de Assistência da Congregação</h1>
                <p style={{ fontSize: '12pt', color: '#555', margin: '5px 0 0 0' }}>Congregação Vila Cisper</p>
            </header>

            {/* Period */}
            <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '11pt' }}>
                    <span style={{ fontWeight: 'bold' }}>Período Analisado: </span>
                    {formatDate(period.start)} a {formatDate(period.end)}
                </p>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', borderBottom: '1px solid #CCC', paddingBottom: '5px', marginBottom: '15px' }}>Resumo Geral</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '10pt', color: '#666' }}>TOTAL DE REUNIÕES</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '22pt', fontWeight: 'bold' }}>{data.summary.totalMeetings}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10pt', color: '#666' }}>MÉDIA GERAL</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '22pt', fontWeight: 'bold' }}>{data.summary.overallAverage}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10pt', color: '#666' }}>PICO DE ASSISTÊNCIA</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '22pt', fontWeight: 'bold' }}>{data.summary.peakAttendance}</p>
                    </div>
                </div>
            </div>

            {/* Monthly Breakdown */}
            <div>
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', borderBottom: '1px solid #CCC', paddingBottom: '5px', marginBottom: '15px' }}>Detalhamento Mensal</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F0F0F0' }}>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #DDD' }}>Mês</th>
                            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #DDD' }}>Total</th>
                            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #DDD' }}>Média</th>
                            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #DDD' }}>Nº de Reuniões</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.monthlyBreakdown.map(m => (
                            <tr key={m.month}>
                                <td style={{ padding: '8px', borderBottom: '1px solid #EEE', fontWeight: 'bold' }}>{m.month}</td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #EEE' }}>{m.total}</td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #EEE' }}>{m.average}</td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #EEE' }}>{m.meetings}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
             {/* Footer */}
            <footer style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', textAlign: 'center', fontSize: '9pt', color: '#AAA' }}>
                Gerado pelo Aplicativo Congregacional VL Cisper em {new Date().toLocaleDateString('pt-BR')}
            </footer>
        </div>
    );
};

export default AttendanceReportPDF;
