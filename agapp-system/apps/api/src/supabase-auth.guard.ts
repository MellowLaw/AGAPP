import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const token = authHeader.split(' ')[1];
    const supabase = this.supabaseService.getClient();

    if (!supabase) {
      // Mock mode fallback for local prototype simplicity
      return true;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired access token.');
      }
      
      // Attach user object to the request context
      request.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Authentication failed.');
    }
  }
}
