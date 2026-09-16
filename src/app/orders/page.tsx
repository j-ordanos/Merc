import { OrdersPage } from '@/features/orders/order-pages';
export const metadata = { title: 'Your orders' };
export default function Orders() {
  return (
    <div className="container page-section">
      <OrdersPage />
    </div>
  );
}
