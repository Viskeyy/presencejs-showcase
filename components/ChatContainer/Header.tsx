import Image from 'next/image';
export const Header = ({ onlineUsers }: { onlineUsers: UserInfo[] }) => {
    return (
        <div className='w-full h-16 border-b border-[#34323E] flex justify-between items-center px-6'>
            <span className='text-[#64ECAD] text-sm font-bold'>CollabGPT</span>

            <div className='flex flex-row justify-center items-center'>
                {onlineUsers.length <= 4 ? (
                    <div>
                        {onlineUsers.map((user, index) => {
                            return (
                                <div key={user.id} className='-m-1'>
                                    <Image
                                        src={user.avatar as string}
                                        alt='avatar'
                                        width={24}
                                        height={24}
                                        className='rounded-full border w-6 h-6'
                                        style={{
                                            zIndex: `${
                                                onlineUsers.length - index
                                            }`,
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div>
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
                        <div>
                            <div
                                className='w-6 h-6 -ml-1 rounded-full border text-center text-xs bg-[#0000007f] bg-cover'
                                style={{
                                    backgroundImage: `url(${onlineUsers[4].avatar})`,
                                }}
                                // src={users[0].avatar}
                            >
                                +{onlineUsers.length - 4}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
