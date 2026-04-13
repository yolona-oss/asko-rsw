const pstmTable: { [key: string]: number } = {
    "s": 1000,
    "m": 60 * 1000,
    "h": 60 * 60 * 1000,
    "d": 24 * 60 * 60 * 1000,
    "w": 7 * 24 * 60 * 60 * 1000,
    "y": 365 * 24 * 60 * 60 * 1000,
}

export function parseSleepTimeToMs(time: string) {
    let val = 0
    let mod = ""
    for (let i = 0; i < time.length || mod.length === 1; i++) {
        const ch = time[i]
        if (ch == undefined) break
        if (ch == " ") continue
        if (ch.match(/[0-9]/)) {
            val *= 10
            val += Number(ch)
        } else if (ch.match(/[a-zA-Z]/)) {
            mod = ch
        }
    }
    if (!mod) mod = "s"
    if (pstmTable[mod] == undefined) {
        throw new Error("Invalid pstm time format")
    }
    return val * pstmTable[mod]
}
