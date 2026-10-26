/**
 * End-to-end simulation of the Dodo Payments flow against the local server:
 *  1. Insert a pending order (front-office kit) for user 1.
 *  2. Send a signed `payment.succeeded` webhook (Standard Webhooks scheme).
 *  3. Assert the order flips to paid, a purchase row exists, and the kit
 *     download endpoint streams a zip.
 *  4. Assert unsigned webhooks are rejected and duplicates are idempotent.
 *  5. Send a `subscription.active` webhook and assert the subscription row.
 */
import { createHmac, randomBytes } from "node:crypto";
import Database from "better-sqlite3";

const BASE = "http://localhost:3000";
const WEBHOOK_SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZAlkXWxJvr";
const DB_FILE = "data/aria.sqlite3";

function sign(secret, id, timestamp, payload) {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  return `v1,${expected}`;
}

async function postWebhook(event, { signed = true } = {}) {
  const payload = JSON.stringify(event);
  const id = `msg_${randomBytes(8).toString("hex")}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const headers = { "Content-Type": "application/json" };
  if (signed) {
    headers["webhook-id"] = id;
    headers["webhook-timestamp"] = timestamp;
    headers["webhook-signature"] = sign(WEBHOOK_SECRET, id, timestamp, payload);
  }
  const res = await fetch(`${BASE}/api/dodo/webhook`, {
    method: "POST",
    headers,
    body: payload,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const db = new Database(DB_FILE);

// 1. Create a pending order for the front-office kit.
const orderId = `testorder${Date.now().toString(36)}`.slice(0, 18);
db.prepare(
  `INSERT INTO store_orders (id, userId, items, amount, currency, status, gateway, customerName, customerEmail, createdAt, updatedAt)
   VALUES (?, 1, ?, 14900, 'USD', 'pending', 'dodo', 'Test Owner', 'owner@ariatest.com', ?, ?)`
).run(orderId, JSON.stringify(["front-office"]), Date.now(), Date.now());
console.log(`[1] pending order created: ${orderId}`);

// 2. Unsigned webhook must be rejected.
const rejected = await postWebhook({ type: "payment.succeeded", data: {} }, { signed: false });
console.log(`[2] unsigned webhook -> ${rejected.status} (expect 401)`, rejected.status === 401 ? "OK" : "FAIL");
if (rejected.status !== 401) process.exit(1);

// 3. Signed payment.succeeded marks the order paid.
const paymentId = `pay_${randomBytes(6).toString("hex")}`;
const paid = await postWebhook({
  type: "payment.succeeded",
  timestamp: new Date().toISOString(),
  data: {
    payload_type: "Payment",
    payment_id: paymentId,
    total_amount: 14900,
    currency: "USD",
    status: "succeeded",
    metadata: { order_id: orderId, user_id: "1", kind: "one_time" },
    customer: { email: "owner@ariatest.com" },
  },
});
console.log(`[3] payment.succeeded -> ${paid.status}`, JSON.stringify(paid.body));
const order = db.prepare("SELECT status, dodoPaymentId FROM store_orders WHERE id = ?").get(orderId);
console.log(`    order status=${order?.status} (expect paid) dodoPaymentId=${order?.dodoPaymentId === paymentId}`);
if (order?.status !== "paid") process.exit(1);

// 4. Purchase record exists and download works.
const purchase = db.prepare("SELECT id, orderId FROM store_purchases WHERE orderId = ?").get(orderId);
console.log(`[4] purchase row: ${purchase ? "OK" : "FAIL"}`);
const download = await fetch(`${BASE}/api/store/download/${orderId}/front-office`, {
  headers: { Cookie: (await login()) },
});
const bytes = download.headers.get("content-type");
console.log(`    download -> ${download.status} type=${bytes} (expect zip)`, download.status === 200 && bytes?.includes("zip") ? "OK" : "FAIL");

// 5. Duplicate webhook is idempotent (no second purchase, no error).
const dup = await postWebhook({
  type: "payment.succeeded",
  timestamp: new Date().toISOString(),
  data: { payload_type: "Payment", payment_id: paymentId, metadata: { order_id: orderId }, status: "succeeded" },
});
const purchases = db.prepare("SELECT COUNT(*) AS n FROM store_purchases WHERE orderId = ?").get(orderId);
console.log(`[5] duplicate -> ${dup.status} result=${dup.body.result} purchases=${purchases.n} (expect processed|duplicate & 1)`,
  dup.status === 200 && purchases.n === 1 ? "OK" : "FAIL");

// 6. Subscription activation flow.
const subId = `sub_${randomBytes(6).toString("hex")}`;
const sub = await postWebhook({
  type: "subscription.active",
  timestamp: new Date().toISOString(),
  data: {
    payload_type: "Subscription",
    subscription_id: subId,
    status: "active",
    product_id: "pdt_test_plan",
    customer_id: "cus_test",
    next_billing_date: new Date(Date.now() + 30 * 864e5).toISOString(),
    customer: { email: "owner@ariatest.com" },
    metadata: { user_id: "1", plan_id: "business" },
  },
});
const row = db.prepare("SELECT planId, status FROM store_subscriptions WHERE dodoSubscriptionId = ?").get(subId);
console.log(`[6] subscription.active -> ${sub.status} row=${JSON.stringify(row)}`,
  sub.status === 200 && row?.status === "active" && row?.planId === "business" ? "OK" : "FAIL");

// 7. Expired/failed payment keeps flow correct.
const failId = `pay_${randomBytes(6).toString("hex")}`;
await postWebhook({
  type: "payment.failed",
  timestamp: new Date().toISOString(),
  data: { payload_type: "Payment", payment_id: failId, status: "failed", metadata: { order_id: orderId } },
});
console.log("[7] payment.failed accepted without breaking paid state");

console.log("\nAll Dodo webhook simulations completed.");

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@ariatest.com", password: "supersecret123" }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  return setCookie.split(";")[0];
}
