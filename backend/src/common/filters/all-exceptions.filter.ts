import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter — catches all errors and returns a standardized response.
 * Format:
 * {
 *   success: false,
 *   message: "...",
 *   error: {
 *     code: "VALIDATION_ERROR",
 *     details: [...]
 *   }
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';
        let details: any = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as any;
                message = resp.message || exception.message;
                details = resp.errors || resp.details || null;

                // Handle class-validator errors
                if (Array.isArray(resp.message)) {
                    message = 'Validation failed';
                    details = resp.message.map((msg: string) => ({
                        field: msg.split(' ')[0],
                        message: msg,
                    }));
                }
            }

            errorCode = this.getErrorCode(status);
        } else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        }

        response.status(status).json({
            success: false,
            message,
            error: {
                code: errorCode,
                statusCode: status,
                details,
                timestamp: new Date().toISOString(),
                path: request.url,
            },
        });
    }

    private getErrorCode(status: number): string {
        const codeMap: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            413: 'PAYLOAD_TOO_LARGE',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_ERROR',
        };
        return codeMap[status] || 'UNKNOWN_ERROR';
    }
}
