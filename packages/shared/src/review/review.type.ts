import { IUser } from "../user/user.type.js"

export interface IProductReview {
    id: string
    user: IUser
    comment: string
    rating: number
    repairRequestId: string
}
