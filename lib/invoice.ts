import type { Order } from "@/lib/data"

export interface InvoiceDetails {
  /** الرقم الضريبي - only shown on the invoice when the client supplied one (e.g. corporate orders) */
  vatNumber: string
  /** اسم الشركة او العميل */
  clientName: string
  /** التاريخ - free text so staff can type it however they like (e.g. "15/08/2026") */
  date: string
}

// Amal Snacks' own business details, shown on every invoice.
// Edit these if the VAT number, address, or legal name ever changes.
const BUSINESS = {
  name: "Amalsnacks",
  addressLines: ["Dammam Ash Sharqiyah 32272", "Saudi Arabia"],
  vat: "310713241200003",
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Every selector below is scoped under .amal-invoice-wrap so this never leaks
// into the rest of the admin UI's styling when injected into the page.
const INVOICE_STYLES = `
  .amal-invoice-wrap { font-family: "Tahoma", "Segoe UI", sans-serif; color: #1f2937; width: 720px; padding: 40px; background: #fff; direction: rtl; }
  .amal-invoice-wrap * { box-sizing: border-box; }
  .amal-invoice-wrap .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .amal-invoice-wrap .header h1 { font-size: 26px; margin: 0 0 8px; }
  .amal-invoice-wrap .header .sub { font-size: 13px; color: #6b7280; }
  .amal-invoice-wrap .logo-box { background: #FB7185; color: #fff; font-weight: 800; font-size: 16px; padding: 16px 22px; border-radius: 8px; text-align: center; letter-spacing: 1px; line-height: 1.4; }
  .amal-invoice-wrap .business-info { text-align: left; font-size: 12.5px; color: #6b7280; margin-top: 10px; line-height: 1.6; }
  .amal-invoice-wrap .business-info strong { color: #1f2937; display: block; margin-bottom: 2px; }
  .amal-invoice-wrap .meta { display: flex; justify-content: space-between; margin: 28px 0; font-size: 13px; gap: 24px; }
  .amal-invoice-wrap .meta-row { display: flex; justify-content: space-between; gap: 24px; padding: 3px 0; }
  .amal-invoice-wrap .meta-row span:first-child { color: #6b7280; }
  .amal-invoice-wrap .meta-row span:last-child { font-weight: 600; }
  .amal-invoice-wrap table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
  .amal-invoice-wrap th { background: #f3f4f6; padding: 10px 8px; text-align: center; font-weight: 700; border-bottom: 2px solid #e5e7eb; }
  .amal-invoice-wrap th.desc, .amal-invoice-wrap td.desc { text-align: right; }
  .amal-invoice-wrap td { padding: 10px 8px; text-align: center; border-bottom: 1px solid #f0f0f0; }
  .amal-invoice-wrap .totals { margin-top: 20px; margin-inline-start: auto; width: 260px; font-size: 13.5px; }
  .amal-invoice-wrap .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .amal-invoice-wrap .totals .grand { font-weight: 800; font-size: 16px; border-top: 2px solid #1f2937; padding-top: 10px; margin-top: 6px; }
  .amal-invoice-wrap .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; }
`

function buildInvoiceInnerHtml(order: Order, details: InvoiceDetails): string {
  const rows = order.items
    .map((item, index) => {
      const amount = item.price * item.quantity
      return `
        <tr>
          <td>${index + 1}</td>
          <td class="desc">${escapeHtml(item.name)}</td>
          <td>${item.quantity.toFixed(2)}</td>
          <td>${item.price.toFixed(2)}</td>
          <td>${amount.toFixed(2)}</td>
        </tr>`
    })
    .join("")

  const clientVatRow = details.vatNumber
    ? `<div class="meta-row"><span>الرقم الضريبي</span><span dir="ltr">${escapeHtml(details.vatNumber)}</span></div>`
    : ""

  return `
    <style>${INVOICE_STYLES}</style>
    <div class="header">
      <div>
        <h1>الفاتورة</h1>
        <div class="sub">فاتورة رقم ${order.orderNumber}</div>
      </div>
      <div>
        <div class="logo-box">AMAL<br/>SNACKS</div>
        <div class="business-info">
          <strong>${BUSINESS.name}</strong>
          ${BUSINESS.addressLines.map((l) => `<div>${l}</div>`).join("")}
          <div>VAT ${BUSINESS.vat}</div>
        </div>
      </div>
    </div>

    <div class="meta">
      <div>
        <div class="meta-row"><span>التاريخ</span><span>${escapeHtml(details.date)}</span></div>
      </div>
      <div>
        <div class="meta-row"><span>اسم الشركة / العميل</span><span>${escapeHtml(details.clientName)}</span></div>
        ${clientVatRow}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th class="desc">البند والوصف</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>المبلغ</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>المجموع الفرعي</span><span>${order.total.toFixed(2)} ر.س</span></div>
      <div class="row grand"><span>الإجمالي</span><span>${order.total.toFixed(2)} ر.س</span></div>
    </div>

    <div class="footer">شكراً لتعاملكم مع أمل سناك</div>
  `
}

/** Builds the invoice as an off-screen DOM element ready to be rasterized/downloaded. */
function buildInvoiceElement(order: Order, details: InvoiceDetails): HTMLDivElement {
  const wrap = document.createElement("div")
  wrap.className = "amal-invoice-wrap"
  wrap.innerHTML = buildInvoiceInnerHtml(order, details)
  return wrap
}

/** Generates and downloads the invoice as a PDF file — no print dialog involved. */
export async function downloadInvoice(order: Order, details: InvoiceDetails): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default
  const element = buildInvoiceElement(order, details)

  // Render off-screen (not display:none — html2canvas needs real layout to measure).
  element.style.position = "fixed"
  element.style.top = "0"
  element.style.left = "-99999px"
  document.body.appendChild(element)

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: `فاتورة-${order.orderNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "px", format: [800, 1131], orientation: "portrait" },
      })
      .from(element)
      .save()
  } finally {
    document.body.removeChild(element)
  }
}
