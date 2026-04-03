'use client';

import { getImageUrl } from '@/lib/image-url';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $isHeadingNode, $createHeadingNode, type HeadingTagType } from '@lexical/rich-text';
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    $isListNode,
    ListNode,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getNearestNodeOfType } from '@lexical/utils';
import { $createParagraphNode } from 'lexical';
import { INSERT_IMAGE_COMMAND } from './image-node';
import { articleApi } from '@/lib/api/article';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from './constants';

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';

interface EditorToolbarProps {
    articleId?: string;
    onRequestArticleId?: () => Promise<string | null>;
}

export function EditorToolbar({ articleId, onRequestArticleId }: EditorToolbarProps) {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [blockType, setBlockType] = useState<BlockType>('paragraph');

    const updateToolbar = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));

            const anchorNode = selection.anchor.getNode();
            const element = anchorNode.getKey() === 'root'
                ? anchorNode
                : anchorNode.getTopLevelElementOrThrow();

            if ($isHeadingNode(element)) {
                setBlockType(element.getTag() as BlockType);
            } else if ($isListNode(element)) {
                const type = element.getListType();
                setBlockType(type === 'number' ? 'ol' : 'ul');
            } else {
                const listNode = $getNearestNodeOfType(anchorNode, ListNode);
                if (listNode && $isListNode(listNode)) {
                    setBlockType(listNode.getListType() === 'number' ? 'ol' : 'ul');
                } else {
                    setBlockType('paragraph');
                }
            }

            const node = selection.anchor.getNode();
            const parent = node.getParent();
            setIsLink($isLinkNode(parent) || $isLinkNode(node));
        });
    }, [editor]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            () => {
                updateToolbar();
                return false;
            },
            COMMAND_PRIORITY_CRITICAL,
        );
    }, [editor, updateToolbar]);

    const formatHeading = (tag: HeadingTagType) => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            if (blockType === tag) {
                $setBlocksType(selection, () => $createParagraphNode());
            } else {
                $setBlocksType(selection, () => $createHeadingNode(tag));
            }
        });
    };

    const insertLink = () => {
        if (isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        } else {
            const url = prompt('URL ссылки:');
            if (url) {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
            }
        }
    };

    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const resolvedArticleId = useRef<string | undefined>(articleId);

    useEffect(() => {
        resolvedArticleId.current = articleId;
    }, [articleId]);

    const ensureArticleId = async (): Promise<string | null> => {
        if (resolvedArticleId.current) return resolvedArticleId.current;
        if (!onRequestArticleId) return null;
        const id = await onRequestArticleId();
        if (id) resolvedArticleId.current = id;
        return id;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (fileRef.current) fileRef.current.value = '';

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
        if (file.size > MAX_IMAGE_SIZE) return;

        setUploading(true);
        try {
            const id = await ensureArticleId();
            if (!id) return;

            const { data } = await articleApi.uploadImage(id, file);
            const src = getImageUrl(data, 'large')!;
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText: '' });
        } catch {
            // silently fail
        } finally {
            setUploading(false);
        }
    };

    const insertImage = () => {
        fileRef.current?.click();
    };

    const btn = (active: boolean) =>
        `px-2 py-1 text-sm rounded transition-colors ${
            active
                ? 'bg-brand-red text-white'
                : 'bg-white text-text-main hover:bg-gray-100 border border-border-light/30'
        }`;

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-border-light/30 bg-gray-50 rounded-t">
            <button type="button" className={btn(isBold)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} title="Жирный">
                <strong>B</strong>
            </button>
            <button type="button" className={btn(isItalic)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} title="Курсив">
                <em>I</em>
            </button>

            <span className="w-px bg-border-light/30 mx-1" />

            <button type="button" className={btn(blockType === 'h1')} onClick={() => formatHeading('h1')} title="Заголовок 1">
                H1
            </button>
            <button type="button" className={btn(blockType === 'h2')} onClick={() => formatHeading('h2')} title="Заголовок 2">
                H2
            </button>
            <button type="button" className={btn(blockType === 'h3')} onClick={() => formatHeading('h3')} title="Заголовок 3">
                H3
            </button>

            <span className="w-px bg-border-light/30 mx-1" />

            <button type="button" className={btn(blockType === 'ul')} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} title="Маркированный список">
                &bull; Список
            </button>
            <button type="button" className={btn(blockType === 'ol')} onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} title="Нумерованный список">
                1. Список
            </button>

            <span className="w-px bg-border-light/30 mx-1" />

            <button type="button" className={btn(isLink)} onClick={insertLink} title="Ссылка">
                Ссылка
            </button>
            <button type="button" className={btn(false)} onClick={insertImage} disabled={uploading} title={articleId ? 'Загрузить изображение' : 'Сохраните статью для загрузки'}>
                {uploading ? 'Загрузка...' : 'Фото'}
            </button>
            <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleImageUpload}
            />
        </div>
    );
}
