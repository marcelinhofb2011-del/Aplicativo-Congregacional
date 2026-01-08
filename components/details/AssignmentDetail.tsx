
import React from 'react';
import { Assignment } from '../../types';

const AssignmentRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
    // Não renderiza a linha se o valor estiver vazio ou for apenas a barra de separação
    if (!value || value.trim() === '' || value.trim() === '/') return null;
    return (
        <p className="text-md text-slate-800 dark:text-slate-200">
            <span className="font-semibold">{label}:</span>
            <span className="ml-2">{value}</span>
        </p>
    );
};


const AssignmentDetail: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
    const formattedDate = new Date(assignment.date).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    const indicators = [assignment.indicator1, assignment.indicator2].filter(Boolean).join(' / ');
    const microphones = [assignment.mic1, assignment.mic2].filter(Boolean).join(' / ');

    return (
        <div className="p-4 sm:p-6">
            <h3 className="text-xl font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">
                Designações - {formattedDate}
            </h3>
            <div className="space-y-2">
                <AssignmentRow label="Indicador" value={indicators} />
                <AssignmentRow label="Microfone" value={microphones} />
                <AssignmentRow label="Leitor" value={assignment.reader} />
                <AssignmentRow label="Áudio" value={assignment.audio} />
                <AssignmentRow label="Vídeo" value={assignment.video} />

                {assignment.notes && (
                    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                         <p className="text-md text-slate-800 dark:text-slate-200">
                            <span className="font-semibold">Observações:</span>
                            <span className="ml-2 italic whitespace-pre-wrap">{assignment.notes}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentDetail;
