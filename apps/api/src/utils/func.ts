import { sleep } from "./time";

export async function timeout<T>(task: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Operation timed out"));
        }, timeout);

        task()
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

export async function retrier<T>(fn: () => Promise<T>, opts?: { tries?: number, wait?: number, timeout?: number }): Promise<T> {
    const default_opts = { tries: 3, wait: 700, timeout: 0 }
    const _opts = {
        ...default_opts,
        ...opts
    }
    if (_opts.timeout <= 0) {
        console.error("Timeout must be greater than 0. Setting to 0.")
        _opts.timeout = 0
    }

    const checkFn = async () => {
        try {
            return await fn()
        } catch (e) {
            await sleep(_opts.wait)
            return null
        }
    }
    let loopFn: () => Promise<T|null>
    if (_opts.timeout > 0) {
        // timeouted
        loopFn = async () => await new Promise((res) => {
            timeout(checkFn, _opts.timeout).then((v) => {
                if (!v) { res(null) }
                res(v)
            }).catch(() => { res(null) })
        })
    } else {
        loopFn = checkFn
    }
    for (let tryn = 0; tryn < _opts.tries; tryn++) {
        const res = await loopFn()
        if (res) { return res } // exit success
    }

    throw "Unreachable action: " + fn.name
}
