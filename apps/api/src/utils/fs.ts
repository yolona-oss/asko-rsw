// NOTE: maybe add URL path usage capability
export function extractFileName(filePath: string, removeExtension: boolean = true) {
    const urlArr = filePath.split('/')
    const fullName = urlArr[urlArr.length - 1]
    let fileName = fullName
    if (removeExtension) {
        fileName = fullName.split('.')[0]
    }
    return fileName
}

export function normalizeName(title: string): string {
    return title
        .trim()
        .replace(/\n/g, ' ')
        .replace(/\s\s+/g, ' ')
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (l) => l.toUpperCase()));
}
