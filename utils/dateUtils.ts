
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

export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    description?: string;
}

export const getEasterDate = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

export const getBrazilianHolidays = (year: number): Holiday[] => {
    const holidays: Holiday[] = [
        { date: `${year}-01-01`, name: "Confraternização Universal", description: "Ano Novo" },
        { date: `${year}-04-21`, name: "Tiradentes", description: "Feriado Nacional" },
        { date: `${year}-05-01`, name: "Dia do Trabalhador", description: "Dia do Trabalho" },
        { date: `${year}-09-07`, name: "Independência do Brasil", description: "Feriado Nacional" },
        { date: `${year}-10-12`, name: "Nossa Senhora Aparecida", description: "Padroeira do Brasil" },
        { date: `${year}-11-02`, name: "Finados", description: "Feriado Nacional" },
        { date: `${year}-11-15`, name: "Proclamação da República", description: "Feriado Nacional" },
        { date: `${year}-11-20`, name: "Dia da Consciência Negra", description: "Feriado Nacional" },
        { date: `${year}-12-25`, name: "Natal", description: "Feriado Nacional" },
    ];

    try {
        const easter = getEasterDate(year);

        // Good Friday (-2 days from Easter)
        const goodFriday = new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000);
        const goodFridayStr = goodFriday.toISOString().split('T')[0];
        holidays.push({ date: goodFridayStr, name: "Sexta-feira Santa", description: "Paixão de Cristo" });

        // Easter Sunday
        const easterStr = easter.toISOString().split('T')[0];
        holidays.push({ date: easterStr, name: "Páscoa", description: "Domingo de Páscoa" });

        // Carnaval (-47 days from Easter)
        const carnival = new Date(easter.getTime() - 47 * 24 * 60 * 60 * 1000);
        const carnivalStr = carnival.toISOString().split('T')[0];
        holidays.push({ date: carnivalStr, name: "Carnaval", description: "Ponto Facultativo" });

        // Corpus Christi (+60 days after Easter)
        const corpusChristi = new Date(easter.getTime() + 60 * 24 * 60 * 60 * 1000);
        const corpusChristiStr = corpusChristi.toISOString().split('T')[0];
        holidays.push({ date: corpusChristiStr, name: "Corpus Christi", description: "Ponto Facultativo" });
    } catch (e) {
        console.error("Error calculating variable holidays:", e);
    }

    return holidays.sort((a, b) => a.date.localeCompare(b.date));
};

