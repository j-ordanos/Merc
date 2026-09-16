import { OrderPage } from '@/features/orders/order-pages';
export const metadata = { title: 'Order details' };
export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="container page-section">
      <OrderPage id={(await params).id} />
    </div>
  );
}
