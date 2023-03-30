import Image from 'next/image';

export const Header = ({ onlineUsers }: { onlineUsers: UserInfo[] }) => {
    return (
        <div className='w-full h-16 border-b border-[#34323E] flex justify-between items-center px-6'>
            <span className='text-[#64ECAD] text-sm font-bold'>
                Allegro CollabGPT
            </span>

            <div className='flex'>
                {onlineUsers.slice(0, 4).map((user, index) => (
                    <div key={user.id} className='-ml-1'>
                        <Image
                            src={user.avatar as string}
                            alt='avatar'
                            width={24}
                            height={24}
                            className='rounded-full border w-6 h-6'
                            style={{
                                zIndex: `${onlineUsers.length - index}`,
                            }}
                        />
                    </div>
                ))}
                {onlineUsers.length > 4 && (
                    <div
                        className='flex items-center justify-center w-6 h-6 -ml-1 rounded-full border text-xs bg-cover'
                        style={{
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${onlineUsers[4].avatar})`,
                        }}
                    >
                        <span> +{onlineUsers.length - 4}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
