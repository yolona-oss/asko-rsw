'use client';

import { useCallback, useEffect, useState } from 'react';
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

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';

export function EditorToolbar() {
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

    const insertImage = () => {
        const src = prompt('URL изображения:');
        if (src) {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText: '' });
        }
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
            <button type="button" className={btn(false)} onClick={insertImage} title="Изображение">
                Фото
            </button>
        </div>
    );
}
