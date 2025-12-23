
import React, { useState, useEffect } from 'react';
import { PublisherProfile, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface PublisherFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<PublisherProfile, 'id' | keyof BaseRecord>) => void;
    initialData: PublisherProfile | null;
}

const BLANK_PUBLISHER: Omit<PublisherProfile, 'id' | keyof BaseRecord> = {
    name: '',
    birthDate: '',
    baptismDate: '',
    group: '',
    address: '',
    phone: '',
    email: '',
    isPublisher: true,
    isUnbaptizedPublisher: false,
    isAuxiliaryPioneer: false,
    isRegularPioneer: false,
    isMinisterialServant: false,
    isElder: false,
    privileges: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
};

// Helper functions for date conversion
const isoToDDMMYYYY = (isoString?: string): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Use UTC methods to avoid timezone issues when converting
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
};

const ddmmyyyyToISO = (dateStr?: string): string | 'invalid' | undefined => {
    if (!dateStr || dateStr.trim() === '') return undefined;
    
    // Regex to match DD/MM/YYYY or D/M/YYYY
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return 'invalid';

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(match[3], 10);

    // Validate day and month ranges
    if (month < 0 || month > 11 || day < 1 || day > 31) {
        return 'invalid';
    }

    const date = new Date(Date.UTC(year, month, day));

    // Final check if the constructed date is valid and matches the input values
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date.toISOString();
    }
    
    return 'invalid';
};

const FormSection: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
    <div className={`p-6 rounded-lg shadow ${className}`}>
        <h3 className="text-xl font-semibold mb-4 border-b pb-3">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const FormField: React.FC<{ label: string, name: string, value: string, onChange: any, type?: string, required?: boolean, placeholder?: string }> = 
({ label, name, value, onChange, type = 'text', required = false, placeholder }) => (
    <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange} required={required} className="input-style" placeholder={placeholder} />
    </div>
);

const CheckboxField: React.FC<{ label: string, name: string, checked: boolean, onChange: any }> = ({ label, name, checked, onChange }) => (
    <label className="flex items-center space-x-2">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 rounded text-primary focus:ring-primary" />
        <span>{label}</span>
    </label>
);

const PublisherFormModal: React.FC<PublisherFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Omit<PublisherProfile, 'id' | keyof BaseRecord> & { birthDate: string, baptismDate: string }>(BLANK_PUBLISHER as any);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                birthDate: isoToDDMMYYYY(initialData.birthDate),
                baptismDate: isoToDDMMYYYY(initialData.baptismDate),
                group: initialData.group,
                address: initialData.address,
                phone: initialData.phone,
                email: initialData.email,
                isPublisher: initialData.isPublisher,
                isUnbaptizedPublisher: initialData.isUnbaptizedPublisher,
                isAuxiliaryPioneer: initialData.isAuxiliaryPioneer,
                isRegularPioneer: initialData.isRegularPioneer,
                isMinisterialServant: initialData.isMinisterialServant,
                isElder: initialData.isElder,
                privileges: initialData.privileges || '',
                emergencyContactName: initialData.emergencyContactName,
                emergencyContactPhone: initialData.emergencyContactPhone,
                notes: initialData.notes || '',
            });
        } else {
            setFormData(BLANK_PUBLISHER as any);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const birthDateISO = ddmmyyyyToISO(formData.birthDate);
        if (birthDateISO === 'invalid' || !birthDateISO) {
            alert('Data de Nascimento inválida. Use o formato DD/MM/AAAA.');
            return;
        }
        
        const baptismDateISO = ddmmyyyyToISO(formData.baptismDate);
        if (baptismDateISO === 'invalid') {
            alert('Data de Batismo inválida. Use o formato DD/MM/AAAA.');
            return;
        }

        const dataToSave: Omit<PublisherProfile, 'id' | keyof BaseRecord> = {
            name: formData.name,
            birthDate: birthDateISO,
            baptismDate: baptismDateISO,
            group: formData.group,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            isPublisher: formData.isPublisher,
            isUnbaptizedPublisher: formData.isUnbaptizedPublisher,
            isAuxiliaryPioneer: formData.isAuxiliaryPioneer,
            isRegularPioneer: formData.isRegularPioneer,
            isMinisterialServant: formData.isMinisterialServant,
            isElder: formData.isElder,
            privileges: formData.privileges || '',
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            notes: formData.notes || '',
        };
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Publicador' : 'Novo Publicador'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <FormSection title="Contato Pessoal" className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800">
                        <FormField label="Nome Completo" name="name" value={formData.name} onChange={handleInputChange} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Telefone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                            <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                        </div>
                        <FormField label="Endereço" name="address" value={formData.address} onChange={handleInputChange} />
                    </FormSection>

                    <FormSection title="Datas Importantes" className="bg-white dark:bg-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Data de Nascimento" name="birthDate" type="text" value={formData.birthDate} onChange={handleInputChange} required placeholder="DD/MM/AAAA" />
                            <FormField label="Data de Batismo" name="baptismDate" type="text" value={formData.baptismDate || ''} onChange={handleInputChange} placeholder="DD/MM/AAAA" />
                        </div>
                    </FormSection>

                    <FormSection title="Designação Teocrática" className="bg-white dark:bg-slate-800">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <CheckboxField label="Publicador" name="isPublisher" checked={formData.isPublisher} onChange={handleCheckboxChange} />
                            <CheckboxField label="Pub. Ñ Batizado" name="isUnbaptizedPublisher" checked={formData.isUnbaptizedPublisher} onChange={handleCheckboxChange} />
                            <CheckboxField label="Pioneiro Aux." name="isAuxiliaryPioneer" checked={formData.isAuxiliaryPioneer} onChange={handleCheckboxChange} />
                            <CheckboxField label="Pioneiro Reg." name="isRegularPioneer" checked={formData.isRegularPioneer} onChange={handleCheckboxChange} />
                            <CheckboxField label="Servo Min." name="isMinisterialServant" checked={formData.isMinisterialServant} onChange={handleCheckboxChange} />
                            <CheckboxField label="Ancião" name="isElder" checked={formData.isElder} onChange={handleCheckboxChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Grupo de Serviço</label>
                            <select name="group" value={formData.group} onChange={handleInputChange} required className="input-style">
                                <option value="">Selecione</option>
                                <option value="1">Grupo 1</option>
                                <option value="2">Grupo 2</option>
                                <option value="3">Grupo 3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Outros Privilégios</label>
                            <textarea name="privileges" value={formData.privileges || ''} onChange={handleInputChange} rows={2} className="input-style" />
                        </div>
                    </FormSection>

                    <FormSection title="Contato de Emergência" className="bg-rose-50 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Nome do Contato" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} required />
                            <FormField label="Telefone do Contato" name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={handleInputChange} required />
                        </div>
                    </FormSection>

                     <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                         <label className="block text-sm font-medium mb-1">Observações Gerais</label>
                         <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="input-style" />
                     </div>

                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">
                            Salvar Publicador
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PublisherFormModal;
