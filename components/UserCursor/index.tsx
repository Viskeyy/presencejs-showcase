'use client';

import dynamic from 'next/dynamic';

const MyCursor = dynamic(
    () => import('./MyCursor').then((mod) => mod.MyCursor),
    { ssr: false }
);
const OtherCursor = dynamic(
    () => import('./OtherCursor').then((mod) => mod.OtherCursor),
    { ssr: false }
);

export const UserCursor = ({
    channel,
    currentUser,
    onlineUsers,
}: {
    channel: any;
    currentUser: UserInfo;
    onlineUsers: UserInfo[];
}) => {
    return (
        <div className='z-50 fixed top-0 left-0 w-full h-full bg-transparent pointer-events-none'>
            <MyCursor user={currentUser} channel={channel} />
            <OtherCursor userList={onlineUsers} />
        </div>
    );
};
