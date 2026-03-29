/**
 * Convert Lexical editor state JSON to HTML string.
 * Pure function — no DOM required, works in SSR/Node.js.
 */
export function generateArticleHTML(content: Record<string, any>): string {
    const root = content?.root;
    if (!root || !root.children) return '';
    return root.children.map((node: any) => nodeToHTML(node)).join('');
}

function nodeToHTML(node: any): string {
    if (!node) return '';

    switch (node.type) {
        case 'paragraph':
            return `<p>${childrenToHTML(node)}</p>`;
        case 'heading': {
            const tag = node.tag || 'h2';
            return `<${tag}>${childrenToHTML(node)}</${tag}>`;
        }
        case 'list': {
            const tag = node.listType === 'number' ? 'ol' : 'ul';
            return `<${tag}>${childrenToHTML(node)}</${tag}>`;
        }
        case 'listitem':
            return `<li>${childrenToHTML(node)}</li>`;
        case 'link': {
            const url = node.url || '#';
            const rel = node.rel || 'noopener noreferrer';
            return `<a href="${escapeAttr(url)}" rel="${rel}" target="_blank">${childrenToHTML(node)}</a>`;
        }
        case 'quote':
            return `<blockquote>${childrenToHTML(node)}</blockquote>`;
        case 'code':
            return `<pre><code>${childrenToHTML(node)}</code></pre>`;
        case 'image':
            return `<img src="${escapeAttr(node.src || '')}" alt="${escapeAttr(node.altText || '')}" style="max-width:100%" />`;
        case 'text':
            return formatText(node);
        case 'linebreak':
            return '<br />';
        default:
            if (node.children) return childrenToHTML(node);
            return '';
    }
}

function childrenToHTML(node: any): string {
    if (!node.children || !Array.isArray(node.children)) return '';
    return node.children.map((child: any) => nodeToHTML(child)).join('');
}

function formatText(node: any): string {
    let text = escapeHTML(node.text ?? '');
    const format = node.format ?? 0;
    // Lexical text format is a bitmask: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code
    if (format & 16) text = `<code>${text}</code>`;
    if (format & 1) text = `<strong>${text}</strong>`;
    if (format & 2) text = `<em>${text}</em>`;
    if (format & 8) text = `<u>${text}</u>`;
    if (format & 4) text = `<s>${text}</s>`;
    return text;
}

function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
