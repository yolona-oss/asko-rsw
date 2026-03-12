export function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

export function timeoutPromise(timeout: number): Promise<void> {
    return new Promise(function(_, reject) {
        setTimeout(function() {
            reject("Timeout")
        }, timeout)
    })
}

export async function randSleep(max: number = 1000, min: number = 100) {
    let ms = Math.round(Math.random() * (max-min) + min)
    return await sleep(ms)
}

export namespace time {
    const pstmTable: { [key: string]: number } = {
        "s": 1000,
        "m": 60 * 1000,
        "h": 60 * 60 * 1000,
        "d": 24 * 60 * 60 * 1000,
        "w": 7 * 24 * 60 * 60 * 1000,
        "y": 365 * 24 * 60 * 60 * 1000,
    }

    /***
     * Parse string number with modifier(like shell sleep: "1s", "1m", "1h", "1d", "1w", "1y") to milliseconds.
     * If mod is not specified, "s" is used
     * throws error if time modifier is invalid
     *
     * Modifiers: s, m, h, d, w, y
     */
    export function parseSleepTimeToMs(time: string) {
        let val = 0
        let mod = ""
        for (let i = 0; i < time.length || mod.length === 1; i++) {
            const ch = time[i]
            if (ch == undefined) break
            if (ch == " ")
                continue
            if (ch.match(/[0-9]/)) {
                val *= 10
                val += Number(ch)
            } else if (ch.match(/[a-zA-Z]/)) {
                console.log("setting mod to", ch)
                mod = ch
            }
            console.log(val, mod)
        }

        if (!mod) {
            mod = "s"
        }

        if (pstmTable[mod] == undefined) {
            throw new Error("Invalid pstm time format")
        }

        return val * pstmTable[mod]
    }

    type TimePart = "hh" | "mm" | "ss";
    type TimeFormat =
    | `${TimePart}:${TimePart}`
    | `${TimePart}-${TimePart}`
    | `${TimePart} ${TimePart}`
    | `${TimePart}:${TimePart}:${TimePart}`
    | `${TimePart}-${TimePart}-${TimePart}`
    | `${TimePart} ${TimePart} ${TimePart}`;

    function extractTimeParts(time: string, format: TimeFormat) {
        const delimiter = format.includes(":")
            ? ":"
            : format.includes("-")
                ? "-"
                : " ";

        return {
            formatParts: format.split(delimiter) as TimePart[],
            timeParts: time.split(delimiter)
        }
    }

    /***
     * Checks if string time(like "00:10:30") string matches the given format(like "hh:mm:ss")
     * Also cheks for hours, minutes and seconds range (0-23, 0-59, 0-59)
     */
    export function validateTime(time: string, format: TimeFormat): boolean {
        const { formatParts, timeParts } = extractTimeParts(time, format);

        if (formatParts.length !== timeParts.length) return false;

        for (let i = 0; i < formatParts.length; i++) {
            const num = Number(timeParts[i]);
            if (!Number.isInteger(num)) return false;

            switch (formatParts[i]) {
                case "hh":
                    if (num < 0 || num > 23) return false;
                    break;
                case "mm":
                case "ss":
                    if (num < 0 || num > 59) return false;
                    break;
            }
        }
        return true;
    }

    export type HMSTime = {
        hour: number,
        minutes: number,
        seconds: number,
        milliseconds: number,
    }

    /***
     * Parse string time(like "00:10:30") to HMSTime object
     */
    export function parseTimeToHMS(time: string, format: TimeFormat): HMSTime {
        const { formatParts, timeParts } = extractTimeParts(time, format);

        if (formatParts.length !== timeParts.length) {
            throw new Error("Time does not match format");
        }

        const result: HMSTime = {
            hour: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
        };

        for (let i = 0; i < formatParts.length; i++) {
            const num = Number(timeParts[i]);
            if (!Number.isInteger(num)) {
                throw new Error(`Invalid number at position ${i + 1}`);
            }

            switch (formatParts[i]) {
                case "hh":
                    if (num < 0 || num > 23) throw new Error("Invalid hours");
                    result.hour = num;
                    break;
                case "mm":
                    if (num < 0 || num > 59) throw new Error("Invalid minutes");
                    result.minutes = num;
                    break;
                case "ss":
                    if (num < 0 || num > 59) throw new Error("Invalid seconds");
                    result.seconds = num;
                    break;
            }
        }

        // Calculate total milliseconds
        result.milliseconds =
            result.hour * 60 * 60 * 1000 +
                result.minutes * 60 * 1000 +
                result.seconds * 1000;

        return result;
    }


    /***
     * Add hms time to selected date
     */
    export function add(time: Partial<HMSTime>, date = new Date()) {
        let copy = new Date(date)
        return new Date(copy.setTime(copy.getTime() +
            ( time.hour ?? 0) * 3600000 +
            ( time.minutes ?? 0) * 6000 +
            ( time.seconds ?? 0) * 1000) +
            ( time.milliseconds ?? 0))
    }

    /***
     * Convert any value to date
     * for void returns epoch
     */
    export function toDate(date: any) {
        if (date === void 0) {
            return new Date(0);
        }
        if (isDate(date)) {
            return date;
        } else {
            return new Date(parseFloat(date.toString()));
        }
    }

    export function isDate(date: any) {
        return (date instanceof Date);
    }

    export function format(date: any, format: string) {
        var d = toDate(date);
        return format
            .replace(/Y/gm, d.getFullYear().toString())
            .replace(/m/gm, ('0' + (d.getMonth() + 1)).substr(-2))
            .replace(/d/gm, ('0' + (d.getDate() + 1)).substr(-2))
            .replace(/H/gm, ('0' + (d.getHours() + 0)).substr(-2))
            .replace(/i/gm, ('0' + (d.getMinutes() + 0)).substr(-2))
            .replace(/s/gm, ('0' + (d.getSeconds() + 0)).substr(-2))
            .replace(/v/gm, ('0000' + (d.getMilliseconds() % 1000)).substr(-3));
    }

    export function rawMS(time: Partial<HMSTime>) {
        return ( time.hour ?? 0) * 3600000 +
            ( time.minutes ?? 0) * 6000 +
            ( time.seconds ?? 0) * 1000 +
            ( time.milliseconds ?? 0)
    }

    /***
     * Convert one day time vector(like "00:10:30") to milliseconds
     */
    export function timeToMilliseconds(time: string, format: TimeFormat): number {
        const { formatParts, timeParts } = extractTimeParts(time, format);

        if (formatParts.length !== timeParts.length) {
            throw new Error("Time does not match the given format.");
        }

        let totalMs = 0;

        for (let i = 0; i < formatParts.length; i++) {
            const num = Number(timeParts[i]);
            if (!Number.isInteger(num)) {
                throw new Error(`Invalid number at position ${i + 1}`);
            }

            switch (formatParts[i]) {
                case "hh":
                    if (num < 0 || num > 23) throw new Error("Invalid hour value");
                    totalMs += num * 60 * 60 * 1000;
                    break;
                case "mm":
                    if (num < 0 || num > 59) throw new Error("Invalid minute value");
                    totalMs += num * 60 * 1000;
                    break;
                case "ss":
                    if (num < 0 || num > 59) throw new Error("Invalid second value");
                    totalMs += num * 1000;
                    break;
            }
        }

        return totalMs;
    }
}
