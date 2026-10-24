"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const isExternal = (url) => /^https?:\/\//i.test(url);
const isImage = (value) => /^(https?:|\/)/.test(value || "");

function Card({ item }) {
  const inner = (
    <>
      <span className="tx-card-ic">
        {/* CMS images come from arbitrary hosts, so next/image remotePatterns can't cover them. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.icon ? (isImage(item.icon) ? <img src={item.icon} alt="" /> : item.icon) : "📄"}
      </span>
      <span className="tx-card-title">{item.title}</span>
      <span className="tx-card-go" aria-hidden>→</span>
    </>
  );
  if (isExternal(item.url)) {
    return <a href={item.url} className="tx-card" target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return <Link href={item.url} className="tx-card" target={item.target === "_blank" ? "_blank" : undefined}>{inner}</Link>;
}

/** Search box + the groups of service cards (search filters by name across every group). */
export default function ExploreSearch({ groups, title }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => (q
    ? groups.map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(q) || g.title.toLowerCase().includes(q)) })).filter((g) => g.items.length)
    : groups), [groups, q]);
  const count = shown.reduce((n, g) => n + g.items.length, 0);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      {total > 8 && (
        <div className="tx-search">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${total} ${title} services…`}
            aria-label={`Search ${title} services`}
          />
          {q && <small>{count} found</small>}
        </div>
      )}

      {shown.length === 0 && <p className="tx-empty">No service matches “{query}”.</p>}

      {shown.map((group) => (
        <div key={group.id} className="tx-group">
          {group.title && (
            <div className="tx-group-head">
              <h2>{group.title}</h2>
              {group.explore && group.items.length > 6 && !q && <Link href={group.explore} className="tx-group-all">View all {group.items.length} →</Link>}
            </div>
          )}
          <div className="tx-grid">
            {group.items.map((item) => <Card key={item.id} item={item} />)}
          </div>
        </div>
      ))}
    </>
  );
}
