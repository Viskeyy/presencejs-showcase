'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { CursorIcon } from './CursorIcon';
import { fromEvent, map } from 'rxjs';
import { getMousePosition, getScale } from '../../helper/userCursorHelper';

export const MyCursor = ({
    user,
    channel,
}: {
    user: UserInfo;
    channel: any;
}) => {
    const cursorElement = useRef<HTMLDivElement>(null);

    const [currentUser, setCurrentUser] = useState<UserInfo>(user);
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const onChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === '/') {
            return;
        }

        channel.updateMetadata({
            ...currentUser,
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

            cursorElement.current?.style.setProperty(
                'transform',
                `translate3d(${position.mouseX}px,${position.mouseY}px,0)`
            );

            setCurrentUser((currentUser) => ({
                ...currentUser,
                mouseX: data.x,
                mouseY: data.y,
            }));

            channel?.updateMetadata({
                ...currentUser,
                mouseX: data.x,
                mouseY: data.y,
            });

            console.log('mouse move');
        });
    }, []);

    return (
        <div
            ref={cursorElement}
            className='z-50 fixed top-0 left-0 w-full h-full bg-transparent pointer-events-none'
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
