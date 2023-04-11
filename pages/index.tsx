'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { IChannel } from '@yomo/presence';
import { presenceConnect } from '../helper/presenceConnect';
import { Header } from '../components/ChatContainer/Header';
import { MessageContainer } from '../components/ChatContainer/MessageContainer';
import { UserInput } from '../components/UserInput';
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
        presenceConnect(
            setChannel,
            setMessages,
            setLoadingState,
            setOnlineUsers
        );
        return () => {
            if (channel) {
                channel.broadcast('onlineUsers', defaultUserInfo);
                channel.leave();
            }
        };
    }, [channel]);

    return (
        <main className="mx-auto flex h-[100vh] w-[100vw] flex-col justify-between">
            <UserCursor
                channel={channel}
                currentUser={defaultUserInfo}
                onlineUsers={onlineUsers}
            />
            <Header onlineUsers={onlineUsers} />
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
