import 'server-only';
import { sampleProducts } from '@/features/catalog/data';
import type { Product } from '@/lib/types';
import { demoCatalog } from './config';
import { supabase } from './supabase';
export async function getProducts(): Promise<Product[]> {
  if (demoCatalog()) return sampleProducts;
  const db = await supabase();
  const { data, error } = await db.from('products').select('*').order('created_at');
  if (error) throw error;
  return data as Product[];
}
export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug);
}
