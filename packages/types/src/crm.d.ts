export interface ContactNote {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
}
export interface Contact {
    id: string;
    userId: string;
    name: string;
    email: string;
    timezone?: string;
    phone?: string;
    tags: string[];
    totalBookings: number;
    totalSpend: number;
    lastMeetingAt?: string;
    notes: ContactNote[];
    createdAt: string;
    updatedAt: string;
}
