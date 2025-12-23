import { AttendanceRecord } from '../types';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date();
twoDaysAgo.setDate(today.getDate() - 2);

// FIX: Corrected mock data to align with the AttendanceRecord type.
export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
    {
        id: 'att-1',
        submitterName: 'Carlos Pereira',
        presentCount: 10,
        onlineCount: 2,
        totalCount: 12,
        date: today.toISOString(),
        // FIX: Added missing BaseRecord properties.
        createdAt: new Date().toISOString(),
        createdBy: 'mock@user.com',
        isActive: true,
    },
    {
        id: 'att-2',
        submitterName: 'Ana Souza',
        presentCount: 13,
        onlineCount: 2,
        totalCount: 15,
        date: yesterday.toISOString(),
        // FIX: Added missing BaseRecord properties.
        createdAt: new Date().toISOString(),
        createdBy: 'mock@user.com',
        isActive: true,
    },
     {
        id: 'att-3',
        submitterName: 'Mariana Ferreira',
        presentCount: 8,
        onlineCount: 2,
        totalCount: 10,
        date: yesterday.toISOString(),
        // FIX: Added missing BaseRecord properties.
        createdAt: new Date().toISOString(),
        createdBy: 'mock@user.com',
        isActive: true,
    },
    {
        id: 'att-4',
        submitterName: 'João da Silva',
        presentCount: 11,
        onlineCount: 3,
        totalCount: 14,
        date: twoDaysAgo.toISOString(),
        // FIX: Added missing BaseRecord properties.
        createdAt: new Date().toISOString(),
        createdBy: 'mock@user.com',
        isActive: true,
    },
];