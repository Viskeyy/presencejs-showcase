import Image from 'next/image';
import { Loading } from '../Loading';
export const MessageContainer = (props: {
    messages: Message[];
    loading: boolean;
}) => {
    return (
        <div className='w-full flex-auto overflow-y-auto'>
            {props.messages.map((message, index) => {
                return (
                    <div
                        key={index}
                        className={`w-full min-h-20 flex px-[15vw] items-center p-2 gap-2 ${
                            message.role === 'assistant'
                                ? 'bg-[#211F2D] text-[#64ECAD]'
                                : 'bg-[#15111C]'
                        }`}
                    >
                        <div
                            className={`bg-slate-500 ${
                                message.role === 'assistant' ? 'self-start' : ''
                            } w-6 h-6 shrink-0`}
                        >
                            <Image
                                src={
                                    message.role === 'assistant'
                                        ? '/gpt.svg'
                                        : message?.avatar
                                }
                                width={24}
                                height={24}
                                alt='avatar'
                            />
                        </div>
                        <div className='flex-auto break-all'>
                            {message.content}
                        </div>
                    </div>
                );
            })}
            <div className='w-full min-h-20 flex px-[15vw] items-center p-2'>
                <Loading isShow={props.loading} />
            </div>
        </div>
    );
};
