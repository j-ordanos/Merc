import Link from 'next/link';

export const metadata = { title: 'Help and store information' };

export default function Help() {
  return (
    <div className="container page-section help-page">
      <div className="page-heading">
        <span className="eyebrow">STORE INFORMATION</span>
        <h1>Help with your order</h1>
        <p>Answers about checkout, payments and your account.</p>
      </div>
      <div className="help-grid">
        <section>
          <h2>About this store</h2>
          <p>
            Browse home goods, accessories and stationery. Prices are shown in Ethiopian birr (ETB)
            and include tax. Your order details and payment status are available in order history.
          </p>
        </section>
        <section id="payment">
          <h2>Payment and status</h2>
          <p>
            Checkout opens StarPay’s sandbox payment page. Use the test number{' '}
            <strong>0900000000</strong>; do not use a real phone number. Your order is marked paid
            only after the server verifies the payment. If verification is delayed, return to your
            order and use “Check payment status” before starting another payment.
          </p>
          <Link href="/orders" className="text-link">
            View your orders →
          </Link>
        </section>
        <section>
          <h2>Your account</h2>
          <p>
            You can browse and build a bag without signing in. An account is needed to check out and
            see your private order history. The bag is saved in this browser, so it will not follow
            you to another device.
          </p>
          <p>Use the avatar in the top-right corner to view your email or sign out.</p>
        </section>
        <section>
          <h2>Need access to your account?</h2>
          <p>
            Use the password reset page if you cannot sign in. Confirmation and reset emails are
            sent through Supabase authentication.
          </p>
          <Link href="/auth/forgot-password" className="text-link">
            Reset your password →
          </Link>
        </section>
      </div>
    </div>
  );
}
