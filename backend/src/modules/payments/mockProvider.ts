import { randomUUID } from "node:crypto";
import type { PaymentProvider, ChargeRequest, ChargeResult } from "./provider";

// Local-dev stand-in: card/UPI/wallet "capture" instantly, COD stays pending
// until delivery. No network calls, no API keys required.
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (req.method === "cod") {
      return { status: "pending", providerRef: `cod_${randomUUID()}` };
    }
    return { status: "captured", providerRef: `mock_${randomUUID()}` };
  }
}
