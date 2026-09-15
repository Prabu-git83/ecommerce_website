import { MockPaymentProvider } from "./mockProvider";
import type { PaymentProvider } from "./provider";

// Phase 1 runs on the mock provider only (payments integration deferred).
// Add real providers here later, e.g.:
//   export const paymentProvider: PaymentProvider =
//     env.PAYMENT_PROVIDER === "razorpay" ? new RazorpayProvider() : new MockPaymentProvider();
export const paymentProvider: PaymentProvider = new MockPaymentProvider();
