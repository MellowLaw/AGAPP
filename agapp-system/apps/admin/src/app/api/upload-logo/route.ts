import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // 1. Authenticate the request using the session cookie
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Read the form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const lguId = formData.get('lguId') as string | null;

    if (!file || !lguId) {
      return NextResponse.json({ error: 'Missing file or lguId' }, { status: 400 });
    }

    // Check authorization: only SUPER_ADMIN or LGU_ADMIN of this specific LGU
    const { data: callerProfile } = await supabaseUser
      .from('users')
      .select('role, lgu_id')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = callerProfile?.role === 'SUPER_ADMIN';
    const isOwnLguAdmin = callerProfile?.role === 'LGU_ADMIN' && callerProfile.lgu_id === lguId;

    if (!isSuperAdmin && !isOwnLguAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only the LGU Administrator of this municipality can upload logos.' }, { status: 403 });
    }

    // Validate file type & size (max 5MB)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP, and SVG images are allowed.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5MB size limit.' }, { status: 400 });
    }

    // 3. Upload using the service role client (bypasses RLS)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${lguId}/logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseService.storage
      .from('facility-images')
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Service-role upload failed:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabaseService.storage.from('facility-images').getPublicUrl(path);
    return NextResponse.json({ publicUrl: data.publicUrl });
  } catch (err: any) {
    console.error('Upload handler crashed:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
