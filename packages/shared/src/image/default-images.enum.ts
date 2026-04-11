export const DefaultImages = {
    User: "user",
    Category: "category"
}

type TDefaultImages = typeof DefaultImages
export type DefaultImagesType = keyof TDefaultImages
//export type DefaultImagesType = {
//    [P in keyof TDefaultImages]: {
//        key: P,
//        value: Values<TDefaultImages[P][number]>
//    }
//}
