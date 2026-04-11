export interface IArticle {
    id: string;
    title: string;
    slug: string;
    text: string;
    content?: Record<string, any>;
    tags?: string[];
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}
