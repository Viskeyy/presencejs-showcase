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
        <div className="pointer-events-none fixed left-0 top-0 z-50 h-full w-full bg-transparent">
            <MyCursor user={currentUser} channel={channel} />
            {/* <OtherCursor userList={onlineUsers} /> */}
        </div>
    );
};
