'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { CursorIcon } from './CursorIcon';
import { fromEvent, map } from 'rxjs';
import { getMousePosition, getScale } from '../../helper/userCursorHelper';
import { IChannel } from '@yomo/presence';

export const MyCursor = ({
    user,
    channel,
}: {
    user: UserInfo;
    channel: IChannel;
}) => {
    // const [currentUser, setCurrentUser] = useState<UserInfo>(user);
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [mousePosition, setMousePosition] = useState({
        mouseX: 0,
        mouseY: 0,
    });

    const onChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === '/') {
            return;
        }

        channel?.updateMetadata({
            ...user,
            cursorMessage: e.target.value,
        });

        setInputValue(e.target.value);
    };

    const keyDownHandler = (e: KeyboardEvent) => {
        if (e.code === 'Slash') {
            setShowInput(true);
        }
        if (e.code === 'Escape') {
            setInputValue('');
            setShowInput(false);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', keyDownHandler);
        return () => {
            document.removeEventListener('keydown', keyDownHandler);
        };
    }, []);

    useEffect(() => {
        const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');

        const movement$ = mouseMove$.pipe(
            map((event) => {
                const { scaleX, scaleY } = getScale(
                    event.clientX,
                    event.clientY
                );
                return { x: scaleX, y: scaleY };
            })
        );

        movement$.subscribe((data) => {
            const position = getMousePosition(data.x, data.y);
            setMousePosition(position);

            channel?.updateMetadata({
                ...user,
                mouseX: data.x,
                mouseY: data.y,
            });
        });
    }, [channel]);

    return (
        <div
            className='z-50 fixed top-0 left-0 w-full h-full bg-transparent pointer-events-none'
            style={{
                transform: `translate3d(${mousePosition.mouseX}px,${mousePosition.mouseY}px,0)`,
            }}
        >
            <CursorIcon color={user.color} />
            <div
                className='absolute top-4 left-4 px-2 py-1'
                style={{
                    borderRadius: showInput ? 30 : 15,
                    borderTopLeftRadius: showInput ? 10 : 15,
                    backgroundColor: user.color,
                }}
            >
                <div className='flex h-full items-center'>
                    <Image
                        className='w-4 h-4 rounded-full'
                        src={user.avatar}
                        alt='avatar'
                        width={16}
                        height={16}
                    />
                    &nbsp;
                    <span className='text-[#fff] text-xs'>{user.name}</span>
                    &nbsp;
                    {/* <Latency cursor={cursor} showLatency={showLatency} /> */}
                </div>

                {showInput && (
                    <input
                        className='mx-4 w-72 bg-transparent text-sm border-0 outline-0 text-white'
                        type='text'
                        placeholder='Say something...'
                        value={inputValue}
                        onChange={onChangeInput}
                        autoFocus
                    />
                )}
            </div>
        </div>
    );
};
