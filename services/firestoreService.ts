

import { getDbInstance } from './firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    doc,
    deleteDoc,
    limit,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { 
    LifeMinistrySchedule, FieldServiceReport, AttendanceRecord, Territory, BusTicket, Assignment, 
    CleaningSchedule, FieldServiceMeeting, ConductorMeeting, ShepherdingVisit, PublicTalkSchedule, BaseRecord, PublisherProfile, Announcement, PioneerRecord,
    MonthlyFieldServiceReport, MeetingSchedule, FirstSundayConductor
} from '../types';


// Helper to convert Firestore doc to our types, handling Timestamps
const fromFirestore = <T>(snapshot: QueryDocumentSnapshot<DocumentData>): T => {
    const data = snapshot.data();
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (data[key] instanceof Timestamp) {
                data[key] = data[key].toDate().toISOString();
            }
        }
    }
    return { ...data, id: snapshot.id } as T;
};

// --- GENERIC CRUD HELPERS ---

const getCollection = async <T>(collectionName: string, sortField?: keyof T, order: 'asc' | 'desc' = 'desc'): Promise<T[]> => {
    const db = getDbInstance();
    const collRef = collection(db, collectionName);
    const q = sortField ? query(collRef, orderBy(sortField as string, order)) : query(collRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<T>(doc));
};

const getActiveCollection = async <T extends BaseRecord>(collectionName: string, sortField: keyof T = 'createdAt' as keyof T, order: 'asc' | 'desc' = 'desc'): Promise<T[]> => {
    const allItems = await getCollection<T>(collectionName, sortField, order);
    return allItems.filter(item => item.isActive === true);
};


const addBaseRecord = async <T extends BaseRecord>(collectionName: string, data: Omit<T, 'id' | keyof BaseRecord>, userUid: string): Promise<T> => {
    const db = getDbInstance();
    const docData = {
        ...data,
        createdBy: userUid,
        createdAt: Timestamp.now(),
        updatedBy: userUid,
        updatedAt: Timestamp.now(),
        isActive: true,
    };
    const docRef = await addDoc(collection(db, collectionName), docData);
    return { id: docRef.id, ...docData, createdAt: docData.createdAt.toDate().toISOString() } as unknown as T;
};

const updateBaseRecord = async <T extends BaseRecord>(collectionName: string, id: string, data: Partial<T>, userUid: string): Promise<void> => {
    const db = getDbInstance();
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
        ...data,
        updatedBy: userUid,
        updatedAt: Timestamp.now(),
    });
};

const archiveBaseRecord = (collectionName: string, id: string, userUid: string): Promise<void> => {
    return updateBaseRecord(collectionName, id, { isActive: false } as any, userUid);
};


// --- API IMPLEMENTATIONS ---

// Life & Ministry
export const getSchedules = () => getCollection<LifeMinistrySchedule>('programacao', 'date', 'desc');
export const addSchedule = (data: any, userUid: string) => addBaseRecord('programacao', data, userUid);
export const updateSchedule = (id: string, data: any, userUid: string) => updateBaseRecord('programacao', id, data, userUid);
export const archiveSchedule = (id: string, userUid: string) => archiveBaseRecord('programacao', id, userUid);


// Reports
export const getReports = () => getCollection<FieldServiceReport>('relatorios', 'submittedAt');
export const addReport = async (report: Omit<FieldServiceReport, 'id' | 'submittedAt'>, userUid: string): Promise<FieldServiceReport> => {
    const db = getDbInstance();
    const docData = { 
        ...report, 
        submittedAt: Timestamp.now(), 
        isActive: true, 
        createdBy: userUid, 
        createdAt: Timestamp.now() 
    };
    const docRef = await addDoc(collection(db, 'relatorios'), docData);
    return { id: docRef.id, ...docData, submittedAt: docData.submittedAt.toDate().toISOString() } as FieldServiceReport;
};
export const updateReport = (id: string, data: Partial<FieldServiceReport>, userUid: string) => {
    const db = getDbInstance();
    return updateDoc(doc(db, 'relatorios', id), { ...data, updatedBy: userUid, updatedAt: Timestamp.now() });
};
export const archiveReport = (id: string, userUid: string) => updateReport(id, { isActive: false }, userUid);

// Attendance
export const getAttendanceRecords = () => getActiveCollection<AttendanceRecord>('assistencia', 'date', 'desc');
export const addAttendanceRecord = (data: any, userUid: string) => addBaseRecord('assistencia', data, userUid);
export const updateAttendanceRecord = (id: string, data: any, userUid: string) => updateBaseRecord('assistencia', id, data, userUid);
export const archiveAttendanceRecord = (id: string, userUid: string) => archiveBaseRecord('assistencia', id, userUid);

// Territories
export const getTerritories = () => getCollection<Territory>('territorios', 'number', 'asc');
export const updateTerritory = (id: string, territoryUpdate: Partial<Territory>) => {
    const db = getDbInstance();
    return updateDoc(doc(db, 'territorios', id), territoryUpdate);
};

// Bus Tickets
export const getBusTickets = () => getCollection<BusTicket>('passagens', 'saleDate');
export const addBusTicket = async (ticket: Omit<BusTicket, 'id'>) => {
    const db = getDbInstance();
    const docRef = await addDoc(collection(db, 'passagens'), { ...ticket, saleDate: Timestamp.fromDate(new Date(ticket.saleDate)) });
    return { id: docRef.id, ...ticket };
};
export const updateBusTicket = (id: string, ticket: Partial<BusTicket>) => {
    const db = getDbInstance();
    return updateDoc(doc(db, 'passagens', id), ticket);
};
export const deleteBusTicket = (id: string) => {
    const db = getDbInstance();
    return deleteDoc(doc(db, 'passagens', id));
};

// Assignments
export const getAssignments = () => getActiveCollection<Assignment>('designacoes', 'date', 'asc');
export const addAssignment = (data: any, userUid: string) => addBaseRecord('designacoes', data, userUid);
export const updateAssignment = (id: string, data: any, userUid: string) => updateBaseRecord('designacoes', id, data, userUid);
export const archiveAssignment = (id: string, userUid: string) => archiveBaseRecord('designacoes', id, userUid);

// Cleaning
export const getCleaningSchedules = () => getActiveCollection<CleaningSchedule>('limpeza', 'date', 'asc');
export const addCleaningSchedule = (data: any, userUid: string) => addBaseRecord('limpeza', data, userUid);
export const updateCleaningSchedule = (id: string, data: any, userUid: string) => updateBaseRecord('limpeza', id, data, userUid);
export const archiveCleaningSchedule = (id: string, userUid: string) => archiveBaseRecord('limpeza', id, userUid);

// Field Service (Now points to 'dirigentes')
export const getFieldServiceMeetings = () => getActiveCollection<FieldServiceMeeting>('dirigentes', 'date', 'desc');
export const addFieldServiceMeeting = (data: any, userUid: string) => addBaseRecord('dirigentes', data, userUid);
export const updateFieldServiceMeeting = (id: string, data: any, userUid: string) => updateBaseRecord('dirigentes', id, data, userUid);
export const archiveFieldServiceMeeting = (id: string, userUid: string) => archiveBaseRecord('dirigentes', id, userUid);

// Conductors
export const getConductorMeetings = () => getActiveCollection<ConductorMeeting>('dirigentes', 'date', 'asc');
export const addConductorMeeting = (data: any, userUid: string) => addBaseRecord('dirigentes', data, userUid);
export const updateConductorMeeting = (id: string, data: any, userUid: string) => updateBaseRecord('dirigentes', id, data, userUid);
export const archiveConductorMeeting = (id: string, userUid: string) => archiveBaseRecord('dirigentes', id, userUid);

// First Sunday Conductors
export const getFirstSundayConductors = () => getActiveCollection<FirstSundayConductor>('dirigentes_primeiro_domingo', 'month', 'desc');
export const addFirstSundayConductor = (data: any, userUid: string) => addBaseRecord('dirigentes_primeiro_domingo', data, userUid);
export const updateFirstSundayConductor = (id: string, data: any, userUid: string) => updateBaseRecord('dirigentes_primeiro_domingo', id, data, userUid);
export const archiveFirstSundayConductor = (id: string, userUid: string) => archiveBaseRecord('dirigentes_primeiro_domingo', id, userUid);

// Shepherding
export const getShepherdingVisits = () => getActiveCollection<ShepherdingVisit>('pastoreio', 'date', 'desc');
export const addShepherdingVisit = (data: any, userUid: string) => addBaseRecord('pastoreio', data, userUid);
export const updateShepherdingVisit = (id: string, data: any, userUid: string) => updateBaseRecord('pastoreio', id, data, userUid);
export const archiveShepherdingVisit = (id: string, userUid: string) => archiveBaseRecord('pastoreio', id, userUid);

// Public Talks
export const getPublicTalks = () => getActiveCollection<PublicTalkSchedule>('discursos_publicos', 'date', 'asc');
export const addPublicTalk = (data: any, userUid: string) => addBaseRecord('discursos_publicos', data, userUid);
export const updatePublicTalk = (id: string, data: any, userUid: string) => updateBaseRecord('discursos_publicos', id, data, userUid);
export const archivePublicTalk = (id: string, userUid: string) => archiveBaseRecord('discursos_publicos', id, userUid);

// Publisher Profiles
export const getPublisherProfiles = () => getActiveCollection<PublisherProfile>('publicadores', 'name', 'asc');
export const addPublisherProfile = (data: any, userUid: string) => addBaseRecord<PublisherProfile>('publicadores', data, userUid);
export const updatePublisherProfile = (id: string, data: any, userUid: string) => updateBaseRecord<PublisherProfile>('publicadores', id, data, userUid);
export const archivePublisherProfile = (id: string, userUid: string) => archiveBaseRecord('publicadores', id, userUid);

export const getPublisherProfileByUid = async (uid: string) => {
    const db = getDbInstance();
    const q = query(
        collection(db, "publicadores"),
        where('uid', '==', uid),
        where('isActive', '==', true),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return fromFirestore(snapshot.docs[0]) as PublisherProfile;
};

// Announcements
export const getAnnouncements = () => getActiveCollection<Announcement>('anuncios', 'createdAt', 'desc');
export const addAnnouncement = (data: any, userUid: string) => addBaseRecord<Announcement>('anuncios', data, userUid);
export const updateAnnouncement = (id: string, data: any, userUid: string) => updateBaseRecord<Announcement>('anuncios', id, data, userUid);
export const archiveAnnouncement = (id: string, userUid: string) => archiveBaseRecord('anuncios', id, userUid);

// Meeting Schedules (Programações)
export const getMeetingSchedules = () => getActiveCollection<MeetingSchedule>('programacoes_reuniao', 'date', 'asc');
export const addMeetingSchedule = (data: any, userUid: string) => addBaseRecord<MeetingSchedule>('programacoes_reuniao', data, userUid);
export const updateMeetingSchedule = (id: string, data: any, userUid: string) => updateBaseRecord<MeetingSchedule>('programacoes_reuniao', id, data, userUid);
export const archiveMeetingSchedule = (id: string, userUid: string) => archiveBaseRecord('programacoes_reuniao', id, userUid);

// Monthly Field Service Reports (Relatorios_Pregacao)
export const getMonthlyReports = (userUid: string) => {
    const db = getDbInstance();
    const q = query(
        collection(db, "relatorios_pregacao"),
        where('userId', '==', userUid),
        where('isActive', '==', true)
    );
    return getDocs(q).then(snapshot => snapshot.docs.map(doc => fromFirestore(doc) as MonthlyFieldServiceReport));
};

export const addMonthlyReport = (data: any, userUid: string) => {
    const db = getDbInstance();
    const docId = `${userUid}_${data.year}_${data.month}`;
    const docRef = doc(db, "relatorios_pregacao", docId);
    
    const now = new Date().toISOString();
    const record = {
        ...data,
        id: docId,
        createdAt: now,
        createdBy: userUid,
        updatedAt: now,
        updatedBy: userUid,
        isActive: true,
    };
    
    return setDoc(docRef, record);
};
export const updateMonthlyReport = (id: string, data: any, userUid: string) => updateBaseRecord<MonthlyFieldServiceReport>('relatorios_pregacao', id, data, userUid);

// Pioneer Planning
export const getPioneerRecords = () => getActiveCollection<PioneerRecord>('planejamento_pioneiro', 'createdAt', 'desc');

export const getPioneerRecordsByUser = (userUid: string) => {
    const db = getDbInstance();
    const q = query(
        collection(db, "planejamento_pioneiro"),
        where('createdBy', '==', userUid),
        where('isActive', '==', true)
    );
    return getDocs(q).then(snapshot => snapshot.docs.map(doc => fromFirestore(doc) as PioneerRecord));
};

export const addPioneerRecord = (data: any, userUid: string) => addBaseRecord<PioneerRecord>('planejamento_pioneiro', data, userUid);
export const updatePioneerRecord = (id: string, data: any, userUid: string) => updateBaseRecord<PioneerRecord>('planejamento_pioneiro', id, data, userUid);
export const setPioneerRecord = (data: PioneerRecord) => {
    const db = getDbInstance();
    const docRef = doc(db, "planejamento_pioneiro", data.id);
    const now = new Date().toISOString();
    const record = {
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: now,
        isActive: true,
    };
    return setDoc(docRef, record);
};
export const deletePioneerRecord = (id: string) => {
    const db = getDbInstance();
    return deleteDoc(doc(db, 'planejamento_pioneiro', id));
};

// Notifications
export const getUnreadNotifications = async (userUid: string) => {
    const db = getDbInstance();
    const q = query(
        collection(db, "notificacoes"),
        where('usuarioUid', '==', userUid),
        where('notificado', '==', false),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore(doc));
};

export const markNotificationsAsRead = async (notificationIds: string[]) => {
    const db = getDbInstance();
    const promises = notificationIds.map(id => {
        const docRef = doc(db, 'notificacoes', id);
        return updateDoc(docRef, { notificado: true });
    });
    await Promise.all(promises);
};

// Cleanup expired records
export const cleanupExpiredRecords = async (userUid: string) => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(todayStr + 'T00:00:00Z');

    const collectionsToCleanup = [
        { name: 'vida_ministerio', type: 'range' },
        { name: 'programacoes_reuniao', type: 'single' },
        { name: 'designacoes', type: 'single' },
        { name: 'discurso_publico', type: 'single' },
        { name: 'limpeza', type: 'range' },
    ];

    for (const coll of collectionsToCleanup) {
        try {
            const records = await getActiveCollection<any>(coll.name, 'date', 'asc');
            for (const record of records) {
                let isExpired = false;
                if (coll.type === 'range') {
                    const startDate = new Date(record.date);
                    const endDate = record.endDate ? new Date(record.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                    if (endDate < today) isExpired = true;
                } else if (coll.type === 'single') {
                    if (record.date && new Date(record.date) < today) isExpired = true;
                }
                
                if (isExpired) {
                    await archiveBaseRecord(coll.name, record.id, userUid);
                }
            }
        } catch (e) {
            console.error(`Error cleaning up ${coll.name}:`, e);
        }
    }

    // Special cleanup for announcements - older than 30 days
    try {
        const announcements = await getActiveCollection<any>('anuncios', 'createdAt', 'desc');
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        for (const ann of announcements) {
            if (new Date(ann.createdAt) < thirtyDaysAgo && !ann.isPinned) {
                await archiveBaseRecord('anuncios', ann.id, userUid);
            }
        }
    } catch (e) {
        console.error("Error cleaning up announcements:", e);
    }
};
