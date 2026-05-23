import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null;

  onModuleInit() {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_KEY || '';

    if (url && key) {
      this.client = createClient(url, key);
      console.log('[SupabaseService] Initialized Supabase client successfully.');
    } else {
      console.warn('[SupabaseService] WARNING: SUPABASE_URL or SUPABASE_KEY missing. Running with mock fallback capability.');
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }
}
