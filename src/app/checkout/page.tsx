import { CheckoutPage } from '@/features/checkout/checkout-page';
export const metadata = { title: 'Checkout' };
export default function Checkout() {
  return (
    <div className="container page-section">
      <CheckoutPage />
    </div>
  );
}
