interface SocketSuccessResponse<T> {
    readonly success: true;
    readonly data: T;
}

interface SocketErrorResponse {
    readonly success: false;
    readonly message: string;
    readonly statusCode: number;
    readonly errors?: unknown;
}

type SocketResponse<T> =
    | SocketSuccessResponse<T>
    | SocketErrorResponse;

class SocketResponseBuilder {
    static success<T>(
        data: T,
    ): SocketSuccessResponse<T> {
        return {
            success: true,
            data,
        };
    }

    static error(
        message: string,
        statusCode: number,
        errors?: unknown,
    ): SocketErrorResponse {
        return {
            success: false,
            message,
            statusCode,
            ...(errors !== undefined && {
                errors,
            }),
        };
    }
}

export default SocketResponseBuilder;