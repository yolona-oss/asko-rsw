import crypto from 'crypto'
import * as argon2 from 'argon2'

enum AlphabetOrderType {
    LowerCase,
    UpperCase,
    Number,
    SpecialCharacter
}

const alphabets = [
    {
        type: AlphabetOrderType.LowerCase,
        length: 26,
        alphabet: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    },
    {
        type: AlphabetOrderType.UpperCase,
        length: 26,
        alphabet: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    },
    {
        type: AlphabetOrderType.Number,
        length: 10,
        alphabet: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    },
    {
        type: AlphabetOrderType.SpecialCharacter,
        length: 31,
        alphabet: ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}', '~'],
    }
]

const SALT_LENGTH = 32

function getLsb(byte: number): number {
    return byte & 1
}

function interleavePasswordSalt(pass: Buffer, salt: Buffer): Buffer {
    const hash = crypto.createHash('sha512').update(pass).digest()
    const parts: number[] = []

    let prev = -1
    let cur: number
    let inserted = 0

    for (let i = 0; i < pass.length; i++) {
        parts.push(pass[i])

        if (inserted < salt.length) {
            cur = getLsb(pass[i]) ^ getLsb(hash[i % hash.length])

            if (cur === 1) {
                parts.push(salt[inserted++])
            } else if (prev === 0) {
                parts.push(salt[inserted++])
                if (inserted < salt.length) {
                    parts.push(salt[inserted++])
                }
                i++
            }
            prev = cur
        }
    }

    for (let i = inserted; i < salt.length; i++) {
        parts.push(salt[i])
    }

    return Buffer.from(parts)
}

class CryptoService {
    static async createPasswordHash(plain: string): Promise<string> {
        const salt = crypto.randomBytes(SALT_LENGTH)
        const pass = Buffer.from(plain, 'utf-8')

        const combined = interleavePasswordSalt(pass, salt)

        const argonHash = await argon2.hash(combined, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        })

        return salt.toString('hex') + '.' + argonHash
    }

    static async comparePasswords(plain: string, stored: string): Promise<boolean> {
        const dotIndex = stored.indexOf('.')
        if (dotIndex === -1) {
            return false
        }

        const saltHex = stored.substring(0, dotIndex)
        const argonHash = stored.substring(dotIndex + 1)

        const salt = Buffer.from(saltHex, 'hex')
        const pass = Buffer.from(plain, 'utf-8')

        const combined = interleavePasswordSalt(pass, salt)

        try {
            return await argon2.verify(argonHash, combined)
        } catch {
            return false
        }
    }

    static createTokenHash(value: string) {
        return crypto.createHash('sha512').update(value).digest('hex')
    }

    static calculateEntropy(str: string) {
        let L = 0
        const strArr = Array.from(str)
        const usedAlpas = new Set<AlphabetOrderType>()
        for (const set of alphabets) {
            if (strArr.some(c => set.alphabet.includes(c))) {
                L += set.length
                usedAlpas.add(set.type)
            }
        }
        return {
            entropy: Math.log2(Math.pow(L, str.length)),
            alphabetLength: L,
            alphabetsUsed: usedAlpas
        }
    }
}

export default CryptoService
