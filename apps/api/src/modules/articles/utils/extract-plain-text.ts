/**
 * Extracts plain text from a Lexical editor state JSON.
 * Recursively walks the node tree and concatenates text content.
 */
export function extractPlainText(editorState: Record<string, any>): string {
    const root = editorState?.root;
    if (!root) return '';
    return extractFromNode(root).trim();
}

function extractFromNode(node: Record<string, any>): string {
    if (node.type === 'text') {
        return node.text ?? '';
    }

    if (!node.children || !Array.isArray(node.children)) {
        return '';
    }

    const isBlock = ['root', 'paragraph', 'heading', 'quote', 'list', 'listitem'].includes(node.type);
    const parts = node.children.map((child: Record<string, any>) => extractFromNode(child));
    const joined = parts.join('');

    if (isBlock && node.type !== 'root') {
        return joined + '\n';
    }

    return joined;
}
