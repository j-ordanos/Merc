import { CartPage } from '@/features/cart/cart-page';
export const metadata = { title: 'Your bag' };
export default function Cart() {
  return (
    <div className="container page-section">
      <CartPage />
    </div>
  );
}
