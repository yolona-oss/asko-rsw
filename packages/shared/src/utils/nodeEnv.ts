export function isProdEnv(): boolean {
    return process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'prod'
}

export function isDevEnv(): boolean {
    return process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'dev'
}

export function isCrossEnv(): boolean {
    return isProdEnv() || isDevEnv()
}
