// Every checkout flow talks to this interface only. Swapping the mock
// provider for Razorpay/Stripe test-mode later means implementing this
// interface and changing one line in provider.registry.ts — no changes to
// checkout/order code.
export type PaymentMethod = "card" | "upi" | "wallet" | "cod";

export type ChargeRequest = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
};

export type ChargeResult = {
  status: "captured" | "pending" | "failed";
  providerRef: string;
};

export interface PaymentProvider {
  readonly name: string;
  charge(req: ChargeRequest): Promise<ChargeResult>;
}
