import Image from 'next/image';

export const Header = ({ onlineUsers }: { onlineUsers: UserInfo[] }) => {
    return (
        <div className="flex h-16 w-full items-center justify-between border-b border-[#34323E] px-6">
            <div className="text-sm font-bold text-[#5766F2]">
                <Image
                    src={'/Allegro.CollabGPT.svg'}
                    width={24}
                    height={24}
                    alt="logo"
                    className="mr-1 inline-block"
                />
                Allegro.CollabGPT
            </div>

            <div className="flex">
                {onlineUsers.slice(0, 4).map((user, index) => (
                    <div key={user.id} className="-ml-1">
                        <Image
                            src={user.avatar as string}
                            alt="avatar"
                            width={24}
                            height={18}
                            className="h-6 w-6 rounded-full border"
                            style={{
                                zIndex: `${onlineUsers.length - index}`,
                            }}
                        />
                    </div>
                ))}
                {onlineUsers.length > 4 && (
                    <div
                        className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full border bg-cover text-xs"
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
