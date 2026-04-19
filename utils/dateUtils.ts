
export const getBrazilToday = (): Date => {
    // Returns a UTC Date object representing 00:00:00 of the current day in Brazil
    const now = new Date();
    const brazilDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(brazilDateStr + 'T00:00:00Z');
    return today;
};

export const parseDateAsUTC = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    
    // Support YYYY-MM-DD
    if (dateStr.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + 'T00:00:00Z');
    }
    
    // Support DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }

    // Support ISO strings and others
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date(0);
    
    // Force to UTC midnight by using string conversion
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
};

export const getLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatToLocalDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // If the date string is just YYYY-MM-DD, new Date(dateStr) might interpret it as UTC.
    // We want to ensure we treat it as local if it's coming from an input[type="date"]
    if (dateStr.length === 10 && dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return getLocalDateString(new Date(year, month - 1, day));
    }
    return getLocalDateString(date);
};
