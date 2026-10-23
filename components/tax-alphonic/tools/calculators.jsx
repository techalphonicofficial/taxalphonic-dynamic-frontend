"use client";

import { useMemo, useState } from "react";
import { DEFAULT_SETTINGS } from "./toolDefaults";

/*
 * Free-tool calculators (uirefrence.html #/tool/<key>): markup and classes of the reference
 * (.calc, .calc-row, .calc-out, .calc-line, .calc-cards, .calc-verdict, .hsn-table in
 * tools-page.css). Everything is computed in the browser; nothing is sent or stored.
 * Settings come from the admin's ToolCalculator block; empty ones fall back to toolDefaults.js.
 * The compute* functions are pure so they can be checked without a browser.
 */

const num = (value, fallback = 0) => {
  const n = parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
};
const rupees = (n, digits = 0) => `₹${(Math.round(n * 10 ** digits) / 10 ** digits).toLocaleString("en-IN", { maximumFractionDigits: digits })}`;
const filled = (value) => (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim() !== "");

/** The block's settings over the defaults (an empty field or list keeps the default). */
export function settingsFor(calculator, settings = {}) {
  const base = DEFAULT_SETTINGS[calculator] || {};
  const out = { ...base };
  for (const [key, value] of Object.entries(settings || {})) if (filled(value)) out[key] = value;
  return out;
}

// ---- Income tax ---------------------------------------------------------------------------

/** Tax on `taxable` for slabs [{ upto, rate }] that start at `from` (income up to `from` is nil). */
export function slabTax(taxable, slabs, from = 0) {
  let tax = 0;
  let prev = from;
  for (const slab of slabs) {
    const cap = filled(slab.upto) ? num(slab.upto) : Infinity;
    if (cap <= prev) continue;
    if (taxable <= prev) break;
    tax += (Math.min(taxable, cap) - prev) * (num(slab.rate) / 100);
    prev = cap;
  }
  return tax;
}

/** Surcharge on `tax`, with marginal relief (tax + surcharge never grows faster than income above a threshold). */
function surchargeOf(taxable, tax, taxAt, table, cap = Infinity) {
  const rows = (table || [])
    .map((r) => ({ above: num(r.above), rate: Math.min(num(r.rate), cap) }))
    .filter((r) => r.above > 0)
    .sort((a, b) => a.above - b.above);
  const index = rows.findLastIndex((r) => taxable > r.above);
  if (index < 0) return 0;
  const bracket = rows[index];
  const prevRate = index > 0 ? rows[index - 1].rate : 0;
  let surcharge = tax * (bracket.rate / 100);
  const limit = taxAt(bracket.above) * (1 + prevRate / 100) + (taxable - bracket.above);
  if (tax + surcharge > limit) surcharge = Math.max(0, limit - tax);
  return surcharge;
}

/**
 * Both regimes for one person. income: gross yearly income; salaried: standard deduction
 * applies; age: 0 below 60, 1 = 60-80, 2 = 80+; deductions: old-regime deductions (80C, 80D…).
 */
export function computeIncomeTax({ income, salaried = true, age = 0, deductions = 0 }, settings) {
  const s = settingsFor("income-tax", settings);
  const cess = num(s.cess, 4) / 100;

  // New regime (section 115BAC)
  const newTaxable = Math.max(0, income - (salaried ? num(s.newStdDeduction) : 0));
  const newRebateLimit = num(s.newRebateLimit);
  const newBase = (taxable) => {
    const tax = slabTax(taxable, s.newSlabs);
    if (taxable <= newRebateLimit) return 0; // 87A rebate
    return Math.min(tax, taxable - newRebateLimit); // marginal relief just above the rebate limit
  };
  const newTax = newBase(newTaxable);
  const newSurcharge = surchargeOf(newTaxable, newTax, newBase, s.surcharge, num(s.newSurchargeCap, 25));

  // Old regime
  const exempt = num(age === 2 ? s.oldExemptSuperSenior : age === 1 ? s.oldExemptSenior : s.oldExemptBelow60);
  const oldTaxable = Math.max(0, income - (salaried ? num(s.oldStdDeduction) : 0) - Math.max(0, deductions));
  const oldBase = (taxable) => {
    const tax = slabTax(taxable, s.oldSlabs, exempt);
    return taxable <= num(s.oldRebateLimit) ? Math.max(0, tax - num(s.oldRebateMax)) : tax;
  };
  const oldTax = oldBase(oldTaxable);
  const oldSurcharge = surchargeOf(oldTaxable, oldTax, oldBase, s.surcharge);

  const total = (tax, surcharge) => (tax + surcharge) * (1 + cess);
  return {
    yearLabel: s.yearLabel,
    newRegime: { taxable: newTaxable, tax: newTax, surcharge: newSurcharge, cess: (newTax + newSurcharge) * cess, total: total(newTax, newSurcharge) },
    oldRegime: { taxable: oldTaxable, tax: oldTax, surcharge: oldSurcharge, cess: (oldTax + oldSurcharge) * cess, total: total(oldTax, oldSurcharge) },
  };
}

function IncomeTaxCalculator({ settings }) {
  const s = settingsFor("income-tax", settings);
  const [income, setIncome] = useState(s.defaultIncome);
  const [salaried, setSalaried] = useState("1");
  const [age, setAge] = useState("0");
  const [deductions, setDeductions] = useState(s.defaultDeductions);
  const r = useMemo(
    () => computeIncomeTax({ income: num(income), salaried: salaried === "1", age: num(age), deductions: num(deductions) }, settings),
    [income, salaried, age, deductions, settings]
  );
  const better = r.newRegime.total <= r.oldRegime.total ? "New" : "Old";
  const save = Math.abs(r.newRegime.total - r.oldRegime.total);
  const card = (label, x, note, win) => (
    <div className={`calc-card ${win ? "win" : ""}`}>
      <span>{label}</span>
      <b>{rupees(x.total)}</b>
      <small>{note}</small>
      <small className="calc-card-detail">Taxable {rupees(x.taxable)}{x.surcharge > 0 ? ` · surcharge ${rupees(x.surcharge)}` : ""} · cess {rupees(x.cess)}</small>
    </div>
  );
  return (
    <div className="calc">
      <div className="calc-row"><label>Annual income (₹)</label><input type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} /></div>
      <div className="calc-row">
        <label>Income type</label>
        <select value={salaried} onChange={(e) => setSalaried(e.target.value)}>
          <option value="1">Salary / pension (standard deduction)</option>
          <option value="0">Business / other income</option>
        </select>
      </div>
      <div className="calc-row">
        <label>Age group</label>
        <select value={age} onChange={(e) => setAge(e.target.value)}>
          <option value="0">Below 60</option>
          <option value="1">60 – 80 (Senior)</option>
          <option value="2">Above 80 (Super senior)</option>
        </select>
      </div>
      <div className="calc-row"><label>Deductions (old regime, e.g. 80C, 80D) (₹)</label><input type="number" min="0" value={deductions} onChange={(e) => setDeductions(e.target.value)} /></div>
      <div className="calc-out">
        <div className="calc-cards">
          {card("New Regime", r.newRegime, salaried === "1" ? `Std deduction ${rupees(num(s.newStdDeduction))}` : "No standard deduction", better === "New")}
          {card("Old Regime", r.oldRegime, "With your deductions", better === "Old")}
        </div>
        <div className="calc-verdict">
          {save < 1
            ? <>Both regimes cost the same here.</>
            : <><b>{better} regime</b> saves you about <b>{rupees(save)}</b> in tax. {better === "New" ? "The new regime is simpler and needs no investment proofs." : "The old regime wins because of your deductions."}</>}
          {r.yearLabel ? <> <small>({r.yearLabel})</small></> : null}
        </div>
      </div>
    </div>
  );
}

// ---- GST ----------------------------------------------------------------------------------

export function computeGst({ amount, rate, mode = "add", intra = true }) {
  const base = mode === "add" ? amount : amount / (1 + rate / 100);
  const gst = mode === "add" ? amount * (rate / 100) : amount - base;
  return { base, gst, total: base + gst, cgst: intra ? gst / 2 : 0, sgst: intra ? gst / 2 : 0, igst: intra ? 0 : gst };
}

function GstCalculator({ settings }) {
  const s = settingsFor("gst", settings);
  const rates = (s.rates || []).map((r) => String(r.rate ?? r).trim()).filter(Boolean);
  const [amount, setAmount] = useState(s.defaultAmount);
  const [rate, setRate] = useState(rates.includes(String(s.defaultRate)) ? String(s.defaultRate) : rates[0] || "18");
  const [mode, setMode] = useState("add");
  const [intra, setIntra] = useState("intra");
  const r = computeGst({ amount: num(amount), rate: num(rate), mode, intra: intra === "intra" });
  const half = num(rate) / 2;
  return (
    <div className="calc">
      <div className="calc-row"><label>Amount (₹)</label><input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <div className="calc-row">
        <label>GST rate</label>
        <select value={rate} onChange={(e) => setRate(e.target.value)}>{rates.map((x) => <option key={x} value={x}>{x}%</option>)}</select>
      </div>
      <div className="calc-row">
        <label>Type</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="add">Add GST (exclusive)</option>
          <option value="remove">Remove GST (inclusive)</option>
        </select>
      </div>
      <div className="calc-row">
        <label>Transaction</label>
        <select value={intra} onChange={(e) => setIntra(e.target.value)}>
          <option value="intra">Within state (CGST + SGST)</option>
          <option value="inter">Other state (IGST)</option>
        </select>
      </div>
      <div className="calc-out">
        <div className="calc-line"><span>Base amount</span><b>{rupees(r.base, 2)}</b></div>
        {intra === "intra" ? (
          <>
            <div className="calc-line"><span>CGST ({half}%)</span><b>{rupees(r.cgst, 2)}</b></div>
            <div className="calc-line"><span>SGST ({half}%)</span><b>{rupees(r.sgst, 2)}</b></div>
          </>
        ) : (
          <div className="calc-line"><span>IGST ({num(rate)}%)</span><b>{rupees(r.igst, 2)}</b></div>
        )}
        <div className="calc-line"><span>Total GST</span><b>{rupees(r.gst, 2)}</b></div>
        <div className="calc-line total"><span>Total amount</span><b>{rupees(r.total, 2)}</b></div>
      </div>
    </div>
  );
}

// ---- HSN ----------------------------------------------------------------------------------

export function searchHsn(items, query) {
  const q = String(query || "").trim().toLowerCase();
  const list = (items || []).filter((h) => h && (h.code || h.name));
  if (!q) return list;
  return list.filter((h) => String(h.name || "").toLowerCase().includes(q) || String(h.code || "").toLowerCase().includes(q));
}

function HsnFinder({ settings }) {
  const s = settingsFor("hsn", settings);
  const [query, setQuery] = useState("");
  const list = searchHsn(s.items, query);
  return (
    <div className="calc">
      <div className="calc-row"><label>Search product or HSN code</label><input type="text" placeholder="e.g. mobile, rice, 8517" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <div className="calc-out">
        {list.length ? (
          <>
            <div className="calc-table-wrap">
              <table className="hsn-table">
                <thead><tr><th>HSN Code</th><th>Product / Service</th><th>GST Rate</th></tr></thead>
                <tbody>{list.map((h, i) => <tr key={`${h.code}-${i}`}><td><b>{h.code}</b></td><td>{h.name}</td><td>{h.rate}</td></tr>)}</tbody>
              </table>
            </div>
            {s.note ? <p className="tool-note" style={{ marginTop: 12 }}>{s.note}</p> : null}
          </>
        ) : (
          <p className="calc-empty">No match found. Try another word, or ask our experts for the exact HSN code.</p>
        )}
      </div>
    </div>
  );
}

// ---- HRA ----------------------------------------------------------------------------------

export function computeHra({ basic, received, rent, metro }, settings) {
  const s = settingsFor("hra", settings);
  const share = basic * (num(metro ? s.metroPercent : s.nonMetroPercent) / 100);
  const rentOver = Math.max(0, rent - basic * (num(s.rentOverBasicPercent) / 100));
  const exempt = Math.max(0, Math.min(received, share, rentOver));
  return { received, share, rentOver, exempt, taxable: Math.max(0, received - exempt) };
}

function HraCalculator({ settings }) {
  const s = settingsFor("hra", settings);
  const [basic, setBasic] = useState(s.defaultBasic);
  const [received, setReceived] = useState(s.defaultHra);
  const [rent, setRent] = useState(s.defaultRent);
  const [metro, setMetro] = useState("1");
  const r = computeHra({ basic: num(basic), received: num(received), rent: num(rent), metro: metro === "1" }, settings);
  return (
    <div className="calc">
      <div className="calc-row"><label>Basic salary + DA (yearly ₹)</label><input type="number" min="0" value={basic} onChange={(e) => setBasic(e.target.value)} /></div>
      <div className="calc-row"><label>HRA received (yearly ₹)</label><input type="number" min="0" value={received} onChange={(e) => setReceived(e.target.value)} /></div>
      <div className="calc-row"><label>Rent paid (yearly ₹)</label><input type="number" min="0" value={rent} onChange={(e) => setRent(e.target.value)} /></div>
      <div className="calc-row">
        <label>City</label>
        <select value={metro} onChange={(e) => setMetro(e.target.value)}>
          <option value="1">{s.metroLabel || "Metro"}</option>
          <option value="0">Non-metro</option>
        </select>
      </div>
      <div className="calc-out">
        <div className="calc-line"><span>HRA received</span><b>{rupees(r.received)}</b></div>
        <div className="calc-line"><span>{num(metro === "1" ? s.metroPercent : s.nonMetroPercent)}% of basic</span><b>{rupees(r.share)}</b></div>
        <div className="calc-line"><span>Rent − {num(s.rentOverBasicPercent)}% of basic</span><b>{rupees(r.rentOver)}</b></div>
        <div className="calc-line total"><span>HRA exempt (lowest)</span><b>{rupees(r.exempt)}</b></div>
        <div className="calc-verdict"><b>{rupees(r.exempt)}</b> of your HRA is tax-free. <b>{rupees(r.taxable)}</b> is taxable. <small>(HRA exemption applies under the old regime.)</small></div>
      </div>
    </div>
  );
}

// ---- SIP ----------------------------------------------------------------------------------

/** Future value of a monthly SIP (instalment at the start of each month). */
export function computeSip({ monthly, annualRate, years }) {
  const i = annualRate / 100 / 12;
  const n = Math.max(0, Math.round(years * 12));
  const futureValue = i > 0 ? monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : monthly * n;
  const invested = monthly * n;
  return { invested, gain: futureValue - invested, futureValue };
}

function SipCalculator({ settings }) {
  const s = settingsFor("sip", settings);
  const [monthly, setMonthly] = useState(s.defaultAmount);
  const [rate, setRate] = useState(s.defaultRate);
  const [years, setYears] = useState(s.defaultYears);
  const r = computeSip({ monthly: num(monthly), annualRate: num(rate), years: num(years) });
  return (
    <div className="calc">
      <div className="calc-row"><label>Monthly investment (₹)</label><input type="number" min="0" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
      <div className="calc-row"><label>Expected return (% per year)</label><input type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
      <div className="calc-row"><label>Time period (years)</label><input type="number" min="0" value={years} onChange={(e) => setYears(e.target.value)} /></div>
      <div className="calc-out">
        <div className="calc-line"><span>Total invested</span><b>{rupees(r.invested)}</b></div>
        <div className="calc-line"><span>Estimated returns</span><b>{rupees(r.gain)}</b></div>
        <div className="calc-line total"><span>Future value</span><b>{rupees(r.futureValue)}</b></div>
        <div className="calc-verdict">Investing {rupees(num(monthly))}/month for {num(years)} years could grow to about <b>{rupees(r.futureValue)}</b>.</div>
      </div>
    </div>
  );
}

// ---- GSTIN --------------------------------------------------------------------------------

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PAN_TYPES = { P: "Individual", C: "Company", H: "Hindu Undivided Family (HUF)", F: "Firm / LLP", A: "Association of Persons", T: "Trust", B: "Body of Individuals", L: "Local Authority", J: "Artificial Juridical Person", G: "Government" };

/** GSTIN check digit (15th character) from the first 14 characters. */
export function gstinCheckDigit(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GSTIN_CHARS.indexOf(first14[i]) * (i % 2 ? 2 : 1);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36];
}

export function checkGstin(value, states) {
  const v = String(value || "").toUpperCase().replace(/\s+/g, "");
  if (v.length < 15) return { complete: false };
  const format = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v);
  const state = (states || []).find((s) => s.code === v.slice(0, 2));
  const expected = format ? gstinCheckDigit(v.slice(0, 14)) : null;
  return {
    complete: true,
    gstin: v,
    format,
    checksum: format && expected === v[14],
    expected,
    stateCode: v.slice(0, 2),
    state: state?.name || "",
    pan: v.slice(2, 12),
    entityType: PAN_TYPES[v[5]] || "",
    entityNumber: v[12],
  };
}

function GstinChecker({ settings }) {
  const s = settingsFor("gstin", settings);
  const [value, setValue] = useState("");
  const r = checkGstin(value, s.states);
  return (
    <div className="calc">
      <div className="calc-row">
        <label>Enter GSTIN (15 characters)</label>
        <input type="text" maxLength={15} placeholder="e.g. 27AAPFU0939F1ZV" value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} />
      </div>
      <div className="calc-out">
        {!r.complete ? (
          <p className="calc-empty">Enter all 15 characters of the GSTIN to check it.</p>
        ) : !r.format ? (
          <div className="calc-verdict bad">⚠️ This is not a valid GSTIN format. A GSTIN has 15 characters: 2-digit state code + 10-character PAN + entity number + &apos;Z&apos; + check digit.</div>
        ) : (
          <>
            {r.checksum
              ? <div className="calc-verdict good">✅ Valid GSTIN: format and check digit are correct.</div>
              : <div className="calc-verdict bad">⚠️ The check digit is wrong (expected <b>{r.expected}</b>), so this GSTIN is mistyped or not genuine.</div>}
            <div className="calc-line"><span>State code ({r.stateCode})</span><b>{r.state || "Unknown state code"}</b></div>
            <div className="calc-line"><span>PAN of business</span><b>{r.pan}</b></div>
            {r.entityType && <div className="calc-line"><span>PAN holder type</span><b>{r.entityType}</b></div>}
            <div className="calc-line"><span>Registration number (for this PAN in the state)</span><b>{r.entityNumber}</b></div>
            <p className="tool-note" style={{ marginTop: 12 }}>This checks the number itself. Whether the GSTIN is active, and the business name, are only on the official GST portal — our team can verify it for you.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ---- EMI ----------------------------------------------------------------------------------

/** Monthly EMI, totals and a year-by-year schedule. */
export function computeEmi({ principal, annualRate, years }) {
  const n = Math.max(0, Math.round(years * 12));
  const r = annualRate / 100 / 12;
  if (!principal || !n) return { emi: 0, interest: 0, total: 0, schedule: [] };
  const emi = r > 0 ? (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : principal / n;
  const schedule = [];
  let balance = principal;
  for (let month = 1; month <= n; month++) {
    const interest = balance * r;
    const paid = Math.min(balance, emi - interest);
    balance = Math.max(0, balance - paid);
    const year = Math.ceil(month / 12);
    if (!schedule[year - 1]) schedule[year - 1] = { year, principal: 0, interest: 0, balance: 0 };
    schedule[year - 1].principal += paid;
    schedule[year - 1].interest += interest;
    schedule[year - 1].balance = balance;
  }
  return { emi, interest: emi * n - principal, total: emi * n, schedule };
}

function EmiCalculator({ settings }) {
  const s = settingsFor("emi", settings);
  const [amount, setAmount] = useState(s.defaultAmount);
  const [rate, setRate] = useState(s.defaultRate);
  const [years, setYears] = useState(s.defaultYears);
  const yearsValue = Math.min(num(years), num(s.maxYears, 30) || 30);
  const r = computeEmi({ principal: num(amount), annualRate: num(rate), years: yearsValue });
  const [showTable, setShowTable] = useState(false);
  return (
    <div className="calc">
      <div className="calc-row"><label>Loan amount (₹)</label><input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <div className="calc-row"><label>Interest rate (% per year)</label><input type="number" min="0" step="0.05" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
      <div className="calc-row"><label>Tenure (years, up to {num(s.maxYears, 30)})</label><input type="number" min="0" max={num(s.maxYears, 30)} value={years} onChange={(e) => setYears(e.target.value)} /></div>
      <div className="calc-out">
        <div className="calc-line total"><span>Monthly EMI</span><b>{rupees(r.emi)}</b></div>
        <div className="calc-line"><span>Total interest</span><b>{rupees(r.interest)}</b></div>
        <div className="calc-line"><span>Total payment</span><b>{rupees(r.total)}</b></div>
        {r.schedule.length > 0 && (
          <>
            <button type="button" className="btn-ghost calc-toggle" onClick={() => setShowTable((v) => !v)}>
              {showTable ? "Hide" : "Show"} year-by-year schedule
            </button>
            {showTable && (
              <div className="calc-table-wrap">
                <table className="hsn-table">
                  <thead><tr><th>Year</th><th>Principal paid</th><th>Interest paid</th><th>Balance</th></tr></thead>
                  <tbody>{r.schedule.map((y) => <tr key={y.year}><td><b>{y.year}</b></td><td>{rupees(y.principal)}</td><td>{rupees(y.interest)}</td><td>{rupees(y.balance)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const COMPONENTS = {
  "income-tax": IncomeTaxCalculator,
  gst: GstCalculator,
  hsn: HsnFinder,
  hra: HraCalculator,
  sip: SipCalculator,
  gstin: GstinChecker,
  emi: EmiCalculator,
};

/** The calculator chosen in the ToolCalculator block, with its settings. */
export default function Calculator({ calculator, settings }) {
  const Component = COMPONENTS[calculator];
  if (!Component) return <p className="calc-empty">Choose a calculator for this tool in the admin.</p>;
  // Remount when the settings change (admin preview), so defaults follow the new values.
  return <Component key={JSON.stringify(settings || {})} settings={settings || {}} />;
}
