export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export function convertToSlug(text: string) {
    return text.toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}
