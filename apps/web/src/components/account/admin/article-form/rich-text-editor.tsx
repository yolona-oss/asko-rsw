'use client';

import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import type { EditorState } from 'lexical';
import { COMMAND_PRIORITY_EDITOR, $insertNodes } from 'lexical';

import { EditorToolbar } from './editor-toolbar';
import { ImageNode, INSERT_IMAGE_COMMAND, $createImageNode } from './image-node';

interface RichTextEditorProps {
    content?: Record<string, any>;
    onChange: (json: Record<string, any>) => void;
}

const theme = {
    paragraph: 'mb-2',
    heading: {
        h1: 'text-3xl font-bold mb-4',
        h2: 'text-2xl font-bold mb-3',
        h3: 'text-xl font-bold mb-2',
    },
    list: {
        ul: 'list-disc ml-6 mb-2',
        ol: 'list-decimal ml-6 mb-2',
        listitem: 'mb-1',
    },
    link: 'text-brand-red underline',
    text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
    },
};

function ImagePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INSERT_IMAGE_COMMAND,
            (payload) => {
                const imageNode = $createImageNode(payload);
                $insertNodes([imageNode]);
                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [editor]);

    return null;
}

function InitialContentPlugin({ content }: { content?: Record<string, any> }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!content) return;

        editor.update(() => {
            const editorState = editor.parseEditorState(JSON.stringify(content));
            editor.setEditorState(editorState);
        });
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}

/**
 * Convert plain text (from legacy articles) to a Lexical editor state JSON.
 */
export function plainTextToLexicalState(text: string): Record<string, any> {
    const paragraphs = text.split('\n').filter((line) => line.trim());

    return {
        root: {
            children: paragraphs.length > 0
                ? paragraphs.map((line) => ({
                    children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: line, type: 'text', version: 1 }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                    textFormat: 0,
                    textStyle: '',
                }))
                : [{
                    children: [],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                    textFormat: 0,
                    textStyle: '',
                }],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
        },
    };
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const initialConfig = {
        namespace: 'ArticleEditor',
        theme,
        nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, ImageNode],
        onError: (error: Error) => {
            console.error('Lexical error:', error);
        },
    };

    const handleChange = (editorState: EditorState) => {
        const json = editorState.toJSON();
        onChange(json);
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="border border-border-light/30 rounded bg-white">
                <EditorToolbar />
                <div className="relative min-h-[300px]">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable className="outline-none p-4 min-h-[300px] text-text-main" />
                        }
                        placeholder={
                            <div className="absolute top-4 left-4 text-text-sub/50 pointer-events-none">
                                Начните писать статью...
                            </div>
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>
            </div>
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <ImagePlugin />
            <InitialContentPlugin content={content} />
            <OnChangePlugin onChange={handleChange} />
        </LexicalComposer>
    );
}
