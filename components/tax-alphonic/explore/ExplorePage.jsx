import Link from "next/link";
import ExploreSearch from "./ExploreSearch";
import { leafCount } from "@/service/menuExploreService";
import "./explore.css";

/*
 * Explore page of a header menu item (app/explore/[...path]): its links as cards, grouped by
 * column heading like the header dropdown. Cards open the same pages as the header links.
 */

const leaves = (node) => node.children.flatMap((child) => (child.children.length ? leaves(child) : child.url ? [child] : []));
const card = (item) => ({ id: item.id, title: item.title, url: item.url, target: item.target, icon: item.icon });

export default function ExplorePage({ node, parent, tree }) {
  const loose = node.children.filter((child) => !child.children.length && child.url).map(card);
  const groups = [
    ...(loose.length ? [{ id: "links", title: "", explore: "", items: loose }] : []),
    ...node.children.filter((child) => child.children.length).map((child) => ({
      id: child.id,
      title: child.title,
      explore: child.explore,
      icon: child.icon,
      items: leaves(child).map(card),
    })).filter((group) => group.items.length),
  ];
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  // Other sections at the same level, for moving across categories.
  const others = (parent ? parent.children : tree).filter((item) => item.children.length && item.id !== node.id);

  return (
    <main className="ta-explore">
      <section className="tx-hero">
        <div className="tx-wrap">
          {parent && <Link href={parent.explore} className="tx-back">← All {parent.title}</Link>}
          <span className="tx-eyebrow">{parent ? parent.title : "Explore"}</span>
          <h1>{node.icon && !/^(https?:|\/)/.test(node.icon) ? <span className="tx-h1-ic">{node.icon}</span> : null}{node.title}</h1>
          <p className="tx-sub">
            {total} {total === 1 ? "service" : "services"}
            {groups.filter((g) => g.title).length > 1 ? ` in ${groups.filter((g) => g.title).length} groups` : ""} — pick one to see details, pricing and documents.
          </p>
          {others.length > 0 && (
            <nav className="tx-chips" aria-label={parent ? `More in ${parent.title}` : "Other categories"}>
              {others.map((item) => (
                <Link key={item.id} href={item.explore} className="tx-chip">
                  {item.title} <span>{leafCount(item)}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <section className="tx-wrap tx-body">
        <ExploreSearch groups={groups} title={node.title} />
      </section>
    </main>
  );
}
