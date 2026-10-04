import { HTTP_STATUS } from "../constants/http_status.js";

class ApiError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        public readonly errors: unknown = null,
    ) {
        super(message);

        this.name = 'ApiError';
    }
}

export default ApiError;