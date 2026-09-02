export class apiresponse<T> {
    isSuccess: Boolean
    message: string
    data: T
    responseCode: number
}