import { createPresence } from '@yomo/presence';

export const presenceConnect = (id: string) => {
    const presencePromise = createPresence('https://prscd2.allegro.earth/v1', {
        id,
        publicKey: process.env.NEXT_PUBLIC_PRESENCE_PUBLIC_KEY,
    });

    return { presencePromise };
};
