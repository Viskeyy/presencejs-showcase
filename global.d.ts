type Role = 'user' | 'assistant';

interface Message {
    state: 'inputStart' | 'input' | 'deltaStart' | 'delta';
    role: Role;
    content: string;
    avatar: string;
}

interface UserInfo {
    id: string;
    name: string;
    avatar: string;
    color: string;
    mouseX: number;
    mouseY: number;
    cursorMessage?: string;
}
