import DodoPayments from "dodopayments";

const key = process.env.DODO_PAYMENTS_API_KEY?.trim();
if (!key) {
  console.error("DODO_PAYMENTS_API_KEY is not configured.");
  process.exit(1);
}

const mode =
  process.env.DODO_PAYMENTS_MODE === "live_mode" ||
  process.env.DODO_PAYMENTS_MODE === "live"
    ? "live_mode"
    : "test_mode";

try {
  const client = new DodoPayments({ bearerToken: key, environment: mode });
  const products = [];
  for await (const product of client.products.list({ archived: false })) {
    products.push({
      id: product.product_id,
      name: product.name ?? null,
      businessId: product.business_id,
      recurring: product.is_recurring,
      price: product.price ?? null,
      currency: product.currency ?? null,
    });
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        environment: mode,
        productCount: products.length,
        businessIds: [...new Set(products.map(product => product.businessId))],
        products,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Unable to connect to Dodo Payments."
  );
  process.exit(1);
}
