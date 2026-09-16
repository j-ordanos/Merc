import { createClient } from '@supabase/supabase-js';
import { sampleProducts, categories } from '../src/features/catalog/data';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
async function seed() {
  const { error: categoryError } = await db
    .from('categories')
    .upsert(categories.map(({ id, name }) => ({ id, name })));
  if (categoryError) throw categoryError;
  for (const product of sampleProducts) {
    const response = await fetch(product.image_url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok)
      throw new Error(`Image download failed for ${product.slug}: ${response.status}`);
    const imagePath = `${product.slug}.jpg`;
    const { error: imageError } = await db.storage
      .from('products')
      .upload(imagePath, await response.arrayBuffer(), { contentType: 'image/jpeg', upsert: true });
    if (imageError) throw imageError;
    const { data } = db.storage.from('products').getPublicUrl(imagePath);
    const { error } = await db.from('products').upsert({ ...product, image_url: data.publicUrl });
    if (error) throw error;
    console.log(`Seeded ${product.name}`);
  }
  console.log('18 products seeded with images in Supabase Storage. Set DEMO_CATALOG=false.');
}
seed().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Seeding failed');
  process.exitCode = 1;
});
