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
                        className="pointer-events-none fixed left-0 top-0 z-50 h-full w-full bg-transparent"
                        style={{
                            transform: `translate3d(${position.mouseX}px,${position.mouseY}px,0)`,
                        }}
                    >
                        <CursorIcon color={user.color} />
                        <div
                            className={`absolute left-4 top-4 px-2 py-1`}
                            style={{
                                borderRadius: user.cursorMessage ? 30 : 15,
                                borderTopLeftRadius: user.cursorMessage
                                    ? 10
                                    : 15,
                                backgroundColor: user.color,
                            }}
                        >
                            <div className="flex h-full items-center">
                                <Image
                                    className="h-4 w-4 rounded-full"
                                    src={user.avatar}
                                    alt="avatar"
                                    width={16}
                                    height={16}
                                />
                                &nbsp;
                                <span className="text-xs text-white">
                                    {user.name}
                                </span>
                                &nbsp;
                            </div>

                            {user.cursorMessage && (
                                <div className="mx-4 border-0 bg-transparent text-sm text-white">
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
