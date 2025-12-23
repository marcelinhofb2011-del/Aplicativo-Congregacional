
import { Territory, TerritoryStatus } from '../types';

const createDate = (daysToAdd: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString();
};

export const MOCK_TERRITORIES: Territory[] = Array.from({ length: 26 }, (_, i) => {
    const number = i + 1;
    const territory: Territory = {
        id: `T${number}`,
        number: number,
        status: TerritoryStatus.AVAILABLE,
    };

    if (number === 5) {
        territory.status = TerritoryStatus.ASSIGNED;
        territory.assignment = {
            publisherName: 'João da Silva',
            checkoutDate: createDate(-20),
            expectedReturnDate: createDate(10),
            requestNotes: 'Território residencial com muitos prédios.'
        };
    } else if (number === 12) {
        territory.status = TerritoryStatus.REQUESTED;
        territory.assignment = {
            publisherName: 'Maria Oliveira',
            checkoutDate: createDate(0), // Placeholder
            expectedReturnDate: createDate(30),
            requestNotes: 'Gostaria de trabalhar neste território comercial durante a semana.'
        };
    } else if (number === 18) {
        territory.status = TerritoryStatus.ASSIGNED;
        territory.assignment = {
            publisherName: 'Pedro Costa',
            checkoutDate: createDate(-10),
            expectedReturnDate: createDate(20),
        };
    } else if (number >= 23) {
         territory.status = TerritoryStatus.ASSIGNED;
         territory.assignment = {
            publisherName: 'Ana Souza',
            checkoutDate: createDate(-5),
            expectedReturnDate: createDate(25),
        };
    }

    return territory;
});
