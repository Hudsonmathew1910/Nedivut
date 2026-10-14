import type { NextRequest } from "next/server";
import { getDonationForToken } from "@/lib/donations";
import { renderReceiptPdf } from "@/lib/receipt";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Secure receipt download: requires the donation's secret token (REC 02). */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/receipts/[id]">) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (!isSupabaseConfigured) return new Response("Not found", { status: 404 });

  const donation = await getDonationForToken(id, token);
  if (!donation || donation.status !== "success" || !donation.receipt_no) {
    return new Response("Receipt not found", { status: 404 });
  }

  const pdf = await renderReceiptPdf(donation);
  const filename = `Nedivut-receipt-${donation.receipt_no.replace(/\//g, "-")}.pdf`;
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
