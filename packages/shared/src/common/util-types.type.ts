export type Static<T> = {
    [K in keyof T]: T[K];
};
