import { FieldServiceReport } from '../types';

// FIX: Corrected mock data to align with the FieldServiceReport type.
export const MOCK_REPORTS: FieldServiceReport[] = [
    {
        id: 'rep-1',
        publisherId: 'pub-1',
        publisherName: 'João da Silva',
        group: '1',
        date: new Date(2024, 6, 15).toISOString(),
        privilege: 'PUBLISHER',
        hasParticipated: true,
        notes: 'Participou da campanha especial.',
        submittedAt: new Date(2024, 7, 5).toISOString(),
    },
    {
        id: 'rep-2',
        publisherId: 'pub-2',
        publisherName: 'Maria Oliveira',
        group: '2',
        date: new Date(2024, 6, 15).toISOString(),
        privilege: 'PUBLISHER',
        hasParticipated: false,
        notes: '',
        submittedAt: new Date(2024, 7, 4).toISOString(),
    },
    {
        id: 'rep-3',
        publisherId: 'pub-3',
        publisherName: 'Pedro Costa',
        group: '3',
        date: new Date(2024, 5, 15).toISOString(),
        privilege: 'PIONEER',
        hours: 35,
        notes: 'Auxiliou como pioneiro auxiliar.',
        submittedAt: new Date(2024, 6, 3).toISOString(),
    },
];
