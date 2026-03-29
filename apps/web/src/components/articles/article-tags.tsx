interface ArticleTagsProps {
    tags?: string[];
}

export function ArticleTags({ tags }: ArticleTagsProps) {
    if (!tags || tags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="px-3 py-1 text-xs text-text-sub bg-white border border-border-light/30 rounded-sm"
                >
                    {tag}
                </span>
            ))}
        </div>
    );
}
