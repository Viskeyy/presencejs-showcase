'use client';
import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
    createParser,
    ParsedEvent,
    ReconnectInterval,
} from 'eventsource-parser';

import { presenceConnect } from '../helper/presenceConnect';
import { Header } from '../components/ChatContainer/Header';
import { MessageContainer } from '../components/ChatContainer/MessageContainer';
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
    content: 'Welcome to CollabGPT!',
    avatar: '',
};

const defaultUserInfo: UserInfo = {
    id: currentConnectId,
    name: 'user' + currentConnectId,
    avatar: '/yomo.png',
    color: '#' + currentConnectId,
    mouseX: 0,
    mouseY: 0,
};

export default function Home() {
    const [channel, setChannel] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([defaultMessage]);
    const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);

    const [userInput, setUserInput] = useState<string>('');
    const [loadingState, setLoadingState] = useState<boolean>(false);

    const appendMessages = (deltaMessage: Message) => {
        channel?.broadcast('chatInfo', { ...deltaMessage });
        setMessages((messages) => [...messages, deltaMessage]);
    };
    const modifyLastUserinput = (inputMessage: string) => {
        setMessages((messages) => {
            const lastMessage = messages[messages.length - 1];
            const updatedMessage = {
                ...lastMessage,
                content: inputMessage,
            };
            return [...messages.slice(0, -1), updatedMessage];
        });
    };
    const modifyLastMessages = (deltaMessage: Message) => {
        setMessages((messages) => {
            const lastMessage = messages[messages.length - 1];
            const updatedMessage = {
                ...lastMessage,
                content: lastMessage.content + deltaMessage.content,
            };
            return [...messages.slice(0, -1), updatedMessage];
        });
    };

    const broadcastLoadingState = (state: boolean) => {
        channel?.broadcast('loadingState', { isLoading: state });
        setLoadingState(state);
    };

    const broadcastMessages = (deltaMessage: Message) => {
        channel?.broadcast('chatInfo', { ...deltaMessage });
        modifyLastMessages(deltaMessage);
    };

    const handleHttpRequestError = () => {
        broadcastLoadingState(false);
        broadcastMessages({
            state: 'deltaStart',
            role: 'assistant',
            content: 'Error',
            avatar: '',
        });
        setUserInput('');
    };

    const broadcastInputMessage = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setUserInput(() => event.target.value);
        modifyLastUserinput(event.target.value);
        channel?.broadcast('chatInfo', {
            state: 'input',
            role: 'user',
            content: event.target.value,
        });
    };

    const submitInput = async () => {
        if (!userInput) return;

        broadcastLoadingState(true);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        });
        if (!response.ok) {
            handleHttpRequestError();
            return;
        }
        const data = response.body?.getReader();
        if (!data) {
            handleHttpRequestError();
            return;
        }

        appendMessages({
            state: 'deltaStart',
            role: 'assistant',
            content: '',
            avatar: '',
        });

        const decoder = new TextDecoder();
        const parser = createParser(
            (event: ParsedEvent | ReconnectInterval) => {
                if (event.type === 'event') {
                    const data = event.data;
                    if (data === '[DONE]') return;
                    const json = JSON.parse(data);
                    if (json.choices[0].finish_reason === 'stop') return;
                    const chunkValue = json.choices[0].delta.content;
                    broadcastMessages({
                        state: 'delta',
                        role: 'assistant',
                        content: chunkValue,
                        avatar: '',
                    });
                }
            }
        );

        while (true) {
            const { value, done } = await data?.read();
            if (done) break;
            parser.feed(decoder.decode(value));
        }

        setUserInput('');
        broadcastLoadingState(false);
    };

    useEffect(() => {
        if (window) {
            presenceConnect(
                setChannel,
                setMessages,
                setLoadingState,
                setOnlineUsers
            );
        }
        // return () => {
        //     channel?.leave();
        // };
    }, [channel]);

    return (
        <main className='w-[100vw] h-[100vh] flex flex-col justify-between mx-auto'>
            <UserCursor
                channel={channel}
                currentUser={defaultUserInfo}
                onlineUsers={onlineUsers}
            />
            <Header onlineUsers={onlineUsers} />
            <MessageContainer messages={messages} loading={loadingState} />

            <div className='flex flex-nowrap items-center justify-center w-3/5 my-6 relative mx-auto'>
                <textarea
                    className='min-h-12 rounded-lg p-2 w-full whitespace-nowrap bg-[#171820] focus:outline-none focus:ring-1 focus:ring-neutral-300 border border-[#34323E]'
                    disabled={loadingState}
                    style={{ resize: 'none' }}
                    placeholder='Type your query'
                    value={userInput}
                    rows={1}
                    onChange={(event) => broadcastInputMessage(event)}
                    onFocus={() => {
                        appendMessages({
                            state: 'inputStart',
                            role: 'user',
                            content: `user${currentConnectId} is typing...`,
                            avatar: defaultUserInfo.avatar,
                        });
                        channel?.broadcast('loadingState', { isLoading: true });
                    }}
                    onBlur={() => {
                        channel?.broadcast('loadingState', {
                            isLoading: false,
                        });
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                        if (event.key === 'Enter') submitInput();
                    }}
                />
                <button
                    onClick={submitInput}
                    disabled={loadingState}
                    className='absolute right-2'
                >
                    <Image
                        src={'/send-arrow.svg'}
                        alt='send arrow'
                        width={24}
                        height={24}
                        className={`${
                            loadingState
                                ? 'hover:cursor-not-allowed'
                                : 'hover:cursor-pointer'
                        } hover:opacity-80`}
                    />
                </button>
            </div>
        </main>
    );
}
