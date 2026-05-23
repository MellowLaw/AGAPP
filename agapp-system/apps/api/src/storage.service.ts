import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_KEY || ''; // service_role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not configured. Storage operations will use fallback URLs.');
}

const supabase: SupabaseClient | null = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a base64 image to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path (e.g., 'reports/report-123.jpg')
 * @param base64Data - Base64 encoded image data
 * @param contentType - MIME type
 */
export async function uploadBase64Image(
  bucket: string,
  path: string,
  base64Data: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  if (!supabase) {
    console.warn('Supabase not configured, using placeholder URL');
    return {
      success: true,
      url: `https://placehold.co/400x300/A2B59F/ffffff?text=${encodeURIComponent(path)}`,
      path: path,
    };
  }

  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: contentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('Upload error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown upload error',
    };
  }
}

/**
 * Upload a report photo
 * @param reportId - Report reference number
 * @param base64Image - Base64 encoded image
 * @param category - Report category (for organization)
 */
export async function uploadReportPhoto(
  reportId: string,
  base64Image: string,
  category: string = 'general'
): Promise<UploadResult> {
  const timestamp = Date.now();
  const fileName = `${category}/${reportId}_${timestamp}.jpg`;
  
  return uploadBase64Image('report-photos', fileName, base64Image, 'image/jpeg');
}

/**
 * Upload service request attachment
 * @param requestId - Service request reference number
 * @param base64File - Base64 encoded file
 * @param fileName - Original file name
 * @param contentType - MIME type
 */
export async function uploadServiceAttachment(
  requestId: string,
  base64File: string,
  fileName: string,
  contentType: string = 'application/pdf'
): Promise<UploadResult> {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `attachments/${requestId}_${timestamp}_${safeFileName}`;
  
  return uploadBase64Image('service-attachments', path, base64File, contentType);
}

/**
 * Delete a file from storage
 * @param bucket - Storage bucket
 * @param path - File path
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot delete');
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete error:', err);
    return false;
  }
}

/**
 * Check if Supabase storage is configured
 */
export function isStorageConfigured(): boolean {
  return supabase !== null;
}
