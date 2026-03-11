import { IUser } from "./user/user.type"

export interface IProductReview {
    id: string
    // product: IProduct
    user: IUser
    text: string
    rating: number
}
