import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request) {
      console.log(`Start request: [${request.method}]:[${request.url}]`);
    }

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(
            `End request:[${request.method}]:[${request.url}] After ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}
