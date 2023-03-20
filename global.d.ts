type Role = 'user' | 'assistant';

interface Message {
    role: Role;
    content: string;
}

interface UserInfo {
    name: string;
    color: string;
}

interface InputState extends UserInfo {
    content: string;
}
