import { CartPage } from '@/features/cart/cart-page';
export const metadata = { title: 'Your bag', robots: { index: false, follow: false } };
export default function Cart() {
  return (
    <div className="container page-section">
      <CartPage />
    </div>
  );
}
