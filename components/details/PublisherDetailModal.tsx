
import React from 'react';
import { PublisherProfile } from '../../types';
import { XIcon, PencilIcon } from '../icons/Icons';

interface PublisherDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (publisher: PublisherProfile) => void;
    publisher: PublisherProfile;
}

const DetailSection: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
    <div className={`p-6 rounded-lg shadow ${className}`}>
        <h3 className="text-xl font-semibold mb-4 border-b pb-3">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-md font-semibold">{value || '-'}</p>
    </div>
);

const calculateTimeSince = (isoDate?: string): string => {
    if (!isoDate) return 'Não informado';
    const startDate = new Date(isoDate);
    const endDate = new Date();

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    
    if (months < 0 || (months === 0 && endDate.getDate() < startDate.getDate())) {
        years--;
        months = (months + 12) % 12;
    }
    
    const yearText = years > 0 ? `${years} ano${years > 1 ? 's' : ''}` : '';
    const monthText = months > 0 ? `${months} ${months > 1 ? 'meses' : 'mês'}` : '';

    if (yearText && monthText) return `${yearText} e ${monthText}`;
    if (yearText) return yearText;
    if (monthText) return monthText;
    if (years === 0 && months === 0) return 'Menos de um mês';
    return 'Data inválida';
};

const PublisherDetailModal: React.FC<PublisherDetailModalProps> = ({ isOpen, onClose, onEdit, publisher }) => {
    if (!isOpen) return null;

    const theocraticRoles = [
        publisher.isElder && 'Ancião',
        publisher.isMinisterialServant && 'Servo Ministerial',
        publisher.isRegularPioneer && 'Pioneiro Regular',
        publisher.isAuxiliaryPioneer && 'Pioneiro Auxiliar',
        publisher.isPublisher && 'Publicador',
        publisher.isUnbaptizedPublisher && 'Publicador não Batizado',
    ].filter(Boolean).join(', ');

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {publisher.name}
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onEdit(publisher)} className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                           <PencilIcon className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <DetailSection title="Contato Pessoal" className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Telefone" value={<a href={`tel:${publisher.phone}`} className="hover:underline">{publisher.phone}</a>} />
                            <DetailItem label="Email" value={<a href={`mailto:${publisher.email}`} className="hover:underline">{publisher.email}</a>} />
                        </div>
                        <DetailItem label="Endereço" value={publisher.address} />
                    </DetailSection>

                     <DetailSection title="Datas Importantes" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <DetailItem label="Data de Nascimento" value={new Date(publisher.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} />
                             <DetailItem label="Data de Batismo" value={publisher.baptismDate ? new Date(publisher.baptismDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Não informado'} />
                            <DetailItem label="Tempo de Batismo" value={calculateTimeSince(publisher.baptismDate)} />
                        </div>
                    </DetailSection>

                    <DetailSection title="Designação Teocrática" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Grupo de Serviço" value={publisher.group} />
                            <DetailItem label="Designações" value={theocraticRoles} />
                        </div>
                        <DetailItem label="Outros Privilégios" value={publisher.privileges} />
                    </DetailSection>

                    <DetailSection title="Contato de Emergência" className="bg-rose-50 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Nome" value={publisher.emergencyContactName} />
                            <DetailItem label="Telefone" value={<a href={`tel:${publisher.emergencyContactPhone}`} className="hover:underline">{publisher.emergencyContactPhone}</a>} />
                        </div>
                    </DetailSection>

                    {publisher.notes && (
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                             <DetailItem label="Observações Gerais" value={<p className="whitespace-pre-wrap italic">{publisher.notes}</p>} />
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default PublisherDetailModal;
