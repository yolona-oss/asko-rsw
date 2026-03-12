export type XOR<T, U> = (T | U) extends object
    ? (T & { [K in Exclude<keyof U, keyof T>]?: never }) |
        (U & { [K in Exclude<keyof T, keyof U>]?: never })
    : T | U;
