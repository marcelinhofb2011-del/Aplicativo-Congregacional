
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
