import fs from "node:fs";
import path from "node:path";
import { automations } from "../shared/catalog";
import { getWorkflowContract } from "../shared/workflowContracts";
for (const item of automations) {
  const root = path.resolve(process.cwd(), "automation-kits", item.bundle);
  const contract = getWorkflowContract(item);
  for (const key of ["trigger", "data", "action", "kpi"] as const) {
    if (!contract[key])
      throw new Error(`Workflow contract for ${item.id} is missing "${key}"`);
  }
  fs.writeFileSync(
    path.join(root, "operational-contract.json"),
    JSON.stringify(contract, null, 2) + "\n"
  );
  const file = path.join(root, "README.md");
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("## Operational contract and measurement"))
    fs.appendFileSync(
      file,
      "\n## Operational contract and measurement\n\nSee `operational-contract.json` for the trigger, source data, AI/rules boundary, action, human fallback, audit logging, duplicate/error handling, and KPI definitions. These are measurement definitions, not guaranteed results. Starter audit output must be connected to the client’s approved durable logs and idempotency store before production.\n"
    );
}
console.log(
  `Operational contracts included in all ${automations.length} kits.`
);
