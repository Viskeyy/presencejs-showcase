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

    const handleReceiveDelta = (deltaMessage: Message) => {
        console.log(deltaMessage, 'receive message');

        // modifyLastMessages(deltaMessage);

        // if (messages[messages.length - 1]?.role === deltaMessage.role) {
        //     modifyLastMessages(deltaMessage);
        //     return;
        // }
        setMessages(() => [...messages, deltaMessage]);
    };

    const appendMessages = (deltaMessage: Message) => {
        channel?.broadcast('chatInfo', { ...deltaMessage });
        setMessages((messages) => [...messages, deltaMessage]);
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

    const syncLoadingState = (state: boolean) => {
        channel?.broadcast('loadingState', { isLoading: state });
        setLoadingState(state);
    };
    const syncMessages = (deltaMessage: Message) => {
        channel?.broadcast('chatInfo', { ...deltaMessage });
        modifyLastMessages(deltaMessage);
    };

    const handleHttpRequestError = () => {
        syncLoadingState(false);
        syncMessages({
            role: 'assistant',
            content: 'Error',
            messageId: currentConnectId,
        });
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

        const joinChannel = presence.joinChannel('testpassdeltamessage');

        joinChannel?.subscribe('chatInfo', (message: Message) => {
            handleReceiveDelta(message);
        });

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

        syncLoadingState(true);

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
            role: 'assistant',
            content: '',
            messageId: '',
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
                    syncMessages({
                        role: 'assistant',
                        content: chunkValue,
                        messageId: json.id,
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
        syncLoadingState(false);
    };

    const syncTypingState = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setUserInput(() => event.target.value);

        setMessages((messages) => {
            const lastMessage = messages[messages.length - 1];
            const updatedMessage = {
                ...lastMessage,
                content: event.target.value,
            };
            return [...messages.slice(0, -1), updatedMessage];
        });

        channel?.broadcast('chatInfo', {
            role: messages[messages.length - 1].role,
            content: event.target.value,
            messageId: messages[messages.length - 1].messageId,
        });
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
                                    className={`flex flex-col m-1 min-h-6 ${
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
                            appendMessages({
                                role: 'user',
                                content: `user${currentConnectId} is typing...`,
                                messageId: currentConnectId,
                            });
                            channel?.broadcast('loadingState', {
                                isLoading: true,
                            });
                        }}
                        onBlur={() => {
                            channel?.broadcast('loadingState', {
                                isLoading: false,
                            });
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
