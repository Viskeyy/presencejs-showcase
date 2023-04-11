import { useState, ChangeEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
import {
    createParser,
    ParsedEvent,
    ReconnectInterval,
} from 'eventsource-parser';
import { IChannel } from '@yomo/presence';

export const UserInput = ({
    channel,
    defaultUserInfo,
    loadingState,
    userInputSetLoadingState,
    userInputAppendMessage,
    userInputSetInputMessage,
    userInputSetReceivedMessage,
}: {
    channel: IChannel | undefined;
    defaultUserInfo: UserInfo;
    loadingState: boolean;
    userInputSetLoadingState: (state: boolean) => void;
    userInputAppendMessage: (deltaMessage: Message) => void;
    userInputSetInputMessage: (inputContent: string) => void;
    userInputSetReceivedMessage: (deltaMessage: Message) => void;
}) => {
    const [userInput, setUserInput] = useState<string>('');

    const broadcastLoadingState = (state: boolean) => {
        channel?.broadcast('loadingState', { isLoading: state });
        userInputSetLoadingState(state);
    };

    const appendAndBroadcastMessage = (deltaMessage: Message) => {
        channel?.broadcast('chatInfo', { ...deltaMessage });
        userInputAppendMessage(deltaMessage);
    };

    const broadcastReceivedMessage = (deltaMessage: Message) => {
        channel?.broadcast('chatInfo', { ...deltaMessage });
        userInputSetReceivedMessage(deltaMessage);
    };

    const broadcastUserInputMessage = (deltaMessage: Message) => {
        channel?.broadcast('chatInfo', { ...deltaMessage });
        userInputSetInputMessage(deltaMessage.content);
    };

    const handleError = () => {
        broadcastLoadingState(false);
        userInputAppendMessage({
            state: 'deltaStart',
            role: 'assistant',
            content: 'Error',
            avatar: '',
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
            handleError();
            return;
        }
        const data = response.body?.getReader();
        if (!data) {
            handleError();
            return;
        }

        setUserInput('');

        appendAndBroadcastMessage({
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
                    broadcastReceivedMessage({
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

        broadcastLoadingState(false);
    };

    return (
        <div className="relative mx-auto my-6 flex w-3/5 flex-nowrap items-center justify-center">
            <textarea
                className={`min-h-12 w-full whitespace-nowrap rounded-lg border border-[#34323E] bg-[#171820] p-2 focus:outline-none focus:border-[${defaultUserInfo.color}]`}
                disabled={loadingState}
                style={{ resize: 'none' }}
                placeholder="Type your query..."
                value={userInput}
                rows={1}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    setUserInput(() => event.target.value);
                    broadcastUserInputMessage({
                        state: 'input',
                        role: 'user',
                        content: event.target.value,
                        avatar: '',
                    });
                }}
                onFocus={() => {
                    appendAndBroadcastMessage({
                        state: 'inputStart',
                        role: 'user',
                        content: `${defaultUserInfo.name} is typing...`,
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
                className="absolute right-2"
            >
                <Image
                    src={'/send-arrow.svg'}
                    alt="send arrow"
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
    );
};
