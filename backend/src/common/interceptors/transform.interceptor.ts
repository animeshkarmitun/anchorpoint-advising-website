import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API response envelope.
 * All successful responses are wrapped in this format:
 * {
 *   success: true,
 *   message: "...",
 *   data: { ... },
 *   meta?: { ... }
 * }
 */
export class ApiResponseDto<T = any> {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Operation completed successfully' })
    message: string;

    @ApiProperty()
    data: T;

    @ApiProperty({ required: false })
    meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponseDto<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<ApiResponseDto<T>> {
        return next.handle().pipe(
            map((responseData) => {
                // If the controller already returned our envelope format, pass through
                if (
                    responseData &&
                    typeof responseData === 'object' &&
                    'success' in responseData
                ) {
                    return responseData as any;
                }

                return {
                    success: true,
                    message: 'Success',
                    data: responseData,
                };
            }),
        );
    }
}
