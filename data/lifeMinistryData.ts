
import { LifeMinistrySchedule } from '../types';

const nextMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (1 + 7 - d.getDay()) % 7);
    d.setHours(19, 30, 0, 0);
    return d;
};

export const MOCK_LIFE_MINISTRY_SCHEDULES: LifeMinistrySchedule[] = [
    {
        id: 'lm-1',
        // FIX: Added missing properties and corrected structure to satisfy the LifeMinistrySchedule type.
        week: "15-21 de Julho",
        date: nextMonday().toISOString(),
        initialSong: '120',
        president: 'Antônio Ferreira',
        initialPrayer: 'José Almeida',
        treasuresTheme: { theme: '“Jeová abençoa os humildes e castiga os orgulhosos”', speaker: 'Sérgio Viana' },
        spiritualGems: { speaker: 'Ricardo Borges' },
        bibleReading: { student: 'Carlos Andrade' },
        studentParts: [
            { id: 'sp-2', theme: 'Primeira Conversa', time: 2, student: 'Beatriz Lima', helper: 'Sofia Costa' },
            { id: 'sp-3', theme: 'Revisita', time: 4, student: 'Mariana Campos', helper: 'Gabriela Dias' },
            { id: 'sp-4', theme: 'Estudo Bíblico', time: 6, student: 'Rafael Gomes', helper: 'Lucas Martins' },
            { id: 'sp-5', theme: '', time: 0, student: '', helper: '' },
        ],
        intermediateSong: '98',
        christianLifeParts: [
            { id: 'clp-1', theme: 'Necessidades Locais', time: 15, speaker: 'Ricardo Borges' },
            { id: 'clp-2', theme: 'Como Fazer Amigos que Amam a Jeová', time: 15, speaker: 'Sérgio Viana' },
            { id: 'clp-3', theme: '', time: 0, speaker: '' },
        ],
        congregationBibleStudy: {
            conductor: 'Fernando Duarte',
            reader: 'Paulo Ribeiro',
        },
        finalSong: '101',
        finalPrayer: 'Roberto Siqueira',
        createdAt: new Date().toISOString(),
        createdBy: 'mock-user@example.com',
        isActive: true,
    },
];
