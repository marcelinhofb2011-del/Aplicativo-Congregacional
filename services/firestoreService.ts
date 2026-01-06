
import { db, rtdb } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { ref, push, serverTimestamp } from 'firebase/database';
import { 
    LifeMinistrySchedule, FieldServiceReport, AttendanceRecord, Territory, BusTicket, Assignment, 
    CleaningSchedule, FieldServiceMeeting, ConductorMeeting, ShepherdingVisit, PublicTalkSchedule, BaseRecord, PublisherProfile 
} from '../types';

// Helper to convert Firestore docs to typed objects, handling Timestamps
const docsToObjects = <T>(snapshot: any): T[] => {
    return snapshot.docs.map((document: any) => {
        const data = document.data();
        const docWithId = { id: document.id, ...data };
        
        for (const key in docWithId) {
            if (docWithId[key] instanceof Timestamp) {
                docWithId[key] = docWithId[key].toDate().toISOString();
            }
        }
        return docWithId as T;
    });
};

// --- Metadata Helpers ---
const addMetadata = (data: any, userId: string) => ({
    ...data,
    createdAt: Timestamp.now(),
    createdBy: userId,
    isActive: true,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
});

const updateMetadata = (data: any, userId: string) => ({
    ...data,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
});

// --- Real-time Notification Helper ---
const pushNotification = (payload: { type: string, title: string, body: string, link: string }, userId: string) => {
    try {
        const notificationsRef = ref(rtdb, 'notifications');
        push(notificationsRef, {
            ...payload,
            timestamp: serverTimestamp(),
            createdBy: userId,
        });
    } catch (error) {
        console.error("Failed to push notification to RTDB:", error);
    }
};


// --- Life & Ministry ---
const schedulesCollection = collection(db, 'programacao');
export const getSchedules = async (): Promise<LifeMinistrySchedule[]> => {
    const snapshot = await getDocs(schedulesCollection);
    const allObjects = docsToObjects<LifeMinistrySchedule>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const addSchedule = async (schedule: Omit<LifeMinistrySchedule, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { ...schedule, date: Timestamp.fromDate(new Date(schedule.date)) };
    const result = await addDoc(schedulesCollection, addMetadata(data, userId));
    pushNotification({
        type: 'NEW_LIFE_MINISTRY',
        title: 'Nova Programação V&M',
        body: `A programação para a semana de ${schedule.week} foi criada.`,
        link: '/vida-e-ministerio'
    }, userId);
    return result;
};
export const updateSchedule = async (id: string, schedule: Partial<LifeMinistrySchedule>, userId: string) => {
    const data: any = { ...schedule };
    if (schedule.date) data.date = Timestamp.fromDate(new Date(schedule.date));
    return updateDoc(doc(db, 'programacao', id), updateMetadata(data, userId));
};
export const archiveSchedule = async (id: string, userId: string) => updateDoc(doc(db, 'programacao', id), updateMetadata({ isActive: false }, userId));


// --- Reports ---
const reportsCollection = collection(db, 'relatorios');
export const getReports = async (): Promise<FieldServiceReport[]> => {
    // Fetch all reports ordered by submission date
    const q = query(reportsCollection, orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    const allReports = docsToObjects<FieldServiceReport>(snapshot);
    // Filter on the client side to avoid composite index. isActive !== false includes active items and items without the field.
    return allReports.filter(report => report.isActive !== false);
};
export const addReport = async (report: Omit<FieldServiceReport, 'id'>) => {
    const data = { 
        ...report, 
        date: Timestamp.fromDate(new Date(report.date)),
        submittedAt: Timestamp.fromDate(new Date(report.submittedAt)),
        isActive: true,
    };
    return addDoc(reportsCollection, data);
};
export const updateReport = async (id: string, report: Partial<FieldServiceReport>, userId: string) => {
    const data: any = { ...report };
    if (report.date) data.date = Timestamp.fromDate(new Date(report.date));
    return updateDoc(doc(db, 'relatorios', id), updateMetadata(data, userId));
};
export const archiveReport = async (id: string, userId: string) => {
    return updateDoc(doc(db, 'relatorios', id), updateMetadata({ isActive: false }, userId));
};


// --- Attendance ---
const attendanceCollection = collection(db, 'assistencia');
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
    const snapshot = await getDocs(attendanceCollection);
    const allObjects = docsToObjects<AttendanceRecord>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { ...record, date: Timestamp.fromDate(new Date(record.date)) };
    return addDoc(attendanceCollection, addMetadata(data, userId));
};
export const updateAttendanceRecord = async (id: string, record: Partial<AttendanceRecord>, userId: string) => {
    const data: any = { ...record };
    if (record.date) data.date = Timestamp.fromDate(new Date(record.date));
    return updateDoc(doc(db, 'assistencia', id), updateMetadata(data, userId));
};
export const archiveAttendanceRecord = async (id: string, userId: string) => updateDoc(doc(db, 'assistencia', id), updateMetadata({ isActive: false }, userId));


// --- Territories (Does not follow BaseRecord structure yet) ---
const territoriesCollection = collection(db, 'territorios');
export const getTerritories = async (): Promise<Territory[]> => docsToObjects<Territory>(await getDocs(territoriesCollection));
export const updateTerritory = async (id: string, territory: Partial<Territory>) => {
    const dataToUpdate: any = { ...territory };
    if (territory.assignment?.checkoutDate) {
        dataToUpdate.assignment.checkoutDate = Timestamp.fromDate(new Date(territory.assignment.checkoutDate));
    }
    if (territory.assignment?.expectedReturnDate) {
        dataToUpdate.assignment.expectedReturnDate = Timestamp.fromDate(new Date(territory.assignment.expectedReturnDate));
    }
    return updateDoc(doc(db, 'territorios', id), dataToUpdate);
};


// --- Bus Tickets (Passagens) (Does not follow BaseRecord structure yet) ---
const passagesCollection = collection(db, 'passagens');
export const getBusTickets = async (): Promise<BusTicket[]> => docsToObjects<BusTicket>(await getDocs(query(passagesCollection, orderBy('saleDate', 'desc'))));
export const addBusTicket = async (ticket: Omit<BusTicket, 'id'>) => addDoc(passagesCollection, { ...ticket, saleDate: Timestamp.fromDate(new Date(ticket.saleDate)) });
export const updateBusTicket = async (id:string, ticket: Partial<BusTicket>) => {
    const dataToUpdate: Partial<BusTicket> = { ...ticket };
    if (ticket.saleDate) (dataToUpdate as any).saleDate = Timestamp.fromDate(new Date(ticket.saleDate));
    return updateDoc(doc(db, 'passagens', id), dataToUpdate);
};
export const deleteBusTicket = async (id: string) => deleteDoc(doc(db, 'passagens', id));

// --- Assignments ---
const assignmentsCollection = collection(db, 'designacoes');
export const getAssignments = async (): Promise<Assignment[]> => {
    const snapshot = await getDocs(assignmentsCollection);
    const allObjects = docsToObjects<Assignment>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const addAssignment = async (assignment: Omit<Assignment, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { ...assignment, date: Timestamp.fromDate(new Date(assignment.date)) };
    const result = await addDoc(assignmentsCollection, addMetadata(data, userId));
    pushNotification({
        type: 'NEW_ASSIGNMENT',
        title: 'Nova Designação de Plataforma',
        body: `Designações para ${new Date(assignment.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} foram criadas.`,
        link: '/designacoes'
    }, userId);
    return result;
};
export const updateAssignment = async (id: string, assignment: Partial<Assignment>, userId: string) => {
    const data: any = { ...assignment };
    if (assignment.date) data.date = Timestamp.fromDate(new Date(assignment.date));
    return updateDoc(doc(db, 'designacoes', id), updateMetadata(data, userId));
};
export const archiveAssignment = async (id: string, userId: string) => updateDoc(doc(db, 'designacoes', id), updateMetadata({ isActive: false }, userId));

// --- Cleaning ---
const cleaningCollection = collection(db, 'limpeza');
export const getCleaningSchedules = async (): Promise<CleaningSchedule[]> => {
    const snapshot = await getDocs(cleaningCollection);
    const allObjects = docsToObjects<CleaningSchedule>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const addCleaningSchedule = async (schedule: Omit<CleaningSchedule, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { 
        ...schedule, 
        date: Timestamp.fromDate(new Date(schedule.date)),
        endDate: Timestamp.fromDate(new Date(schedule.endDate)),
    };
    const result = await addDoc(cleaningCollection, addMetadata(data, userId));
    pushNotification({
        type: 'NEW_CLEANING',
        title: 'Nova Escala de Limpeza',
        body: `Uma nova escala para o ${schedule.group} foi adicionada.`,
        link: '/limpeza'
    }, userId);
    return result;
};
export const updateCleaningSchedule = async (id: string, schedule: Partial<CleaningSchedule>, userId: string) => {
    const data: any = { ...schedule };
    if (schedule.date) data.date = Timestamp.fromDate(new Date(schedule.date));
    if (schedule.endDate) data.endDate = Timestamp.fromDate(new Date(schedule.endDate));
    return updateDoc(doc(db, 'limpeza', id), updateMetadata(data, userId));
};
export const archiveCleaningSchedule = async (id: string, userId: string) => updateDoc(doc(db, 'limpeza', id), updateMetadata({ isActive: false }, userId));

// --- Field Service ---
const fieldServiceCollection = collection(db, 'servico_campo');
export const getFieldServiceMeetings = async (): Promise<FieldServiceMeeting[]> => {
    const snapshot = await getDocs(fieldServiceCollection);
    const allObjects = docsToObjects<FieldServiceMeeting>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const addFieldServiceMeeting = async (meeting: Omit<FieldServiceMeeting, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { ...meeting, date: Timestamp.fromDate(new Date(meeting.date)) };
    return addDoc(fieldServiceCollection, addMetadata(data, userId));
};
export const updateFieldServiceMeeting = async (id: string, meeting: Partial<FieldServiceMeeting>, userId: string) => {
    const data: any = { ...meeting };
    if (meeting.date) data.date = Timestamp.fromDate(new Date(meeting.date));
    return updateDoc(doc(db, 'servico_campo', id), updateMetadata(data, userId));
};
export const archiveFieldServiceMeeting = async (id: string, userId: string) => updateDoc(doc(db, 'servico_campo', id), updateMetadata({ isActive: false }, userId));

// --- Conductors ---
const conductorsCollection = collection(db, 'dirigentes');
export const getConductorMeetings = async (): Promise<ConductorMeeting[]> => {
    const snapshot = await getDocs(conductorsCollection);
    const allObjects = docsToObjects<ConductorMeeting>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const addConductorMeeting = async (meeting: Omit<ConductorMeeting, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { ...meeting, date: Timestamp.fromDate(new Date(meeting.date)) };
    const result = await addDoc(conductorsCollection, addMetadata(data, userId));
    pushNotification({
        type: 'NEW_CONDUCTOR',
        title: 'Novo Dirigente Adicionado',
        body: `${meeting.conductorName} foi adicionado como dirigente para ${new Date(meeting.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}.`,
        link: '/dirigentes'
    }, userId);
    return result;
};
export const updateConductorMeeting = async (id: string, meeting: Partial<ConductorMeeting>, userId: string) => {
    const data: any = { ...meeting };
    if (meeting.date) data.date = Timestamp.fromDate(new Date(meeting.date));
    return updateDoc(doc(db, 'dirigentes', id), updateMetadata(data, userId));
};
export const archiveConductorMeeting = async (id: string, userId: string) => updateDoc(doc(db, 'dirigentes', id), updateMetadata({ isActive: false }, userId));

// --- Shepherding ---
const shepherdingCollection = collection(db, 'pastoreio');
export const getShepherdingVisits = async (): Promise<ShepherdingVisit[]> => {
    const snapshot = await getDocs(shepherdingCollection);
    const allObjects = docsToObjects<ShepherdingVisit>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const addShepherdingVisit = async (visit: Omit<ShepherdingVisit, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { ...visit, date: Timestamp.fromDate(new Date(visit.date)) };
    const result = await addDoc(shepherdingCollection, addMetadata(data, userId));
    pushNotification({
        type: 'NEW_SHEPHERDING',
        title: 'Nova Visita de Pastoreio',
        body: `Uma visita para ${visit.brotherName} foi agendada.`,
        link: '/pastoreio'
    }, userId);
    return result;
};
export const updateShepherdingVisit = async (id: string, visit: Partial<ShepherdingVisit>, userId: string) => {
    const data: any = { ...visit };
    if (visit.date) data.date = Timestamp.fromDate(new Date(visit.date));
    return updateDoc(doc(db, 'pastoreio', id), updateMetadata(data, userId));
};
export const archiveShepherdingVisit = async (id: string, userId: string) => updateDoc(doc(db, 'pastoreio', id), updateMetadata({ isActive: false }, userId));

// --- Public Talks ---
const publicTalksCollection = collection(db, 'discursos_publicos');
export const getPublicTalks = async (): Promise<PublicTalkSchedule[]> => {
    const snapshot = await getDocs(publicTalksCollection);
    const allObjects = docsToObjects<PublicTalkSchedule>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
export const addPublicTalk = async (talk: Omit<PublicTalkSchedule, 'id' | keyof BaseRecord>, userId: string) => {
    const data = { ...talk, date: Timestamp.fromDate(new Date(talk.date)) };
    const result = await addDoc(publicTalksCollection, addMetadata(data, userId));
    pushNotification({
        type: 'NEW_PUBLIC_TALK',
        title: 'Novo Discurso Agendado',
        body: `Discurso "${talk.theme}" agendado para ${talk.speakerName}.`,
        link: '/discurso-publico'
    }, userId);
    return result;
};
export const updatePublicTalk = async (id: string, talk: Partial<PublicTalkSchedule>, userId: string) => {
    const data: any = { ...talk };
    if (talk.date) data.date = Timestamp.fromDate(new Date(talk.date));
    return updateDoc(doc(db, 'discursos_publicos', id), updateMetadata(data, userId));
};
export const archivePublicTalk = async (id: string, userId: string) => updateDoc(doc(db, 'discursos_publicos', id), updateMetadata({ isActive: false }, userId));

// --- Publisher Profiles ---
const publishersCollection = collection(db, 'publicadores');
export const getPublisherProfiles = async (): Promise<PublisherProfile[]> => {
    const snapshot = await getDocs(publishersCollection);
    const allObjects = docsToObjects<PublisherProfile>(snapshot);
    return allObjects
        .filter(item => item.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
};
export const addPublisherProfile = async (profile: Omit<PublisherProfile, 'id' | keyof BaseRecord>, userId: string) => {
    const data: any = { ...profile };
    if (profile.birthDate) {
        data.birthDate = Timestamp.fromDate(new Date(profile.birthDate));
    } else {
        delete data.birthDate;
    }
    if (profile.baptismDate) {
        data.baptismDate = Timestamp.fromDate(new Date(profile.baptismDate));
    } else {
        delete data.baptismDate;
    }
    return addDoc(publishersCollection, addMetadata(data, userId));
};
export const updatePublisherProfile = async (id: string, profile: Partial<PublisherProfile>, userId: string) => {
    const data: any = { ...profile };
    
    // Handle optional birthDate
    if (profile.birthDate) {
        data.birthDate = Timestamp.fromDate(new Date(profile.birthDate));
    } else if (profile.hasOwnProperty('birthDate')) {
        data.birthDate = null;
    }
    
    // Handle optional baptismDate
    if (profile.baptismDate) {
        data.baptismDate = Timestamp.fromDate(new Date(profile.baptismDate));
    } else if (profile.hasOwnProperty('baptismDate')) {
        data.baptismDate = null;
    }

    return updateDoc(doc(db, 'publicadores', id), updateMetadata(data, userId));
};
export const archivePublisherProfile = async (id: string, userId: string) => updateDoc(doc(db, 'publicadores', id), updateMetadata({ isActive: false }, userId));
