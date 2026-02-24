

import { getDbInstance } from './firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { 
    LifeMinistrySchedule, FieldServiceReport, AttendanceRecord, Territory, BusTicket, Assignment, 
    CleaningSchedule, FieldServiceMeeting, ConductorMeeting, ShepherdingVisit, PublicTalkSchedule, BaseRecord, PublisherProfile, Announcement, PioneerRecord 
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
    return { id: docRef.id, ...docData, createdAt: docData.createdAt.toDate().toISOString() } as T;
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

// Announcements
export const getAnnouncements = () => getActiveCollection<Announcement>('anuncios', 'createdAt', 'desc');
export const addAnnouncement = (data: any, userUid: string) => addBaseRecord<Announcement>('anuncios', data, userUid);
export const updateAnnouncement = (id: string, data: any, userUid: string) => updateBaseRecord<Announcement>('anuncios', id, data, userUid);
export const archiveAnnouncement = (id: string, userUid: string) => archiveBaseRecord('anuncios', id, userUid);

// Pioneer Planning
export const getPioneerRecords = () => getActiveCollection<PioneerRecord>('planejamento_pioneiro', 'createdAt', 'desc');
export const addPioneerRecord = (data: any, userUid: string) => addBaseRecord<PioneerRecord>('planejamento_pioneiro', data, userUid);
export const updatePioneerRecord = (id: string, data: any, userUid: string) => updateBaseRecord<PioneerRecord>('planejamento_pioneiro', id, data, userUid);
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