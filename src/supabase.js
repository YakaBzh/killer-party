import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhyctcwxylkouirmsjly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoeWN0Y3d4eWxrb3Vpcm1zamx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTY1MTcsImV4cCI6MjA4OTc3MjUxN30.tw9a8m0d9hIHzcuK2OHCQiTEOV1Oc399CkCret8ZINQ';

export const supabase = createClient(supabaseUrl, supabaseKey);