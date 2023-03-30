import Image from 'next/image';

export const ChannelList = () => {
    return (
        <div className='col-span-1 p-6 text-white text-sm'>
            <div className='w-full h-8 p-2 flex justify-between items-center bg-[#171820] border border-[#34323E] rounded-lg'>
                <Image
                    src={'/channelList/channel.svg'}
                    width={24}
                    height={24}
                    alt='channel'
                />

                <div className='w-1/2'>
                    <span className='truncate'>CollabGPT</span>
                </div>
                <Image
                    src={'/channelList/edit.svg'}
                    width={16}
                    height={16}
                    alt='channel'
                />
                <Image
                    src={'/channelList/delete.svg'}
                    width={16}
                    height={16}
                    alt='channel'
                />
            </div>
        </div>
    );
};
