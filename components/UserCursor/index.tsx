'use client';

import { MyCursor } from './MyCursor';
import { OtherCursor } from './OtherCursor';

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
            {/* <OtherCursor userList={onlineUsers} /> */}
        </div>
    );
};
