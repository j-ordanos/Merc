import type { CartItem, Product } from '@/lib/types';
export function calculateOrder(items: CartItem[], products: Product[]) {
  if (!items.length || new Set(items.map((i) => i.productId)).size !== items.length)
    throw new Error('Choose each product only once.');
  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product?.available)
      throw new Error('A product is no longer available. Please review your bag.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10)
      throw new Error('Choose a quantity between 1 and 10.');
    if (!Number.isSafeInteger(product.price_minor) || product.price_minor < 1)
      throw new Error('Invalid catalog price.');
    return {
      product_id: product.id,
      name: product.name,
      description: product.description,
      image_url: product.image_url,
      unit_price_minor: product.price_minor,
      quantity: item.quantity,
    };
  });
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unit_price_minor, 0);
  if (!Number.isSafeInteger(total)) throw new Error('Order total is too large.');
  return { lines, total };
}
