interface DailyText {
    date: string; // YYYY-MM-DD
    scripture: string;
    comment: string;
}

// Fonte: Examine as Escrituras Diariamente — 2024
const dailyTexts: DailyText[] = [
    {
        date: '2024-08-22',
        scripture: '“Mantenham-se vigilantes.” — Mat. 24:42.',
        comment: 'Jesus disse essas palavras para seus discípulos. E elas são muito importantes para nós hoje. Por quê? Porque a Bíblia diz que o sistema de Satanás está perto do fim, e “o dia e a hora” em que isso vai acontecer “ninguém sabe”. Como podemos mostrar que estamos vigilantes e preparados para o fim? Primeiro, precisamos continuar achegados a Jeová. Isso significa que temos que orar sempre e estudar a Palavra de Deus. Quando passamos por problemas, não podemos deixar que eles nos afastem de Jeová. Em vez disso, devemos nos achegar ainda mais a ele e pedir sua ajuda. Outra maneira de nos mantermos vigilantes é ficarmos ocupados na pregação. Quando falamos a outros sobre as boas novas do Reino, mostramos que acreditamos que o fim está perto e que queremos que outros também sejam salvos.',
    },
    {
        date: '2024-08-23',
        scripture: '“Jeová é a minha força . . . ; meu coração confia nele.” — Sal. 28:7.',
        comment: 'É muito importante confiarmos em Jeová. Muitas vezes, enfrentamos situações que nos deixam com medo ou ansiosos. Mas, se confiarmos em Jeová, podemos ter certeza de que ele vai nos ajudar. O Rei Davi passou por muitos perigos. Ele foi perseguido por inimigos e traído por amigos. Mesmo assim, ele nunca perdeu a confiança em Jeová. Ele sabia que Jeová era sua rocha, sua fortaleza e seu libertador. Assim como Davi, podemos ter a mesma confiança. Quando os problemas parecerem grandes demais, lembre-se de que Jeová é maior do que qualquer problema. Ele promete nos dar a força que precisamos para perseverar. Então, não importa o que aconteça, continue confiando em Jeová de todo o coração.',
    },
    // Adicione mais textos aqui para outros dias
];

interface WeeklyReading {
    weekStartDate: string; // YYYY-MM-DD (Monday)
    reading: string;
}

// Programação da Leitura Semanal da Bíblia
const weeklyReadings: WeeklyReading[] = [
    { weekStartDate: '2024-08-19', reading: 'Jonas 1-4' },
    { weekStartDate: '2024-08-26', reading: 'Miqueias 1-7' },
    // Adicione mais leituras aqui para outras semanas
];


// --- FUNÇÕES DE CONSULTA ---

/**
 * Obtém o texto diário para uma data específica.
 * @param date O objeto Date para o qual obter o texto.
 * @returns O objeto DailyText ou null se não for encontrado.
 */
export const getDailyText = (date: Date): DailyText | null => {
    const dateString = date.toISOString().split('T')[0];
    return dailyTexts.find(text => text.date === dateString) || null;
};


/**
 * Obtém a leitura semanal da Bíblia para uma data específica.
 * @param date O objeto Date para o qual obter a leitura.
 * @returns A string da leitura ou null se não for encontrada.
 */
export const getWeeklyBibleReading = (date: Date): string | null => {
    // Encontra o início da semana (segunda-feira) para a data fornecida
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // ajusta para segunda-feira
    const monday = new Date(date.setDate(diff));
    const mondayString = monday.toISOString().split('T')[0];

    const reading = weeklyReadings.find(r => r.weekStartDate === mondayString);
    return reading ? reading.reading : 'Programação não disponível.';
};
