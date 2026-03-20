export interface IArticle {
    id: string;
    title: string;
    slug: string;
    text: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
