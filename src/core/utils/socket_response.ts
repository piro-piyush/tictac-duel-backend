interface SocketSuccessResponse<T> {
    readonly success: true;
    readonly data: T;
}

interface SocketErrorResponse {
    readonly success: false;
    readonly message: string;
}

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
    ): SocketErrorResponse {
        return {
            success: false,
            message,
        };
    }
}

export default SocketResponseBuilder;