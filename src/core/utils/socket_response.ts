
class SocketResponseBuilder {
    static success<T>(data: T): T {
        return data;
    }

    static error(message: string): string {
        return message;
    }
}

export default SocketResponseBuilder;
