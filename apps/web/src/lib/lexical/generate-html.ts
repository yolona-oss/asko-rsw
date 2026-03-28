import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { ImageNode } from '@/components/account/admin/article-form/image-node';

/**
 * Convert Lexical editor state JSON to HTML string.
 * Used server-side for rendering article content in SSR pages.
 */
export function generateArticleHTML(content: Record<string, any>): string {
    const editor = createHeadlessEditor({
        namespace: 'ArticleRenderer',
        nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, ImageNode],
        onError: (error) => {
            console.error('Lexical render error:', error);
        },
    });

    const editorState = editor.parseEditorState(JSON.stringify(content));
    let html = '';

    editorState.read(() => {
        html = $generateHtmlFromNodes(editor);
    });

    return html;
}
