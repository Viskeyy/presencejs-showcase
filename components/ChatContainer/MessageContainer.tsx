import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Loading } from '../Loading';

export const MessageContainer = (props: {
    messages: Message[];
    loading: boolean;
}) => {
    const bottomDiv = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        bottomDiv.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [props.messages, props.loading]);

    return (
        <div className="w-full flex-auto overflow-y-auto">
            {props.messages.map((message, index) => {
                return (
                    <div
                        key={index}
                        className={`min-h-20 flex w-full items-center gap-2 p-2 px-[15vw] ${
                            message.role === 'assistant'
                                ? 'bg-[#211F2D] text-[#64ECAD]'
                                : 'bg-[#15111C]'
                        }`}
                    >
                        <div
                            className={`self-start bg-slate-500 ${
                                message.role === 'assistant'
                                    ? ''
                                    : 'rounded-full'
                            } h-6 w-6 shrink-0`}
                        >
                            <Image
                                src={
                                    message.role === 'assistant'
                                        ? '/gpt.svg'
                                        : message?.avatar
                                }
                                width={24}
                                height={24}
                                alt="avatar"
                            />
                        </div>
                        <div className="flex-auto break-all">
                            {message.content}
                        </div>
                    </div>
                );
            })}
            <div className="min-h-20 flex w-full items-center p-2 px-[15vw]">
                <Loading isShow={props.loading} />
            </div>
            <div ref={bottomDiv} />
        </div>
    );
};
