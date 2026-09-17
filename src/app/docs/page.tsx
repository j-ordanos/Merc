import Link from 'next/link';
import { InfoPage } from '@/components/info-page';

export const metadata = { title: 'How Merc works' };

const steps = [
  [
    'Create an account',
    'Browse first if you like. Sign up or sign in when you are ready to check out and view your own orders.',
  ],
  [
    'Browse products',
    'Open the full collection, choose a category, or use the search icon from any page to find a product by name.',
  ],
  [
    'Select a product',
    'Open its page to see photos, the ETB price, description and product details. Choose a quantity before adding it.',
  ],
  [
    'Add to your bag',
    'Your bag holds selected items in this browser. Review quantities or remove items before checkout.',
  ],
  [
    'Check out',
    'Enter your name, email, phone and delivery address. Review the total before continuing.',
  ],
  [
    'Choose a payment method',
    'Merc opens StarPay’s hosted sandbox checkout. The payment options offered there are shown by StarPay.',
  ],
  [
    'Complete payment',
    'Follow the instructions on StarPay. Keep the order page available while payment status is checked.',
  ],
  [
    'Confirm your order',
    'Open your order page or order history to see its latest status. If confirmation takes time, use “Check payment status” before starting another payment.',
  ],
];

const faqs = [
  [
    'How do I create an account?',
    'Select the account icon in the header, choose Sign up, and follow the email and password steps.',
  ],
  [
    'How do I buy a product?',
    'Open the product, add it to your bag, review the bag, then continue to checkout. Sign in when prompted.',
  ],
  [
    'What payment methods can I use?',
    'StarPay lists the options available in its hosted sandbox checkout. Merc does not collect your payment credentials.',
  ],
  [
    'What happens after payment?',
    'Merc checks the payment on the server. Your order page shows Paid only after confirmation.',
  ],
  [
    'Where can I find my order?',
    'Select Orders in the header while signed in. Each order has a detail page.',
  ],
  [
    'What if payment fails or stays pending?',
    'Open that order and select “Check payment status.” Avoid paying again until you know the result.',
  ],
  [
    'How can I get help?',
    'Read the Help center for account and payment guidance. A sample contact address is listed there for replacement before launch.',
  ],
];

export default function Docs() {
  return (
    <InfoPage
      eyebrow="SHOPPING GUIDE"
      title="How Merc works"
      intro="From finding the right piece to checking your order, here is the full shopping journey."
    >
      <nav className="info-jump" aria-label="On this page">
        <a href="#steps">Shopping steps</a>
        <a href="#faq">Common questions</a>
        <Link href="/help">Help center</Link>
      </nav>
      <section className="guide-section" id="steps">
        <h2>Eight simple steps</h2>
        <ol className="steps-grid">
          {steps.map(([title, body], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="guide-section faq-section" id="faq">
        <h2>Common questions</h2>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <Link href="/help" className="text-link">
          More help →
        </Link>
      </section>
    </InfoPage>
  );
}
