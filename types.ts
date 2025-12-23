export enum UserRole {
    PUBLISHER = 'PUBLISHER',
    SERVANT = 'SERVANT',
}

export interface User {
    uid: string;
    email: string | null;
    role: UserRole;
}

// Base record structure for all Firestore documents
export interface BaseRecord {
    id: string;
    createdAt: string; // ISO (Timestamp in Firestore)
    createdBy: string; // user UID
    updatedAt?: string; // ISO (Timestamp in Firestore)
    updatedBy?: string; // user UID
    isActive: boolean;
}


// Type for Dashboard Cards
export interface Schedule {
    id: string;
    type: string;
    title: string;
    date: string; // ISO 8601 format
    details: string;
}


// Types for Life & Ministry Feature
export interface StudentPart {
    id: string;
    theme: string;
    time: number;
    student: string;
    helper?: string;
}

export interface ChristianLifePart {
    id: string;
    theme: string;
    time: number;
    speaker: string;
}

export interface TreasuresPart {
    theme: string;
    speaker: string;
}

export interface SpiritualGemsPart {
    speaker:string;
}

export interface BibleReadingPart {
    student: string; // The reader's name
}

export interface LifeMinistrySchedule extends BaseRecord {
    // Header
    week: string; // e.g., "15–21 de dezembro"
    date: string; // ISO (Timestamp in Firestore)
    initialSong: string;
    president: string;
    initialPrayer: string;

    // Treasures of God's Word
    treasuresTheme: TreasuresPart;
    spiritualGems: SpiritualGemsPart;
    bibleReading: BibleReadingPart;

    // Apply Yourself to the Ministry
    studentParts: StudentPart[]; // Array of 4

    // Living as Christians
    intermediateSong: string;
    christianLifeParts: ChristianLifePart[]; // Array of 3

    // Congregation Bible Study
    congregationBibleStudy: {
        conductor: string;
        reader: string;
    };
    finalSong: string;
    finalPrayer: string;
}

// Types for Report Feature
export interface Publisher {
    id: string;
    name: string;
    group: '1' | '2' | '3';
}

export interface FieldServiceReport {
    id: string;
    publisherId: string;
    publisherName: string;
    date: string; // ISO format (Timestamp in Firestore)
    group: '1' | '2' | '3' | '';
    privilege: 'PIONEER' | 'PUBLISHER';
    hours?: number;
    minutes?: number;
    revisits?: number;
    studies?: number;
    hasParticipated?: boolean;
    notes?: string;
    submittedAt: string; // ISO format (Timestamp in Firestore)
    isActive?: boolean;
    updatedAt?: string;
    updatedBy?: string;
}


// Types for Attendance Feature
export interface AttendanceRecord extends BaseRecord {
    date: string; // ISO (Timestamp in Firestore)
    submitterName: string;
    presentCount: number;
    onlineCount: number;
    totalCount: number;
}


// Types for Territories Feature
export enum TerritoryStatus {
    AVAILABLE = 'AVAILABLE',
    REQUESTED = 'REQUESTED',
    ASSIGNED = 'ASSIGNED',
}

export interface TerritoryAssignment {
    publisherName: string;
    requestNotes?: string;
    checkoutDate: string; // ISO (Timestamp in Firestore)
    expectedReturnDate: string; // ISO (Timestamp in Firestore)
}

export interface Territory {
    id: string;
    number: number;
    status: TerritoryStatus;
    assignment?: TerritoryAssignment;
}

// Types for Bus Tickets Feature
export enum BusTicketStatus {
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    RESERVED = 'RESERVED',
}

export interface ExtraPerson {
    id: string;
    name: string;
    document: string;
}

export interface BusTicket {
    id: string;
    saleDate: string; // ISO (Timestamp in Firestore)
    name: string;
    document: string;
    totalPeople: number;
    days: ('Sexta' | 'Sábado' | 'Domingo')[];
    unitPrice: number;
    extraPeople: ExtraPerson[];
    totalAmount: number;
    amountPaid: number;
    change: number;
    paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão' | '';
    status: BusTicketStatus;
    event?: string;
    notes?: string;
}

// Types for Assignments Feature (Platform Duties)
export interface Assignment extends BaseRecord {
    date: string; // ISO (Timestamp in Firestore)
    indicator1?: string;
    indicator2?: string;
    mic1?: string;
    mic2?: string;
    reader?: string;
    audio?: string;
    video?: string;
    notes?: string;
}

// Types for Cleaning Feature
export type MeetingDay = 'midweek' | 'weekend';

export interface CleaningSchedule extends BaseRecord {
    date: string; // ISO (Timestamp in Firestore)
    endDate: string; // ISO (Timestamp in Firestore)
    group: 'Grupo 1' | 'Grupo 2' | 'Grupo 3' | '';
    meetingDays: MeetingDay[];
    notes?: string;
}


// FIX: Add missing FieldServiceMeeting interface
// Types for Field Service Meetings
export interface FieldServiceMeeting extends BaseRecord {
    date: string; // ISO (Timestamp in Firestore)
    conductor: string;
    reader: string;
    notes?: string;
}

// Types for Conductors Feature
export interface ConductorMeeting extends BaseRecord {
    date: string; // ISO (Timestamp in Firestore)
    conductorName: string;
    notes?: string;
}

// Types for Shepherding Feature
export interface ShepherdingVisit extends BaseRecord {
    date: string; // ISO (Timestamp in Firestore)
    time: string; // HH:mm
    brotherName: string;
    responsibleElder1: string;
    responsibleElder2?: string;
    notes?: string;
}

// Types for Public Talk Feature
export interface PublicTalkSchedule extends BaseRecord {
    type: 'local' | 'away';
    date: string; // ISO (Timestamp in Firestore)
    time: string; // HH:mm
    theme: string;
    song?: string;
    hasImage: boolean;
    speakerName: string;
    congregation: string;
    address?: string;
    phone?: string;
    notes?: string;
}

// Types for Publisher Profiles
export interface PublisherProfile extends BaseRecord {
    // Personal Info
    name: string;
    birthDate: string; // ISO (Timestamp in Firestore)
    baptismDate?: string; // ISO (Timestamp in Firestore), optional
    group: '1' | '2' | '3' | '';
    address: string;
    phone: string;
    email: string;

    // Theocratic Info
    isPublisher: boolean;
    isUnbaptizedPublisher: boolean;
    isAuxiliaryPioneer: boolean;
    isRegularPioneer: boolean;
    isMinisterialServant: boolean;
    isElder: boolean;
    privileges?: string; // text area for other privileges

    // Emergency Contact
    emergencyContactName: string;
    emergencyContactPhone: string;
    notes?: string;
}