interface SocketSuccessResponse<T> {
    success: true;
    data: T;
}

interface SocketErrorResponse {
    success: false;
    message: string;
}

class SocketResponse {
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

export default SocketResponse;