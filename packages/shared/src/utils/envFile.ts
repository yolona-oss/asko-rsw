import fs from 'fs'
import path from 'path'
import { isProdEnv, isDevEnv } from './nodeEnv'

const findRepoRoot = (_: string) => './'

export function getEnvFileDir(): string {
    return findRepoRoot(process.cwd())
}

const prodPostfixes = ['production', 'prod']
const devPostfixes = ['development', 'dev']
const avaliableEnvPostfixes = [...prodPostfixes, ...devPostfixes]

function getExistsEnvPostfix(postfixes: string[]): string {
    const baseDir = getEnvFileDir()

    for (const postfix of postfixes) {
        const file = path.join(baseDir, `.env.${postfix}`)
        // console.log(`Look up for: "${file}"`)

        if (fs.existsSync(file)) {
            return postfix
        }
    }

    throw new Error(
        'Unable to find .env file with avaliable postfixes: ' +
        postfixes.join(', ') +
        '. In: ' +
        baseDir
    )
}

function resolveEnvFile(): string {
    const basePath = getEnvFileDir()

    if (!process.env.NODE_ENV) {
        return path.join(basePath, '.env')
    }

    if (!avaliableEnvPostfixes.includes(process.env.NODE_ENV)) {
        throw new Error(`Unsupported NODE_ENV: ${process.env.NODE_ENV}`)
    }

    if (isDevEnv()) {
        return path.join(basePath, `.env.${getExistsEnvPostfix(devPostfixes)}`)
    }

    if (isProdEnv()) {
        return path.join(basePath, `.env.${getExistsEnvPostfix(prodPostfixes)}`)
    }

    return path.join(basePath, '.env')
}

export function getEnvFilePath(): string | undefined {
    try {
        const dotenvpath = resolveEnvFile()
        // console.log(`ENV on use: ${dotenvpath}`)
        return dotenvpath
    } catch {
        return undefined;
    }
}
