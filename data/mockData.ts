
export interface Schedule {
    id: number;
    type: string; // Should match a label in ALL_NAV_ITEMS
    title: string;
    date: string; // ISO 8601 format
    details: string;
}

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(19, 30, 0, 0);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 5);
nextWeek.setHours(10, 0, 0, 0);

const inTwoWeeks = new Date();
inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
inTwoWeeks.setHours(20, 0, 0, 0);

const nextMonth = new Date();
nextMonth.setDate(nextMonth.getDate() + 30);
nextMonth.setHours(9, 0, 0, 0);

const inTwoMonths = new Date();
inTwoMonths.setDate(inTwoMonths.getDate() + 60);
inTwoMonths.setHours(18, 0, 0, 0);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);


export const MOCK_SCHEDULES: Schedule[] = [
    {
        id: 1,
        type: 'Vida e Ministério',
        title: 'Reunião Vida e Ministério',
        date: tomorrow.toISOString(),
        details: 'Presidente: João Silva. Partes: Tesouros, Faça seu Melhor, Vida Cristã.'
    },
    {
        id: 2,
        type: 'Limpeza',
        title: 'Limpeza do Salão do Reino',
        date: nextWeek.toISOString(),
        details: 'Grupo de Limpeza C. Responsável: Maria Oliveira.'
    },
    {
        id: 3,
        type: 'Designações',
        title: 'Designação de Leitura',
        date: inTwoWeeks.toISOString(),
        details: 'Leitor da Sentinela: Pedro Costa.'
    },
    {
        id: 4,
        type: 'Servo de Campo',
        title: 'Reunião para o Serviço de Campo',
        date: nextMonth.toISOString(),
        details: 'Local de encontro: Salão do Reino. Dirigente: Carlos Souza.'
    },
    {
        id: 5,
        type: 'Discurso Público',
        title: 'Discurso: "Como o Reino de Deus nos afeta?"',
        date: inTwoMonths.toISOString(),
        details: 'Orador Visitante: Marcos Andrade.'
    },
    {
        id: 6,
        type: 'Vida e Ministério',
        title: 'Reunião Vida e Ministério (Passada)',
        date: yesterday.toISOString(),
        details: 'Este evento não deve aparecer.'
    },
];
