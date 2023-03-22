'use client';
import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
import { createPresence } from '@yomo/presence';
import {
    createParser,
    ParsedEvent,
    ReconnectInterval,
} from 'eventsource-parser';
import { Loading } from '../components/Loading';
import { OnlineState } from '../components/OnlineState';

export default function Home() {
    const [channel, setChannel] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [onlineUser, setOnlineUser] = useState<UserInfo[]>([]);

    const [userInput, setUserInput] = useState<string>('');
    const [loadingState, setLoadingState] = useState<boolean>(false);

    const bottomDiv = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        bottomDiv.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleHttpRequestError = () => {
        setMessages((messages) => [
            ...messages,
            { role: 'assistant', content: 'Error' },
        ]);
        setLoadingState(false);

        channel?.broadcast('chatInfo', {
            messages: [...messages, { role: 'assistant', content: 'Error' }],
        });
        channel?.broadcast('loadingState', { isLoading: false });

        setUserInput('');
    };

    const currentConnectId = (
        Math.floor(Math.random() * (1e6 - 1e5)) + 1e5
    ).toString();

    const presenceConnect = async () => {
        const presence = await createPresence({
            url: 'https://prscd2.allegro.earth/v1',
            publicKey: process.env.NEXT_PUBLIC_PRESENCE_PUBLIC_KEY,
            id: currentConnectId,
            appId: process.env.NEXT_PUBLIC_PRESENCE_APP_KEY,
        });

        const joinChannel = presence.joinChannel(
            process.env.NEXT_PUBLIC_PRESENCE_CHANNEL_ID as string
        );

        joinChannel?.subscribe(
            'chatInfo',
            (message: { messages: Message[] }) => {
                setMessages(() => message.messages);
            }
        );

        joinChannel?.subscribe(
            'loadingState',
            (message: { isLoading: boolean }) => {
                setLoadingState(message.isLoading);
            }
        );

        joinChannel?.subscribePeers((peers) => {
            setOnlineUser(peers);
        });

        setChannel(joinChannel);
    };

    const submitInput = async () => {
        if (!userInput) return;
        setLoadingState(true);
        channel?.broadcast('loadingState', { isLoading: true });

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

        const decoder = new TextDecoder();
        const parser = createParser(
            (event: ParsedEvent | ReconnectInterval) => {
                if (event.type === 'event') {
                    const data = event.data;
                    if (data === '[DONE]') return;
                    const json = JSON.parse(data);
                    chunkValue = json.choices[0].delta.content || '';
                }
            }
        );

        let done = false;
        let isFirst = true;
        let chunkValue = '';

        while (!done) {
            const { value, done: doneReading } = await data?.read();
            done = doneReading;
            parser.feed(decoder.decode(value));
            if (isFirst) {
                isFirst = false;
                setMessages((messages) => [
                    ...messages,
                    { role: 'assistant', content: chunkValue },
                ]);
                channel?.broadcast('chatInfo', {
                    messages: [
                        ...messages,
                        { role: 'assistant', content: chunkValue },
                    ],
                });
            } else {
                setMessages((messages) => {
                    const lastMessage = messages[messages.length - 1];
                    const updatedMessage = {
                        ...lastMessage,
                        content: lastMessage.content + chunkValue,
                    };
                    channel?.broadcast('chatInfo', {
                        messages: [...messages.slice(0, -1), updatedMessage],
                    });
                    return [...messages.slice(0, -1), updatedMessage];
                });
            }
        }

        setUserInput('');
        setLoadingState(false);
        channel?.broadcast('loadingState', { isLoading: false });
    };

    const syncTypingState = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setUserInput(() => event.target.value);
        messages[messages.length - 1].content = event.target.value;
        channel?.broadcast('chatInfo', { messages });
    };

    useEffect(() => {
        if (window) {
            presenceConnect();
        }
        return () => {
            channel?.leave();
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loadingState]);

    return (
        <main>
            <div className='flex flex-col h-screen overflow-auto items-center w-[90vw] max-w-[800px] mx-auto'>
                <div className='text-gray-400 text-3xl sticky top-0 my-8'>
                    Presence real-time showcase
                </div>

                <div className='w-full'>
                    <span className=' text-2xl'>CollabGPT</span>
                    <span className='float-right'>
                        <OnlineState onlineUserAmount={onlineUser.length} />
                    </span>
                </div>

                <div className='w-full p-4 h-[80vh] overflow-y-auto'>
                    <div className='flex flex-col rounded-lg border-neutral-300'>
                        {messages.map((message, index) => {
                            return (
                                <div
                                    key={index}
                                    className={`flex flex-col m-1 ${
                                        message.role === 'assistant'
                                            ? 'items-start'
                                            : 'items-end'
                                    }`}
                                >
                                    <div
                                        className={`flex items-center ${
                                            message.role === 'assistant'
                                                ? 'bg-neutral-200 text-neutral-900'
                                                : 'bg-blue-500 text-white'
                                        } rounded-2xl px-4 py-2 max-w-[75%] whitespace-pre-wrap`}
                                        style={{ overflowWrap: 'anywhere' }}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {loadingState && (
                        <div className='m-1'>
                            <div className='flex flex-col flex-start'>
                                <div
                                    className='flex items-center bg-neutral-200 text-neutral-900 rounded-2xl px-4 py-2 w-fit'
                                    style={{
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    <Loading isShow={loadingState} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomDiv}></div>
                </div>

                <div className='flex flex-nowrap items-center justify-center relative w-full my-8'>
                    <textarea
                        className='min-h-12 rounded-lg p-2 w-full whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-neutral-300 border-2 border-neutral-200'
                        disabled={loadingState}
                        style={{ resize: 'none' }}
                        placeholder='Type a message...'
                        value={userInput}
                        rows={1}
                        onChange={(event) => syncTypingState(event)}
                        onFocus={() => {
                            setMessages((messages) => [
                                ...messages,
                                {
                                    role: 'user',
                                    content: `user${currentConnectId} is typing...`,
                                },
                            ]);
                            channel?.broadcast('loadingState', {
                                isLoading: true,
                            });
                        }}
                        onBlur={() => {
                            if (!userInput) {
                                setMessages((messages) => [
                                    ...messages.slice(0, -1),
                                ]);
                                channel?.broadcast('chatInfo', { messages });
                                channel?.broadcast('loadingState', {
                                    isLoading: false,
                                });
                            }
                        }}
                        onKeyDown={(
                            event: KeyboardEvent<HTMLTextAreaElement>
                        ) => {
                            if (event.key === 'Enter') submitInput();
                        }}
                    />
                    <button
                        onClick={submitInput}
                        disabled={loadingState}
                        className='absolute right-2'
                    >
                        <Image
                            src={'/arrow-up.svg'}
                            alt='send arrow'
                            width={32}
                            height={32}
                            className={`${
                                loadingState
                                    ? 'hover:cursor-not-allowed'
                                    : 'hover:cursor-pointer'
                            } rounded-full p-1 bg-blue-500 hover:opacity-80`}
                        />
                    </button>
                </div>
            </div>
        </main>
    );
}
