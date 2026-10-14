import "server-only";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { methodCategory } from "./razorpay";
import { defaultPurposes, site } from "./site";
import type { Donation } from "./donations";

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number) {
  return n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
}

function belowThousand(n: number) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ones[h]} Hundred` : "", r ? belowHundred(r) : ""].filter(Boolean).join(" ");
}

/** Converts a rupee amount to words using the Indian numbering system. */
export function amountInWords(paise: number) {
  let rupees = Math.floor(paise / 100);
  const p = paise % 100;
  if (rupees === 0 && p === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rupees) parts.push(belowThousand(rupees));
  let words = `Rupees ${parts.join(" ")}`;
  if (p) words += ` and ${belowHundred(p)} Paise`;
  return `${words} Only`;
}

const teal = rgb(0x0f / 255, 0x46 / 255, 0x43 / 255);
const gold = rgb(0xd6 / 255, 0x9d / 255, 0x58 / 255);
const ink = rgb(0.11, 0.17, 0.16);
const muted = rgb(0.36, 0.42, 0.41);

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawLogo(page: PDFPage, x: number, y: number) {
  page.drawCircle({ x: x + 22, y: y + 30, size: 6, color: gold });
  page.drawEllipse({ x: x + 14, y: y + 14, xScale: 5, yScale: 11, color: rgb(1, 1, 1), rotate: degrees(35) });
  page.drawEllipse({ x: x + 30, y: y + 14, xScale: 5, yScale: 11, color: rgb(1, 1, 1), rotate: degrees(-35) });
}

/** Renders a donation acknowledgement PDF. Never claims 80G unless configured. */
export async function renderReceiptPdf(d: Donation): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Donation receipt ${d.receipt_no}`);
  pdf.setAuthor(site.legal.legalName);
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 48;

  // Header band
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: teal });
  drawLogo(page, margin, height - 92);
  page.drawText(site.legal.legalName, { x: margin + 56, y: height - 62, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText(site.legal.registeredAddress ?? site.city, {
    x: margin + 56, y: height - 82, size: 10, font, color: rgb(0.9, 0.93, 0.92),
  });

  let y = height - 160;
  const is80G = Boolean(site.legal.section80G);
  page.drawText(is80G ? "Donation Receipt" : "Donation Acknowledgement", { x: margin, y, size: 20, font: bold, color: teal });
  y -= 18;
  page.drawText(
    is80G ? "Eligible for deduction under Section 80G of the Income Tax Act, 1961" : "This is an acknowledgement of your donation. It is not a tax-deduction certificate.",
    { x: margin, y, size: 9.5, font, color: muted },
  );

  y -= 34;
  const purpose = defaultPurposes.find((p) => p.slug === d.purpose)?.label ?? d.purpose;
  const paid = new Date(d.paid_at ?? d.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  });
  const rows: [string, string][] = [
    ["Receipt number", d.receipt_no ?? "-"],
    ["Date of payment", paid],
    ["Received from", d.donor_name],
    ...(d.pan ? ([["Donor PAN", d.pan]] as [string, string][]) : []),
    ...(d.address ? ([["Donor address", d.address]] as [string, string][]) : []),
    ["Amount", `INR ${(d.amount_paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
    ["Amount in words", amountInWords(d.amount_paise)],
    ["Donation purpose", purpose],
    ["Payment method", methodCategory(d.method)],
    ["Transaction reference", d.gateway_payment_id ?? "-"],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: margin, y, size: 10, font, color: muted });
    const lines = wrap(value, bold, 11, width - margin * 2 - 170);
    lines.forEach((line, i) => page.drawText(line, { x: margin + 170, y: y - i * 15, size: 11, font: bold, color: ink }));
    y -= 15 * lines.length + 12;
    page.drawLine({ start: { x: margin, y: y + 6 }, end: { x: width - margin, y: y + 6 }, thickness: 0.5, color: rgb(0.88, 0.9, 0.89) });
  }

  y -= 16;
  const legal = [
    site.legal.pan && `Trust PAN: ${site.legal.pan}`,
    site.legal.registration && `Registration: ${site.legal.registration}`,
    site.legal.section80G && `80G: ${site.legal.section80G}`,
  ].filter(Boolean) as string[];
  for (const line of legal) {
    page.drawText(line, { x: margin, y, size: 10, font, color: ink });
    y -= 14;
  }

  y -= 10;
  for (const line of wrap(
    "Thank you for supporting the work of the trust. This receipt was generated electronically after confirmation of your payment by our payment gateway and does not require a signature.",
    font, 10, width - margin * 2,
  )) {
    page.drawText(line, { x: margin, y, size: 10, font, color: muted });
    y -= 14;
  }

  page.drawRectangle({ x: 0, y: 0, width, height: 6, color: gold });
  page.drawText(`${site.contact.email}  ·  ${site.url.replace(/^https?:\/\//, "")}`, {
    x: margin, y: 24, size: 9, font, color: muted,
  });

  return pdf.save();
}
