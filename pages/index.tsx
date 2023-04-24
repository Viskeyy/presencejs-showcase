'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { createPresence, IChannel } from '@yomo/presence';
import { PageLoading } from '../components/PageLoading';
const Header = dynamic(
    () =>
        import('../components/ChatContainer/Header').then(
            (module) => module.Header
        ),
    { ssr: false }
);
const MessageContainer = dynamic(
    () =>
        import('../components/ChatContainer/MessageContainer').then(
            (module) => module.MessageContainer
        ),
    { ssr: false }
);
const UserInput = dynamic(
    () => import('../components/UserInput').then((module) => module.UserInput),
    { ssr: false }
);
const UserCursor = dynamic(
    () => import('../components/UserCursor').then((mod) => mod.UserCursor),
    { ssr: false }
);

const currentConnectId = (
    Math.floor(Math.random() * (1e6 - 1e5)) + 1e5
).toString();

const defaultMessage: Message = {
    role: 'assistant',
    state: 'deltaStart',
    content: 'Welcome to Allegro CollabGPT!',
    avatar: '',
};

const defaultUserInfo: UserInfo = {
    id: currentConnectId,
    name: 'user' + currentConnectId,
    avatar:
        'https://api.dicebear.com/6.x/pixel-art/png?seed=' + currentConnectId,
    color: '#' + currentConnectId,
    mouseX: 0,
    mouseY: 0,
};

export default function Home() {
    const [channel, setChannel] = useState<IChannel>();
    const [messages, setMessages] = useState<Message[]>([defaultMessage]);
    const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);

    const [loadingState, setLoadingState] = useState<boolean>(false);

    const [pageLoadingState, setPageLoadingState] = useState<boolean>(true);

    const handleReceiveMessage = (deltaMessage: Message) => {
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

    const userInputSetLoadingState = (state: boolean) => {
        setLoadingState(state);
    };
    const userInputAppendMessage = (deltaMessage: Message) => {
        setMessages((messages) => [...messages, deltaMessage]);
    };
    const userInputSetInputMessage = (inputContent: string) => {
        setMessages((messages) => {
            const lastMessage = messages[messages.length - 1];
            const updatedMessage = {
                ...lastMessage,
                content: inputContent,
            };
            return [...messages.slice(0, -1), updatedMessage];
        });
    };
    const userInputSetReceivedMessage = (deltaMessage: Message) => {
        setMessages((messages) => {
            const lastMessage = messages[messages.length - 1];
            const updatedMessage = {
                ...lastMessage,
                content: lastMessage.content + deltaMessage.content,
            };
            return [...messages.slice(0, -1), updatedMessage];
        });
    };

    useEffect(() => {
        (async () => {
            const presencePromise = createPresence(
                'https://prscd2.allegro.earth/v1',
                {
                    id: currentConnectId,
                    publicKey: process.env.NEXT_PUBLIC_PRESENCE_PUBLIC_KEY,
                }
            );
            const presence = await presencePromise;

            setPageLoadingState(presence?.status === 'open' ? false : true);

            const channel = presence.joinChannel('67f1a42b');
            channel.subscribe(
                'chatInfo',
                ({ payload }: { payload: Message }) => {
                    handleReceiveMessage(payload);
                }
            );
            channel.subscribe(
                'loadingState',
                ({ payload }: { payload: { isLoading: boolean } }) => {
                    setLoadingState(payload.isLoading);
                }
            );

            channel.broadcast('userJoined', defaultUserInfo);
            setChannel(channel);
        })();
        return () => {
            channel?.broadcast('userLeft', defaultUserInfo);
            channel?.leave();
        };
    }, []);

    return (
        <main className="mx-auto flex h-[100vh] w-[100vw] flex-col justify-between">
            <PageLoading state={pageLoadingState} />
            <UserCursor
                channel={channel}
                currentUser={defaultUserInfo}
                onlineUsers={onlineUsers}
            />
            <Header channel={channel} />
            <MessageContainer messages={messages} loading={loadingState} />
            <UserInput
                channel={channel}
                defaultUserInfo={defaultUserInfo}
                loadingState={loadingState}
                userInputSetLoadingState={userInputSetLoadingState}
                userInputAppendMessage={userInputAppendMessage}
                userInputSetInputMessage={userInputSetInputMessage}
                userInputSetReceivedMessage={userInputSetReceivedMessage}
            />
        </main>
    );
}
