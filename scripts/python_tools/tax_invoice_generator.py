import os
from reportlab.lib.pagesizes import letter  # type: ignore
from reportlab.lib import colors  # type: ignore
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image  # type: ignore
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # type: ignore

def generate_gst_tax_invoice(
    invoice_id,
    customer_name,
    customer_phone,
    vehicle_title,
    city,
    total_amount,
    gstin="07AAAAA0000A1Z5",
    output_pdf_path=None
):
    if not output_pdf_path:
        output_pdf_path = f"public/uploads/invoice_{invoice_id}.pdf"

    os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    story = []

    # Title Banner
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor("#dc2626"),
        fontName="Helvetica-Bold",
        spaceAfter=6
    )
    story.append(Paragraph("NEXT GEAR RENTALS", title_style))
    story.append(Paragraph(f"<b>TAX INVOICE & RENTAL RECEIPT</b> | Invoice #{invoice_id}", styles['Normal']))
    story.append(Paragraph(f"GSTIN: {gstin} | Pan India Self-Drive Mobility Network", styles['Normal']))
    story.append(Spacer(1, 16))

    # Details Grid
    gst_rate = 0.18 # 18% GST (9% CGST + 9% SGST)
    base_taxable = round(total_amount / (1 + gst_rate), 2)
    cgst = round(base_taxable * 0.09, 2)
    sgst = round(base_taxable * 0.09, 2)

    data = [
        ["Customer Name:", customer_name, "Invoice Date:", "Immediate"],
        ["Customer Phone:", customer_phone, "Pickup Hub:", city],
        ["Vehicle Rented:", vehicle_title, "Security Deposit:", "₹0 / Free Fast KYC"],
        ["Taxable Value (₹):", f"₹{base_taxable}", "CGST (9%):", f"₹{cgst}"],
        ["SGST (9%):", f"₹{sgst}", "<b>Total Paid (₹):</b>", f"<b>₹{total_amount}</b>"],
    ]

    t = Table(data, colWidths=[130, 140, 130, 140])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # Terms & QR Verification Note
    story.append(Paragraph("<b>Terms & Verification:</b> This is a digitally generated tax receipt valid across all state transport authorities. Keep digital pass or QR verification active during transit.", styles['Italic']))

    doc.build(story)
    print(f"[OK] Tax invoice generated: {output_pdf_path}")
    return output_pdf_path

if __name__ == "__main__":
    generate_gst_tax_invoice("INV-98214", "Rahul Sharma", "+91 98765 43210", "Mahindra Thar 4x4", "Goa", 2499)
