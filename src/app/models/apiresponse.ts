export class ApiResponse<T> {
    isSuccess: Boolean
    message: string
    data: T
    responseCode: number
}