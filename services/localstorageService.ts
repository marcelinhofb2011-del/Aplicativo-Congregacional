
import { 
    LifeMinistrySchedule, FieldServiceReport, AttendanceRecord, Territory, BusTicket, Assignment, 
    CleaningSchedule, FieldServiceMeeting, ConductorMeeting, ShepherdingVisit, PublicTalkSchedule, BaseRecord, TerritoryStatus, BusTicketStatus, PublisherProfile 
} from '../types';

// --- MOCK DATA (to be seeded into localStorage) ---
const createDate = (daysToAdd: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString();
};

const nextMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (1 + 7 - d.getDay()) % 7);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

const MOCK_SCHEDULES_DATA: LifeMinistrySchedule[] = [{
    id: 'lm-1',
    week: "15-21 de Julho",
    date: nextMonday().toISOString(),
    initialSong: '120',
    president: 'Antônio Ferreira',
    initialPrayer: 'José Almeida',
    treasuresTheme: { theme: '“Jeová abençoa os humildes e castiga os orgulhosos”', speaker: 'Sérgio Viana' },
    spiritualGems: { speaker: 'Ricardo Borges' },
    bibleReading: { student: 'Carlos Andrade' },
    studentParts: [
        { id: 'sp-1', theme: 'Primeira Conversa (Vídeo)', time: 5, student: 'Beatriz Lima', helper: 'Sofia Costa' },
        { id: 'sp-2', theme: 'Revisita', time: 3, student: 'Mariana Campos', helper: 'Gabriela Dias' },
        { id: 'sp-3', theme: 'Discurso', time: 5, student: 'Rafael Gomes', helper: '' },
        { id: 'sp-4', theme: '', time: 0, student: '', helper: '' },
    ],
    intermediateSong: '98',
    christianLifeParts: [
        { id: 'clp-1', theme: 'Necessidades Locais', time: 15, speaker: 'Fernando Duarte' },
        { id: 'clp-2', theme: 'Relatório da Comissão de Filial', time: 15, speaker: '(Vídeo)' },
        { id: 'clp-3', theme: '', time: 0, speaker: '' },
    ],
    congregationBibleStudy: { conductor: 'Fernando Duarte', reader: 'Paulo Ribeiro' },
    finalSong: '101',
    finalPrayer: 'Roberto Siqueira',
    createdAt: new Date().toISOString(),
    createdBy: 'mock@user.com',
    isActive: true,
}];

const MOCK_CLEANING_DATA: CleaningSchedule[] = [{
    id: 'cl-1',
    date: new Date().toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    group: 'Grupo 1',
    meetingDays: ['midweek', 'weekend'],
    notes: 'Limpeza geral de primavera.',
    createdAt: new Date().toISOString(),
    createdBy: 'mock@user.com',
    isActive: true,
}];

const MOCK_PUBLIC_TALKS_DATA: PublicTalkSchedule[] = [
    {
        id: 'pt-1',
        type: 'local',
        date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
        time: '18:00',
        theme: 'A paz de Deus — como pode protegê-lo?',
        song: '112',
        hasImage: true,
        speakerName: 'João da Silva',
        congregation: 'Congregação Central',
        createdAt: new Date().toISOString(),
        createdBy: 'mock@user.com',
        isActive: true,
    },
    {
        id: 'pt-2',
        type: 'away',
        date: new Date(new Date().setDate(new Date().getDate() + 17)).toISOString(),
        time: '09:30',
        theme: 'Quem é o seu Deus?',
        song: '88',
        hasImage: false,
        speakerName: 'Carlos Pereira (Visitante)',
        congregation: 'Congregação Norte',
        address: 'Rua das Flores, 123, Bairro Jardim',
        phone: '11987654321',
        createdAt: new Date().toISOString(),
        createdBy: 'mock@user.com',
        isActive: true,
    }
];

const MOCK_PUBLISHERS_DATA: PublisherProfile[] = [
    {
        id: 'pub-profile-1',
        name: 'João da Silva',
        birthDate: '1985-05-20T00:00:00.000Z',
        baptismDate: '2005-07-15T00:00:00.000Z',
        group: '1',
        address: 'Rua das Acácias, 123',
        phone: '11999991111',
        email: 'joao.silva@email.com',
        isPublisher: true,
        isUnbaptizedPublisher: false,
        isAuxiliaryPioneer: false,
        isRegularPioneer: false,
        isMinisterialServant: true,
        isElder: false,
        privileges: 'Operador de Som',
        emergencyContactName: 'Maria da Silva',
        emergencyContactPhone: '11988882222',
        notes: 'Disponível para ajudar com transportes.',
        createdAt: new Date().toISOString(),
        createdBy: 'mock@user.com',
        isActive: true,
    }
];


const MOCK_REPORTS_DATA: FieldServiceReport[] = [];
const MOCK_ATTENDANCE_DATA: AttendanceRecord[] = [];
const MOCK_TERRITORIES_DATA: Territory[] = Array.from({ length: 26 }, (_, i) => {
    const number = i + 1;
    const territory: Territory = { id: `T${number}`, number: number, status: TerritoryStatus.AVAILABLE };
    if (number === 5) {
        territory.status = TerritoryStatus.ASSIGNED;
        territory.assignment = { publisherName: 'João da Silva', checkoutDate: createDate(-20), expectedReturnDate: createDate(10), requestNotes: 'Território residencial com muitos prédios.' };
    } else if (number === 12) {
        territory.status = TerritoryStatus.REQUESTED;
        territory.assignment = { publisherName: 'Maria Oliveira', checkoutDate: createDate(0), expectedReturnDate: createDate(30), requestNotes: 'Gostaria de trabalhar neste território comercial.' };
    }
    return territory;
});
const MOCK_BUS_TICKETS_DATA: BusTicket[] = [{ id: 'ticket-1', saleDate: new Date(2024, 7, 1).toISOString(), name: 'João da Silva', document: '123.456.789-00', totalPeople: 2, days: ['Sexta', 'Sábado', 'Domingo'], unitPrice: 50, extraPeople: [{ id: 'ep-1', name: 'Maria da Silva', document: '987.654.321-11' }], totalAmount: 300, amountPaid: 300, change: 0, paymentMethod: 'PIX', status: BusTicketStatus.PAID, notes: 'Pagamento completo.' }];

// --- LOCALSTORAGE HELPER FUNCTIONS ---
const getItem = <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const setItem = <T>(key: string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Seed initial data if localStorage is empty
const seedData = () => {
    if (!localStorage.getItem('programacoes')) setItem('programacoes', MOCK_SCHEDULES_DATA);
    if (!localStorage.getItem('relatorios')) setItem('relatorios', MOCK_REPORTS_DATA);
    if (!localStorage.getItem('assistencia')) setItem('assistencia', MOCK_ATTENDANCE_DATA);
    if (!localStorage.getItem('territorios')) setItem('territorios', MOCK_TERRITORIES_DATA);
    if (!localStorage.getItem('passagens')) setItem('passagens', MOCK_BUS_TICKETS_DATA);
    if (!localStorage.getItem('limpeza')) setItem('limpeza', MOCK_CLEANING_DATA);
    if (!localStorage.getItem('discursos_publicos')) setItem('discursos_publicos', MOCK_PUBLIC_TALKS_DATA);
    if (!localStorage.getItem('publicadores')) setItem('publicadores', MOCK_PUBLISHERS_DATA);
    // Seed empty arrays for other collections to prevent errors on first load
    if (!localStorage.getItem('designacoes')) setItem('designacoes', []);
    // FIX: Add servico_campo seed to prevent errors on first load.
    if (!localStorage.getItem('servico_campo')) setItem('servico_campo', []);
    if (!localStorage.getItem('dirigentes')) setItem('dirigentes', []);
    if (!localStorage.getItem('pastoreio')) setItem('pastoreio', []);
};

seedData();

// --- METADATA HELPERS ---
const addMetadata = (data: any, userEmail: string) => ({
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy: userEmail,
    isActive: true,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail,
});

const updateMetadata = (data: any, userEmail: string) => ({
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail,
});

// --- GENERIC CRUD ---
const getCollection = async <T>(key: string, sortBy?: keyof T, order: 'asc' | 'desc' = 'desc'): Promise<T[]> => {
    const items = getItem<T>(key);
    if (sortBy) {
        items.sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return items;
};

const getActiveCollection = async <T extends BaseRecord>(key: string, sortBy: keyof T = 'createdAt' as keyof T, order: 'asc' | 'desc' = 'desc'): Promise<T[]> => {
    let items = getItem<T>(key).filter(item => item.isActive);
    items.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
    return items;
};

const addBaseRecord = async <T extends BaseRecord>(key: string, data: Omit<T, 'id' | keyof BaseRecord>, userEmail: string): Promise<T> => {
    const items = getItem<T>(key);
    const newItem = addMetadata(data, userEmail) as T;
    setItem(key, [...items, newItem]);
    return newItem;
};

const updateBaseRecord = async <T extends BaseRecord>(key: string, id: string, data: Partial<T>, userEmail: string): Promise<T> => {
    const items = getItem<T>(key);
    let updatedItem: T | undefined;
    const newItems = items.map(item => {
        if (item.id === id) {
            updatedItem = { ...item, ...updateMetadata(data, userEmail) };
            return updatedItem;
        }
        return item;
    });
    setItem(key, newItems);
    if (!updatedItem) throw new Error("Item not found");
    return updatedItem;
};

const archiveBaseRecord = async <T extends BaseRecord>(key: string, id: string, userEmail: string): Promise<void> => {
    await updateBaseRecord(key, id, { isActive: false } as Partial<T>, userEmail);
};

// --- API IMPLEMENTATIONS ---

// Life & Ministry
export const getSchedules = () => getActiveCollection<LifeMinistrySchedule>('programacoes', 'date');
export const addSchedule = (data: any, userEmail: string) => addBaseRecord('programacoes', data, userEmail);
export const updateSchedule = (id: string, data: any, userEmail: string) => updateBaseRecord('programacoes', id, data, userEmail);
export const archiveSchedule = (id: string, userEmail: string) => archiveBaseRecord('programacoes', id, userEmail);

// Reports
export const getReports = () => getCollection<FieldServiceReport>('relatorios', 'submittedAt');
export const addReport = async (report: Omit<FieldServiceReport, 'id'>): Promise<FieldServiceReport> => {
    const items = getItem<FieldServiceReport>('relatorios');
    const newReport = { ...report, id: crypto.randomUUID() };
    setItem('relatorios', [...items, newReport]);
    return newReport;
};

// Attendance
export const getAttendanceRecords = () => getCollection<AttendanceRecord>('assistencia', 'date');
export const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
    const items = getItem<AttendanceRecord>('assistencia');
    const newRecord = { ...record, id: crypto.randomUUID() };
    setItem('assistencia', [...items, newRecord]);
    return newRecord;
};

// Territories
export const getTerritories = () => getCollection<Territory>('territorios');
export const updateTerritory = async (id: string, territoryUpdate: Partial<Territory>): Promise<Territory> => {
    const items = getItem<Territory>('territorios');
    let updatedItem: Territory | undefined;
    const newItems = items.map(item => {
        if (item.id === id) {
            updatedItem = { ...item, ...territoryUpdate };
            return updatedItem;
        }
        return item;
    });
    setItem('territorios', newItems);
    if (!updatedItem) throw new Error("Territory not found");
    return updatedItem;
};

// Bus Tickets
export const getBusTickets = () => getCollection<BusTicket>('passagens', 'saleDate');
export const addBusTicket = async (ticket: Omit<BusTicket, 'id'>): Promise<BusTicket> => {
    const items = getItem<BusTicket>('passagens');
    const newTicket = { ...ticket, id: crypto.randomUUID() };
    setItem('passagens', [...items, newTicket]);
    return newTicket;
};
export const updateBusTicket = async (id: string, ticket: Partial<BusTicket>): Promise<BusTicket> => {
    const items = getItem<BusTicket>('passagens');
    let updatedItem: BusTicket | undefined;
    const newItems = items.map(item => {
        if (item.id === id) {
            updatedItem = { ...item, ...ticket };
            return updatedItem;
        }
        return item;
    });
    setItem('passagens', newItems);
    if (!updatedItem) throw new Error("Ticket not found");
    return updatedItem;
};
export const deleteBusTicket = async (id: string): Promise<void> => {
    const items = getItem<BusTicket>('passagens');
    const newItems = items.filter(item => item.id !== id);
    setItem('passagens', newItems);
};


// Assignments
export const getAssignments = () => getActiveCollection<Assignment>('designacoes', 'date');
export const addAssignment = (data: any, userEmail: string) => addBaseRecord('designacoes', data, userEmail);
export const updateAssignment = (id: string, data: any, userEmail: string) => updateBaseRecord('designacoes', id, data, userEmail);
export const archiveAssignment = (id: string, userEmail: string) => archiveBaseRecord('designacoes', id, userEmail);

// Cleaning
export const getCleaningSchedules = () => getActiveCollection<CleaningSchedule>('limpeza', 'date');
export const addCleaningSchedule = (data: any, userEmail: string) => addBaseRecord('limpeza', data, userEmail);
export const updateCleaningSchedule = (id: string, data: any, userEmail: string) => updateBaseRecord('limpeza', id, data, userEmail);
export const archiveCleaningSchedule = (id: string, userEmail: string) => archiveBaseRecord('limpeza', id, userEmail);

// FIX: Add functions for Field Service Meetings to fix import errors.
// Field Service
export const getFieldServiceMeetings = () => getActiveCollection<FieldServiceMeeting>('servico_campo', 'date');
export const addFieldServiceMeeting = (data: any, userEmail: string) => addBaseRecord('servico_campo', data, userEmail);
export const updateFieldServiceMeeting = (id: string, data: any, userEmail: string) => updateBaseRecord('servico_campo', id, data, userEmail);
export const archiveFieldServiceMeeting = (id: string, userEmail: string) => archiveBaseRecord('servico_campo', id, userEmail);

// Conductors
export const getConductorMeetings = () => getActiveCollection<ConductorMeeting>('dirigentes', 'date');
export const addConductorMeeting = (data: any, userEmail: string) => addBaseRecord('dirigentes', data, userEmail);
export const updateConductorMeeting = (id: string, data: any, userEmail: string) => updateBaseRecord('dirigentes', id, data, userEmail);
export const archiveConductorMeeting = (id: string, userEmail: string) => archiveBaseRecord('dirigentes', id, userEmail);

// Shepherding
export const getShepherdingVisits = () => getActiveCollection<ShepherdingVisit>('pastoreio', 'date');
export const addShepherdingVisit = (data: any, userEmail: string) => addBaseRecord('pastoreio', data, userEmail);
export const updateShepherdingVisit = (id: string, data: any, userEmail: string) => updateBaseRecord('pastoreio', id, data, userEmail);
export const archiveShepherdingVisit = (id: string, userEmail: string) => archiveBaseRecord('pastoreio', id, userEmail);

// Public Talks
export const getPublicTalks = () => getActiveCollection<PublicTalkSchedule>('discursos_publicos', 'date', 'asc');
export const addPublicTalk = (data: any, userEmail: string) => addBaseRecord('discursos_publicos', data, userEmail);
export const updatePublicTalk = (id: string, data: any, userEmail: string) => updateBaseRecord('discursos_publicos', id, data, userEmail);
export const archivePublicTalk = (id: string, userEmail: string) => archiveBaseRecord('discursos_publicos', id, userEmail);

// Publisher Profiles
export const getPublisherProfiles = () => getActiveCollection<PublisherProfile>('publicadores', 'name', 'asc');
export const addPublisherProfile = (data: any, userEmail: string) => addBaseRecord<PublisherProfile>('publicadores', data, userEmail);
export const updatePublisherProfile = (id: string, data: any, userEmail: string) => updateBaseRecord<PublisherProfile>('publicadores', id, data, userEmail);
export const archivePublisherProfile = (id: string, userEmail: string) => archiveBaseRecord<PublisherProfile>('publicadores', id, userEmail);
