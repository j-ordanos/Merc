import { CheckoutPage } from '@/features/checkout/checkout-page';
export const metadata = { title: 'Checkout', robots: { index: false, follow: false } };
export default function Checkout() {
  return (
    <div className="container page-section">
      <CheckoutPage />
    </div>
  );
}
