export interface User {
    id: string;
    email: string;
    name: string;
    title: string;
    avatar: string;
    timezone: string;
    username: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AuthResponse {
    user: User;
    token: string;
}
export interface LoginCredentials {
    email: string;
    password?: string;
}
export interface RegisterInput {
    name: string;
    email: string;
    password?: string;
    username: string;
    timezone?: string;
}
