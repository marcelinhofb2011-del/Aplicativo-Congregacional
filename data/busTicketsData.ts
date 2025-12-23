
import { BusTicket, BusTicketStatus } from '../types';

export const MOCK_BUS_TICKETS: BusTicket[] = [
    {
        id: 'ticket-1',
        saleDate: new Date(2024, 7, 1).toISOString(),
        name: 'João da Silva',
        document: '123.456.789-00',
        totalPeople: 2,
        days: ['Sexta', 'Sábado', 'Domingo'],
        unitPrice: 50,
        extraPeople: [{ id: 'ep-1', name: 'Maria da Silva', document: '987.654.321-11' }],
        totalAmount: 300,
        amountPaid: 300,
        change: 0,
        paymentMethod: 'PIX',
        status: BusTicketStatus.PAID,
        notes: 'Pagamento completo.'
    },
    {
        id: 'ticket-2',
        saleDate: new Date(2024, 7, 3).toISOString(),
        name: 'Carlos Pereira',
        document: '111.222.333-44',
        totalPeople: 1,
        days: ['Sábado', 'Domingo'],
        unitPrice: 50,
        extraPeople: [],
        totalAmount: 100,
        amountPaid: 50,
        change: 0,
        paymentMethod: 'Dinheiro',
        status: BusTicketStatus.PARTIAL,
        notes: 'Pagará o restante na próxima semana.'
    },
    {
        id: 'ticket-3',
        saleDate: new Date(2024, 7, 5).toISOString(),
        name: 'Ana Souza',
        document: '555.666.777-88',
        totalPeople: 4,
        days: ['Sexta', 'Sábado', 'Domingo'],
        unitPrice: 50,
        extraPeople: [
            { id: 'ep-2', name: 'Pedro Souza', document: '1' },
            { id: 'ep-3', name: 'Bia Souza', document: '2' },
            { id: 'ep-4', name: 'Lucas Souza', document: '3' },
        ],
        totalAmount: 600,
        amountPaid: 0,
        change: 0,
        paymentMethod: '',
        status: BusTicketStatus.RESERVED,
        notes: 'Reserva para a família.'
    }
];
