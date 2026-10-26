import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Search, SlidersHorizontal, ArrowUpRight, X } from "lucide-react";
import { automations, categories, industries } from "@shared/catalog";
import {
  PageShell,
  Breadcrumbs,
  AutomationCard,
  InquiryCTA,
} from "@/components/Storefront";
export default function Catalog({
  industry: suppliedIndustry,
}: {
  industry?: string;
}) {
  const params = useParams<{ id?: string }>();
  const industry = suppliedIndustry || params.id || "all";
  const industryData = industries.find(x => x.id === industry);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All automations");
  const [sort, setSort] = useState("recommended");
  const results = useMemo(() => {
    const list = automations.filter(
      x =>
        (industry === "all" ||
          x.industry === industry ||
          (industry === "healthcare" && x.industry === "dental")) &&
        (category === "All automations" || x.category === category) &&
        `${x.name} ${x.description} ${x.category}`
          .toLowerCase()
          .includes(query.toLowerCase())
    );
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [query, category, sort, industry]);
  if (!industryData)
    return (
      <PageShell>
        <div className="container empty-state">
          <h1>Industry not found</h1>
          <Link href="/industries" className="button dark">
            Explore industries
          </Link>
        </div>
      </PageShell>
    );
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs
          items={
            industry === "all"
              ? [{ label: "Automations" }]
              : [
                  { label: "Industries", href: "/industries" },
                  { label: industryData.name },
                ]
          }
        />
        <div className="page-heading">
          <span className="eyebrow">
            <i />{" "}
            {industry === "all"
              ? "THE ARIA AUTOMATION LIBRARY"
              : `AUTOMATION FOR ${industryData.name.toUpperCase()}`}
          </span>
          <h1>
            {industry === "all" ? (
              <>
                Find your next
                <br />
                <em>AI teammate.</em>
              </>
            ) : (
              <>
                {industryData.name}.<br />
                <em>A little less manual.</em>
              </>
            )}
          </h1>
          <p>
            {industryData.description} Choose a configurable workflow kit or ask
            our team to handle implementation.
          </p>
        </div>
        <div className="catalog-controls">
          <div className="search-input">
            <Search size={19} />
            <input
              aria-label="Search automations"
              placeholder="Search workflows, tasks, or goals..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={17} />
              </button>
            )}
          </div>
          <label className="industry-select">
            <SlidersHorizontal size={17} />
            <select
              aria-label="Sort automations"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>
        <div
          className="category-tabs"
          role="group"
          aria-label="Filter by use case"
        >
          {categories.map(c => (
            <button
              className={category === c ? "selected" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="results-label">
          <span>
            {results.length} automation{results.length !== 1 ? "s" : ""}
          </span>
          <span>One-time workflow kits · draft USD test prices</span>
        </div>
        {results.length ? (
          <div className="automation-grid catalog-grid">
            {results.map(x => (
              <AutomationCard item={x} key={x.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={28} />
            <h2>No matching workflows</h2>
            <p>
              Try a different search or ask us about your business use case.
            </p>
            <button
              className="button dark"
              onClick={() => {
                setQuery("");
                setCategory("All automations");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
        <div className="catalog-disclosure">
          <strong>
            Built to be configured—not a live connection in a box.
          </strong>
          <p>
            Each kit contains importable n8n workflow starters, prompts,
            synthetic examples, and setup guidance. You’ll need your own
            approved tools and credentials. Third-party platform, AI, messaging,
            and implementation costs are separate. Checkout is test-only until
            final prices and live payments are confirmed.
          </p>
        </div>
        <div className="bottom-cta">
          <InquiryCTA />
        </div>
      </div>
    </PageShell>
  );
}
export function Industries() {
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Industries" }]} />
        <div className="page-heading">
          <span className="eyebrow">
            <i /> BUILT AROUND YOUR WORLD
          </span>
          <h1>
            Different businesses.
            <br />
            <em>Shared busywork.</em>
          </h1>
          <p>
            Start with your industry, then choose the part of the day your team
            shouldn’t have to repeat.
          </p>
        </div>
        <div className="industry-page-grid">
          {industries
            .filter(x => x.id !== "all")
            .map((x, i) => (
              <Link key={x.id} href={`/industries/${x.id}`}>
                <span className="path-number">0{i + 1} / INDUSTRY</span>
                <h2>{x.name}</h2>
                <p>{x.description}</p>
                <span className="text-link">
                  Find your workflows <ArrowUpRight size={20} />
                </span>
              </Link>
            ))}
        </div>
        <div className="bottom-cta">
          <InquiryCTA />
        </div>
      </div>
    </PageShell>
  );
}
