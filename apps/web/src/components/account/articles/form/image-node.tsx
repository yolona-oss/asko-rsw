import type { ReactNode } from 'react';
import type {
    DOMConversionMap,
    DOMExportOutput,
    EditorConfig,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';
import { $applyNodeReplacement, createCommand, DecoratorNode } from 'lexical';

export const INSERT_IMAGE_COMMAND = createCommand<{ src: string; altText: string }>('INSERT_IMAGE_COMMAND');

export type SerializedImageNode = Spread<
    { src: string; altText: string },
    SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<ReactNode> {
    __src: string;
    __altText: string;

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__altText, node.__key);
    }

    constructor(src: string, altText: string, key?: NodeKey) {
        super(key);
        this.__src = src;
        this.__altText = altText;
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.style.display = 'block';
        return span;
    }

    updateDOM(): false {
        return false;
    }

    exportDOM(): DOMExportOutput {
        const img = document.createElement('img');
        img.setAttribute('src', this.__src);
        img.setAttribute('alt', this.__altText);
        img.style.maxWidth = '100%';
        return { element: img };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            img: () => ({
                conversion: (domNode: HTMLElement) => {
                    const src = domNode.getAttribute('src') ?? '';
                    const altText = domNode.getAttribute('alt') ?? '';
                    return { node: $createImageNode({ src, altText }) };
                },
                priority: 0,
            }),
        };
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        return $createImageNode({
            src: serializedNode.src,
            altText: serializedNode.altText,
        });
    }

    exportJSON(): SerializedImageNode {
        return {
            type: 'image',
            version: 1,
            src: this.__src,
            altText: this.__altText,
        };
    }

    decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
        return (
            <img
                src={this.__src}
                alt={this.__altText}
                className="max-w-full rounded my-2"
                draggable={false}
            />
        );
    }
}

export function $createImageNode({ src, altText }: { src: string; altText: string }): ImageNode {
    return $applyNodeReplacement(new ImageNode(src, altText));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}
