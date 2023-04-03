'use client';

import Image from 'next/image';
import { getMousePosition } from '../../helper/userCursorHelper';
import { CursorIcon } from './CursorIcon';

export const OtherCursor = ({ userList }: { userList: UserInfo[] }) => {
    return (
        <>
            {userList.map((user) => {
                const position = getMousePosition(user.mouseX, user.mouseY);
                return (
                    <div
                        key={user.id}
                        className='z-50 fixed top-0 left-0 w-full h-full bg-transparent pointer-events-none'
                        style={{
                            transform: `translate3d(${position.mouseX}px,${position.mouseY}px,0)`,
                        }}
                    >
                        <CursorIcon color={user.color} />
                        <div
                            className={`absolute top-4 left-4 px-2 py-1`}
                            style={{
                                borderRadius: user.cursorMessage ? 30 : 15,
                                borderTopLeftRadius: user.cursorMessage
                                    ? 10
                                    : 15,
                                backgroundColor: user.color,
                            }}
                        >
                            <div className='flex h-full items-center'>
                                <Image
                                    className='rounded-full w-4 h-4'
                                    src={user.avatar}
                                    alt='avatar'
                                    width={16}
                                    height={16}
                                />
                                &nbsp;
                                <span className='text-xs text-white'>
                                    {user.name}
                                </span>
                                &nbsp;
                            </div>

                            {user.cursorMessage && (
                                <div className='mx-4 bg-transparent text-sm border-0 text-white'>
                                    {user.cursorMessage}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
};
