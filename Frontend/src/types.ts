export interface User {
    _id: string;
    id?: string; // For compatibility
    name: string;
    username: string;
    email: string;
    avatar?: string;
}

export interface Skill {
    _id: string;
    name: string;
    image: string;
    createdBy?: User | string;
    createdAt?: string;
}

export interface Profile {
    bio?: string;
    title?: string;
    locations?: string;
    resume?: string;
    socialLinks?: { platform: string; url: string }[];
    user?: User;
    skills?: (Skill | string)[];
    codingProfiles?: {
        github?: string;
        leetcode?: string;
        codeforces?: string;
        hackerrank?: string;
        codechef?: string;
    };
}

export interface Project {
    _id?: string;
    title: string;
    description: string;
    tagline?: string;
    skills?: string;
    status: 'draft' | 'published';
    category?: 'personal' | 'professional' | 'others';
    links?: string[];
    tags?: string[];
    images?: string[];
    avatar?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    contributors?: string[];
    userId?: User | string;
    createdAt?: string;
    updatedAt?: string;
    likes?: number; // Add likes
    likedBy?: string[]; // Add likedBy
    views?: number;
    comments?: number;
    shares?: number;
}

export interface Achievement {
    _id?: string;
    title: string;
    description: string;
    organization: string;
    date: string;
    image?: string;
    url?: string;
    userId?: User | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Certification {
    _id?: string;
    name: string;
    issuingOrganization: string;
    issueDate: string;
    credentialId?: string;
    credentialUrl?: string;
    image?: string;
    userId?: User | string;
    createdAt?: string;
    updatedAt?: string;
}


