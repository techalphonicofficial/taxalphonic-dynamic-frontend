// Default settings of the free-tool calculators (components/tax-alphonic/tools/calculators.jsx).
// The admin's ToolCalculator block stores its own copy of these (it starts from this file through
// the in-admin preview copy) and every value can be changed there, e.g. after a Budget or a GST
// rate change. A calculator falls back to these values for any setting left empty.
// Rates and limits: Income Tax FY 2025-26 (AY 2026-27); GST after the Sept 2025 rate rationalisation.

export const CALCULATORS = [
  { value: "income-tax", label: "Income Tax Calculator (old vs new regime)" },
  { value: "gst", label: "GST Calculator" },
  { value: "hsn", label: "HSN Code Finder" },
  { value: "hra", label: "HRA Exemption Calculator" },
  { value: "sip", label: "SIP Calculator" },
  { value: "gstin", label: "GSTIN Checker" },
  { value: "emi", label: "Loan EMI Calculator" },
];

// Slab lists: { upto, rate } in ascending order; an empty "upto" means "and above".
export const DEFAULT_SETTINGS = {
  "income-tax": {
    yearLabel: "FY 2025-26 (AY 2026-27)",
    defaultIncome: "1500000",
    defaultDeductions: "150000",
    cess: "4",
    newStdDeduction: "75000",
    newRebateLimit: "1200000",
    newSlabs: [
      { upto: "400000", rate: "0" },
      { upto: "800000", rate: "5" },
      { upto: "1200000", rate: "10" },
      { upto: "1600000", rate: "15" },
      { upto: "2000000", rate: "20" },
      { upto: "2400000", rate: "25" },
      { upto: "", rate: "30" },
    ],
    oldStdDeduction: "50000",
    oldRebateLimit: "500000",
    oldRebateMax: "12500",
    oldExemptBelow60: "250000",
    oldExemptSenior: "300000",
    oldExemptSuperSenior: "500000",
    oldSlabs: [
      { upto: "500000", rate: "5" },
      { upto: "1000000", rate: "20" },
      { upto: "", rate: "30" },
    ],
    // Surcharge on income tax above these incomes (new regime capped at newSurchargeCap).
    surcharge: [
      { above: "5000000", rate: "10" },
      { above: "10000000", rate: "15" },
      { above: "20000000", rate: "25" },
      { above: "50000000", rate: "37" },
    ],
    newSurchargeCap: "25",
  },
  gst: {
    defaultAmount: "10000",
    defaultRate: "18",
    rates: [{ rate: "5" }, { rate: "18" }, { rate: "40" }, { rate: "3" }, { rate: "0.25" }, { rate: "0" }],
  },
  hsn: {
    // Illustrative list from the reference: check the rates in the admin before publishing.
    items: [
      { code: "1006", name: "Rice", rate: "0% / 5%" },
      { code: "0401", name: "Milk and cream", rate: "0% / 5%" },
      { code: "1701", name: "Sugar", rate: "5%" },
      { code: "6109", name: "T-shirts, cotton", rate: "5% / 12%" },
      { code: "6403", name: "Footwear (leather)", rate: "12% / 18%" },
      { code: "8517", name: "Mobile phones", rate: "18%" },
      { code: "8471", name: "Laptops & computers", rate: "18%" },
      { code: "8703", name: "Motor cars", rate: "28% + cess" },
      { code: "3004", name: "Medicines", rate: "5% / 12%" },
      { code: "9983", name: "Professional / IT services", rate: "18%" },
      { code: "9954", name: "Construction services", rate: "12% / 18%" },
      { code: "9963", name: "Restaurant & hotel services", rate: "5% / 18%" },
      { code: "9965", name: "Goods transport (GTA)", rate: "5% / 12%" },
      { code: "2523", name: "Cement", rate: "28%" },
      { code: "7108", name: "Gold", rate: "3%" },
      { code: "9973", name: "Leasing / rental services", rate: "18%" },
      { code: "4901", name: "Printed books", rate: "0%" },
      { code: "3401", name: "Soap", rate: "18%" },
    ],
  },
  hra: {
    defaultBasic: "600000",
    defaultHra: "240000",
    defaultRent: "180000",
    metroPercent: "50",
    nonMetroPercent: "40",
    rentOverBasicPercent: "10",
    metroLabel: "Metro (Delhi, Mumbai, Kolkata, Chennai)",
  },
  sip: { defaultAmount: "10000", defaultRate: "12", defaultYears: "10" },
  gstin: {
    states: [
      ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"], ["05", "Uttarakhand"],
      ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"], ["10", "Bihar"], ["11", "Sikkim"],
      ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"],
      ["18", "Assam"], ["19", "West Bengal"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"],
      ["24", "Gujarat"], ["25", "Daman & Diu"], ["26", "Dadra & Nagar Haveli and Daman & Diu"], ["27", "Maharashtra"],
      ["28", "Andhra Pradesh (old)"], ["29", "Karnataka"], ["30", "Goa"], ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"],
      ["34", "Puducherry"], ["35", "Andaman & Nicobar Islands"], ["36", "Telangana"], ["37", "Andhra Pradesh"], ["38", "Ladakh"],
      ["97", "Other Territory"], ["99", "Centre Jurisdiction"],
    ].map(([code, name]) => ({ code, name })),
  },
  emi: { defaultAmount: "1000000", defaultRate: "9.5", defaultYears: "10", maxYears: "30" },
};
