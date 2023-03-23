type Role = 'user' | 'assistant';

interface Message {
    state?: 'input' | 'deltaStart';
    role: Role;
    content: string;
    messageId: string;
}

interface UserInfo {
    id: string;
    name?: string;
    color?: string;
}

interface TypingState {
    user: UserInfo;
    content: string;
}
