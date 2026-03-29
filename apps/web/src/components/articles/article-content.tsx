import { generateArticleHTML } from '@/lib/lexical/generate-html';

interface ArticleContentProps {
    content?: Record<string, any>;
    text: string;
}

export function ArticleContent({ content, text }: ArticleContentProps) {
    let richHTML: string | null = null;
    if (content) {
        try {
            richHTML = generateArticleHTML(content);
        } catch {
            // Fall back to plain text
        }
    }

    if (richHTML) {
        return (
            <div
                className="flex flex-col gap-6 text-lg leading-[22px] tracking-[-0.01em] text-[#150F0F] [&_p]:mb-0 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_a]:text-brand-red [&_a]:underline [&_img]:max-w-full [&_img]:rounded [&_img]:my-2"
                dangerouslySetInnerHTML={{ __html: richHTML }}
            />
        );
    }

    const paragraphs = text.split('\n').filter((p) => p.trim());
    return (
        <div className="flex flex-col gap-6">
            {paragraphs.map((p, i) => (
                <p
                    key={i}
                    className="text-lg leading-[22px] tracking-[-0.01em] text-[#150F0F]"
                >
                    {p}
                </p>
            ))}
        </div>
    );
}
