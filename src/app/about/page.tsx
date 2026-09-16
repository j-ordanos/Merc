import Link from 'next/link';
export const metadata = { title: 'The Merc way' };
export default function About() {
  return (
    <div className="container prose-page">
      <span className="eyebrow">THE MERC WAY</span>
      <h1>
        Fewer things.
        <br />
        <em>More meaning.</em>
      </h1>
      <p className="lead">
        Merc is a small collection of good things for your everyday. Home goods, useful companions,
        and little details that make a place your own.
      </p>
      <h2>Thoughtfully chosen</h2>
      <p>
        We look for simple forms, useful details, and things you’ll enjoy reaching for. Our
        collection brings together home goods, accessories, and everyday essentials.
      </p>
      <h2>Delivery & pricing</h2>
      <p>
        Our demonstration store offers free delivery within Addis Ababa. All prices are in Ethiopian
        birr (ETB), with tax included. There are no additional charges at checkout.
      </p>
      <h2>A note about this store</h2>
      <p>
        Merc was built as a frontend engineering challenge. Products and delivery are illustrative.
        Checkout uses StarPay’s sandbox and the test phone number 0900000000. No physical orders are
        fulfilled.
      </p>
      <h2>Your account & orders</h2>
      <p>
        Create an account to check out and revisit your orders. Your bag stays in this browser
        between visits. Payment is confirmed securely before an order is marked paid.
      </p>
      <Link className="button" href="/products">
        Explore the collection ↗
      </Link>
    </div>
  );
}
