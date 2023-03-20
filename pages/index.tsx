'use client';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { createPresence } from '@yomo/presence';
import { Loading } from '../components/Loading';

export default function Home() {
    const [channel, setChannel] = useState<any>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [displayMessages, setDisplayMessages] = useState<Message[]>([]);

    const [userInput, setUserInput] = useState<string>('');
    // const [inputState, setInputState] = useState<InputState>();
    const [loadingState, setLoadingState] = useState<boolean>(false);

    const bottomDiv = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        bottomDiv.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const currentConnectId = (
        Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000
    ).toString();

    // const currentUser: UserInfo = {
    //     name: 'user' + currentConnectId,
    //     color: `#${currentConnectId}`,
    // };

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
                setDisplayMessages(() => message.messages);
            }
        );

        joinChannel?.subscribe(
            'loadingState',
            (message: { isLoading: boolean }) => {
                setLoadingState(message.isLoading);
            }
        );

        // joinChannel?.subscribe(
        //     'inputState',
        //     (message: { inputState: InputState }) => {
        //         console.log(message.inputState, 'receive input state');
        //         setInputState(message.inputState);
        //         setUserInput(message.inputState.content);
        //     }
        // );

        setChannel(joinChannel);
    };

    const submitInput = async () => {
        if (!userInput) return;

        const updateMessages = [
            ...displayMessages,
            { role: 'user' as const, content: userInput },
        ];

        setMessages(() => updateMessages);

        channel?.broadcast('chatInfo', {
            messages: updateMessages,
        });
        channel?.broadcast('loadingState', { isLoading: true });

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        });

        // channel?.broadcast('inputState', {
        //     inputState: {},
        // });

        if (!response.ok) {
            channel?.broadcast('loadingState', { isLoading: false });
            return;
        }

        const data = response.body;

        if (!data) {
            channel?.broadcast('loadingState', { isLoading: false });
            return;
        }

        setUserInput('');

        const reader = data.getReader();
        const decoder = new TextDecoder();

        let done = false;
        let isFirst = true;

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);

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

        channel?.broadcast('loadingState', { isLoading: false });
    };

    // const syncInputState = (event: ChangeEvent<HTMLTextAreaElement>) => {
    //     console.log(
    //         { ...currentUser, content: event.target.value },
    //         'send input state'
    //     );
    //     console.log(inputState, 'input state brfore send');
    //     channel?.broadcast('inputState', {
    //         inputState: {
    //             ...currentUser,
    //             content: event.target.value,
    //         },
    //     });
    // };

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
    }, [displayMessages, messages, loadingState]);

    return (
        <main>
            <div className='flex flex-col h-screen overflow-auto items-center w-2/3 max-w-[800px] mx-auto'>
                <div className='text-gray-400 text-3xl sticky top-0 my-8'>
                    Presence real-time showcase
                </div>

                <div className='w-full p-4 h-[80vh] overflow-y-auto'>
                    <div className='flex flex-col rounded-lg border-neutral-300'>
                        {displayMessages.map((message, index) => {
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
                                        } rounded-2xl px-4 py-2 max-w-[67%] whitespace-pre-wrap`}
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
                        className='min-h-12 rounded-lg p-2 w-full focus:outline-none focus:ring-1 focus:ring-neutral-300 border-2 border-neutral-200'
                        style={{ resize: 'none' }}
                        placeholder='Type a message...'
                        // value={inputState?.content}
                        value={userInput}
                        rows={1}
                        onChange={(e) => setUserInput(e.target.value)}
                        // onChange={(event) => syncInputState(event)}
                        /** onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                            if (event.key === 'Enter' && event.ctrlKey) {
                                submitInput();
                            }
                        }} **/
                    />
                    <button
                        onClick={submitInput}
                        disabled={loadingState}
                        // disabled={loadingState || !!inputState?.name}
                        className='absolute right-2'
                        // style={{ color: inputState?.color }}
                    >
                        {/* {inputState?.name ? (
                            `${inputState.name} is typing...`
                        ) : (
                            <Image
                                src={'/arrow-up.svg'}
                                alt='send arrow'
                                width={32}
                                height={32}
                                className='hover:cursor-pointer rounded-full p-1 bg-blue-500 text-white hover:opacity-80'
                            />
                        )} */}
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
