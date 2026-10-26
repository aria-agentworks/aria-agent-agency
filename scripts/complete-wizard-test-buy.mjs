/**
 * Completes the pending "installation + subscription" test buy created through
 * the /get-started wizard: sends signed Dodo webhooks so the pending order
 * flips to paid and the pending subscription becomes active.
 *
 * Usage: node scripts/complete-wizard-test-buy.mjs <orderId> <subscriptionRowId> <userId> [planId]
 */
import { createHmac, randomBytes } from "node:crypto";
import Database from "better-sqlite3";

const BASE = "http://localhost:3000";
const WEBHOOK_SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZAlkXWxJvr";
const DB_FILE = "data/aria.sqlite3";

const [orderId, subscriptionRowId, userId, planId = "business"] =
  process.argv.slice(2);
if (!orderId || !subscriptionRowId || !userId) {
  console.error(
    "Usage: node scripts/complete-wizard-test-buy.mjs <orderId> <subscriptionRowId> <userId> [planId]"
  );
  process.exit(1);
}

function sign(secret, id, timestamp, payload) {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  return `v1,${expected}`;
}

async function postWebhook(event) {
  const payload = JSON.stringify(event);
  const id = `msg_${randomBytes(8).toString("hex")}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const res = await fetch(`${BASE}/api/dodo/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": sign(WEBHOOK_SECRET, id, timestamp, payload),
    },
    body: payload,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const db = new Database(DB_FILE);

const order = db.prepare("SELECT id, amount, status FROM store_orders WHERE id = ?").get(orderId);
if (!order) {
  console.error(`Order ${orderId} not found`);
  process.exit(1);
}

// 1. payment.succeeded covers installation + first month in one payment.
const paymentId = `pay_${randomBytes(6).toString("hex")}`;
const paid = await postWebhook({
  type: "payment.succeeded",
  timestamp: new Date().toISOString(),
  data: {
    payload_type: "Payment",
    payment_id: paymentId,
    total_amount: order.amount,
    currency: "USD",
    status: "succeeded",
    metadata: {
      order_id: orderId,
      user_id: String(userId),
      kind: "recurring",
      catalog_id: planId,
    },
    customer: { email: "buyer.oct22@example.test" },
  },
});
const afterPay = db
  .prepare("SELECT status, dodoPaymentId FROM store_orders WHERE id = ?")
  .get(orderId);
console.log(
  `[1] payment.succeeded -> ${paid.status}; order status=${afterPay.status} (expect paid)`,
  afterPay.status === "paid" && afterPay.dodoPaymentId === paymentId ? "OK" : "FAIL"
);

// 2. subscription.active activates the plan.
const subDodoId = `sub_${randomBytes(6).toString("hex")}`;
const active = await postWebhook({
  type: "subscription.active",
  timestamp: new Date().toISOString(),
  data: {
    payload_type: "Subscription",
    subscription_id: subDodoId,
    status: "active",
    product_id: `pdt_${planId}`,
    customer_id: "cus_test_buyer",
    next_billing_date: new Date(Date.now() + 30 * 864e5).toISOString(),
    customer: { email: "buyer.oct22@example.test" },
    metadata: { user_id: String(userId), plan_id: planId },
  },
});
const sub = db
  .prepare(
    "SELECT planId, status, nextBillingDate FROM store_subscriptions WHERE id = ?"
  )
  .get(subscriptionRowId);
console.log(
  `[2] subscription.active -> ${active.status}; row=${JSON.stringify(sub)}`,
  sub?.status === "active" ? "OK" : "FAIL"
);

// 3. Onboarding request should still be linked and readable for the portal.
const onboarding = db
  .prepare(
    "SELECT categoryId, delivery, planId, status FROM onboarding_requests WHERE userId = ? ORDER BY createdAt DESC LIMIT 1"
  )
  .get(Number(userId));
console.log(`[3] onboarding row: ${JSON.stringify(onboarding)}`);

console.log(
  onboarding?.planId === planId && afterPay.status === "paid" && sub?.status === "active"
    ? "\nTest buy COMPLETE: order paid + subscription active + onboarding linked."
    : "\nTest buy INCOMPLETE — check the rows above."
);
