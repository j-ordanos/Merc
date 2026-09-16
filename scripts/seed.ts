import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
    let image: ArrayBuffer | Buffer;
    try {
      if (process.env.SEED_IMAGE_DIR) {
        image = await readFile(join(process.env.SEED_IMAGE_DIR, `${product.slug}.jpg`));
      } else {
        const response = await axios.get<ArrayBuffer>(product.image_url, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        image = response.data;
      }
    } catch (error) {
      const reason = axios.isAxiosError(error) ? error.code || error.response?.status : 'unknown';
      throw new Error(
        `Image download failed for ${product.slug} (${reason}). Rerun the seed to retry.`,
      );
    }
    const imagePath = `${product.slug}.jpg`;
    const { error: imageError } = await db.storage
      .from('products')
      .upload(imagePath, image, { contentType: 'image/jpeg', upsert: true });
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
