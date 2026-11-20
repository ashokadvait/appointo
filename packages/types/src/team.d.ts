export type TeamRole = 'owner' | 'admin' | 'member';
export type SchedulingType = 'one_on_one' | 'group' | 'round_robin' | 'collective';
export interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    role: TeamRole;
    user?: import('./user').User;
}
export interface Team {
    id: string;
    name: string;
    slug: string;
    description?: string;
    avatar?: string;
    members: TeamMember[];
    createdAt: string;
}
