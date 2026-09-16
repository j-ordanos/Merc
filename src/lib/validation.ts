import * as yup from 'yup';
export const deliverySchema = yup.object({
  name: yup.string().trim().min(2).max(100).required('Enter your full name'),
  email: yup.string().trim().email('Enter a valid email').max(254).required('Enter your email'),
  phone: yup.string().oneOf(['0900000000'], 'Use the sandbox test number 0900000000').required(),
  city: yup.string().trim().min(2).max(100).required('Enter your city'),
  address: yup.string().trim().min(5, 'Enter a complete delivery address').max(400).required(),
  instructions: yup.string().trim().max(500).default(''),
});
export const checkoutSchema = yup
  .object({
    items: yup
      .array(
        yup
          .object({
            productId: yup.string().uuid().required(),
            quantity: yup.number().integer().min(1).max(10).required(),
          })
          .noUnknown(),
      )
      .min(1)
      .max(50)
      .required(),
    delivery: deliverySchema.required(),
    idempotencyKey: yup.string().uuid().required(),
  })
  .noUnknown();
export type CheckoutInput = yup.InferType<typeof checkoutSchema>;
export const loginSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Enter your email'),
  password: yup.string().required('Enter your password'),
});
export const signupSchema = loginSchema.shape({
  password: yup.string().min(10, 'Use at least 10 characters').max(128).required(),
});
export const emailSchema = yup.object({ email: yup.string().email().required() });
export const passwordSchema = yup.object({
  password: yup.string().min(10, 'Use at least 10 characters').max(128).required(),
});
export function safeNext(value?: string | null) {
  return value && /^\/(?!\/)/.test(value) && !value.includes('\\') ? value : '/orders';
}
