import { IUser } from "./user/user.type"

export interface IProductReview {
    id: string
    user: IUser
    comment: string
    rating: number
    repairRequestId: string
}
