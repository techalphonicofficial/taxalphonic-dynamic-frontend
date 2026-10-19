import Link from "next/link";
import { RichContent, splitHeading } from "./ApiServicePage";
import "../service-page.css";

// Built from the same reference blocks as the service page (.ta-svc scope in service-page.css).

const statIcons = ["🏆", "🚀", "👨‍💼", "🤝"];

// CMS core values carry Font Awesome class names, which this site doesn't load.
const valueIcons = [
  [/medal|award|trophy/, "🏅"],
  [/handshake/, "🤝"],
  [/code/, "🔀"],
  [/users|people/, "👥"],
  [/lightbulb/, "💡"],
  [/chart/, "📈"],
  [/smile/, "😊"],
  [/door/, "🚪"],
  [/book/, "📖"],
];

function valueIcon(className = "") {
  return valueIcons.find(([pattern]) => pattern.test(className))?.[1] || "✅";
}

function Hero({ about }) {
  const [lead, highlight] = splitHeading(about.heroTitle);

  return (
    <div className="svc-hero">
      <div className="svc-hero-grid">
        <div>
          <span className="eyebrow">🏢 About us</span>
          <h1>
            {lead}{lead && highlight ? " " : ""}
            {highlight && <em>{highlight}</em>}
          </h1>
          {about.heroSubtitle && <p className="lede">{about.heroSubtitle}</p>}
          <div className="hh-cta">
            <Link href="/talk-to-expert" className="btn-primary">Talk to an expert</Link>
            <a href="#overview" className="btn-ghost">Our story</a>
          </div>
        </div>
        <div className="mt-hero-visual">
          <div className="svc-hero-media">
            <div className="svc-hero-img">
              {about.aboutImage ? (
                // CMS images come from arbitrary hosts, so next/image remotePatterns can't cover them.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={about.aboutImage} alt={about.heroTitle} />
              ) : (
                <><span aria-hidden>🏢</span>{about.heroTitle}</>
              )}
            </div>
            <i aria-hidden className="svc-hero-chip">✅</i>
            <i aria-hidden className="svc-hero-chip">📄</i>
            <i aria-hidden className="svc-hero-chip">⚡</i>
            <i aria-hidden className="svc-hero-chip">🔒</i>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsStrip({ stats }) {
  if (!stats.length) return null;

  return (
    <div className="cred-strip">
      {stats.map((stat, index) => (
        <div key={stat.label} className="cred-item">
          <span className="cred-ic">{statIcons[index % statIcons.length]}</span>
          <div><b>{stat.value} {stat.label}</b><span>{stat.description}</span></div>
        </div>
      ))}
    </div>
  );
}

function MissionVision({ about }) {
  const items = [
    ["🎯", "Our mission", about.missionText],
    ["🔭", "Our vision", about.visionText],
  ].filter(([, , text]) => text);
  if (!items.length) return null;

  return (
    <div className="blk" id="mission">
      <div className="kicker">What drives us</div>
      <h2>Mission &amp; vision</h2>
      <div className="wc-grid">
        {items.map(([icon, title, text]) => (
          <div key={title} className="wc-item">
            <span className="wc-ic">{icon}</span>
            <div><b>{title}</b><p>{text}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoreValues({ values }) {
  if (!values.length) return null;

  return (
    <div className="blk" id="values">
      <div className="kicker">What we stand for</div>
      <h2>Our core values</h2>
      <div className="bgrid">
        {values.map((value) => (
          <div key={value.title} className="bcard">
            <div className="ic">{valueIcon(value.icon)}</div>
            <h4>{value.title}</h4>
            {value.desc && <p>{value.desc}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function History({ timeline }) {
  if (!timeline.length) return null;

  return (
    <div className="blk" id="history">
      <div className="kicker">Our journey</div>
      <h2>How we got here</h2>
      <div className="proc2">
        {timeline.map((entry, index) => {
          const points = Array.isArray(entry.points) ? entry.points.filter(Boolean) : [];

          return (
            <div key={entry.year} className="proc2-step">
              <div className="proc2-num-col">
                <div className="proc2-num">{index + 1}</div>
                {index < timeline.length - 1 && <div className="proc2-line" />}
              </div>
              <div className="proc2-body">
                <div className="proc2-top"><b>{entry.year}</b></div>
                {points.map((point) => <p key={point}>{point}</p>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="side">
      <div className="lead-card">
        <h3>Free consultation</h3>
        <p className="csub">Talk to a CA/CS expert — no cost, no obligation.</p>
        <Link href="/talk-to-expert" className="btn-primary">Request callback</Link>
        <p className="lead-note">🔒 Your details are safe. We never spam.</p>
      </div>

      <div className="side-why">
        <b>✅ Why Tax Alphonic</b>
        <ul>
          <li><span>👨‍💼</span> Real CA/CS experts</li>
          <li><span>💸</span> Transparent, upfront pricing</li>
          <li><span>⚡</span> 100% online — no office visits</li>
          <li><span>🇮🇳</span> Available across all India</li>
        </ul>
      </div>

      <div className="side-trust">
        <b>🔒 Safe &amp; trusted</b>
        <div className="side-trust-grid">
          <div className="side-trust-item"><span>🛡️</span>Data encrypted</div>
          <div className="side-trust-item"><span>👨‍💼</span>CA/CS verified</div>
          <div className="side-trust-item"><span>💯</span>No hidden fees</div>
          <div className="side-trust-item"><span>🔁</span>Free revisions</div>
        </div>
      </div>
    </aside>
  );
}

export default function AboutPage({ about }) {
  return (
    <div className="ta-svc">
      <div className="view">
        <div className="wrap">
          <div className="crumb"><Link href="/">Home</Link> / <span>About</span></div>
        </div>

        <div className="svc">
          <div className="wrap">
            <Hero about={about} />
            <StatsStrip stats={about.stats} />

            <div className="svc-body">
              <div>
                {about.overviewDescription && (
                  <div className="blk" id="overview">
                    <div className="kicker">Who we are</div>
                    <h2>{about.overviewHeading || about.heroTitle}</h2>
                    <RichContent html={about.overviewDescription} />
                  </div>
                )}
                <MissionVision about={about} />
                <CoreValues values={about.coreValues} />
                <History timeline={about.historyTimeline} />
              </div>
              <Sidebar />
            </div>

            <div className="svc-full">
              <div className="ctastrip" style={{ marginTop: 30 }}>
                <h2>Let&apos;s build something together</h2>
                <p>Talk to an expert for free — no cost, no obligation.</p>
                <Link href="/talk-to-expert" className="btn-primary">🎧 Talk to an expert</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
