import { createPresence, IChannel } from '@yomo/presence';
import { Dispatch, SetStateAction } from 'react';

const currentConnectId = (
    Math.floor(Math.random() * (1e6 - 1e5)) + 1e5
).toString();

const handleReceiveMessage = (
    deltaMessage: Message,
    setMessages: Dispatch<SetStateAction<Message[]>>
) => {
    if (deltaMessage.content === '\n\n' || deltaMessage.content === null) {
        return;
    }
    if (deltaMessage.state === 'inputStart') {
        setMessages((messages) => [...messages, deltaMessage]);
        return;
    }
    if (deltaMessage.state === 'input') {
        setMessages((messages) => {
            const lastMessage = messages[messages.length - 1];
            const updatedMessage = {
                ...lastMessage,
                content: deltaMessage.content,
            };
            return [...messages.slice(0, -1), updatedMessage];
        });
        return;
    }
    if (deltaMessage.state === 'deltaStart') {
        setMessages((messages) => [...messages, deltaMessage]);
        return;
    }
    if (deltaMessage.state === 'delta') {
        setMessages((messages) => {
            const lastMessage = messages[messages.length - 1];
            const updatedMessage = {
                ...lastMessage,
                content: lastMessage.content + deltaMessage.content,
            };
            return [...messages.slice(0, -1), updatedMessage];
        });
        return;
    }
};

export const presenceConnect = async (
    setChannel: Dispatch<SetStateAction<IChannel | null>>,
    setMessages: Dispatch<SetStateAction<Message[]>>,
    setLoadingState: Dispatch<SetStateAction<boolean>>,
    setOnlineUsers: Dispatch<SetStateAction<UserInfo[]>>
) => {
    const presence = await createPresence({
        url: 'https://prscd2.allegro.earth/v1',
        publicKey: process.env.NEXT_PUBLIC_PRESENCE_PUBLIC_KEY,
        id: currentConnectId,
        appId: process.env.NEXT_PUBLIC_PRESENCE_APP_KEY,
    });

    const channel = presence.joinChannel(
        process.env.NEXT_PUBLIC_PRESENCE_CHANNEL_ID as string
    );

    channel.subscribe('chatInfo', (deltaMessage: Message) => {
        handleReceiveMessage(deltaMessage, setMessages);
    });

    channel.subscribe(
        'loadingState',
        (loadingState: { isLoading: boolean }) => {
            setLoadingState(loadingState.isLoading);
        }
    );

    channel.subscribePeers((peers) => {
        setOnlineUsers(peers as any);
    });

    setChannel(channel);
};
