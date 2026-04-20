/* ════════════════════════════════════════════════
   CURA — Prescription PDF generator
   Uses jsPDF (loaded via CDN) to produce a clean,
   signed-looking Rx PDF for any saved prescription.
══════════════════════════════════════════════════ */

(function () {
  function downloadPrescriptionPdf(rxId) {
    if (!window.jspdf) { window.showToast && window.showToast('PDF library not loaded', '⚠'); return; }
    const { jsPDF } = window.jspdf;

    let rx;
    if (rxId && window.CuraStore) {
      rx = (CuraStore.state.prescriptions || []).find(p => p.id === rxId);
    }
    if (!rx) {
      // Fallback sample
      rx = {
        id: 'PRX-0091',
        patient: 'Rajan Kumar',
        date: new Date().toISOString().slice(0,10),
        diagnosis: 'Stage 2 Hypertension with mild tachycardia',
        meds: [
          { name:'Amlodipine 5mg',   dose:'1 tablet', freq:'Once daily (morning)' },
          { name:'Telmisartan 40mg', dose:'1 tablet', freq:'At bedtime' },
        ],
        duration: '30 days',
        instructions: 'Take after meals · Avoid excess salt',
      };
    }

    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Header band
    doc.setFillColor(15, 23, 38);
    doc.rect(0, 0, W, 90, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold'); doc.setFontSize(24);
    doc.text('Cura', 40, 50);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text('Cloud Medical Consultation Platform', 40, 68);
    doc.setFontSize(11);
    doc.text(`Rx #${rx.id}`, W - 40, 50, { align:'right' });
    doc.text(rx.date, W - 40, 68, { align:'right' });

    // Doctor block
    doc.setTextColor(20,20,20);
    let y = 130;
    doc.setFont('helvetica','bold'); doc.setFontSize(13);
    doc.text('Dr. Alisha Rao, MD', 40, y);
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(90,90,90);
    doc.text('Cardiology · Reg. No. KMC-21984', 40, y+15);
    doc.text('Cura General Hospital · Kochi', 40, y+30);

    // Patient block
    y += 70;
    doc.setDrawColor(220,220,220); doc.setLineWidth(0.5);
    doc.line(40, y, W-40, y);
    y += 20;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(20,20,20);
    doc.text('Patient', 40, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60);
    doc.text(rx.patient, 110, y);
    doc.setFont('helvetica','bold'); doc.text('Date', 320, y);
    doc.setFont('helvetica','normal'); doc.text(rx.date, 360, y);

    // Diagnosis
    if (rx.diagnosis) {
      y += 24;
      doc.setFont('helvetica','bold'); doc.setTextColor(20,20,20); doc.text('Diagnosis', 40, y);
      doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60);
      const lines = doc.splitTextToSize(rx.diagnosis, W - 200);
      doc.text(lines, 110, y);
      y += 14 * lines.length;
    }

    // Rx symbol
    y += 30;
    doc.setFont('helvetica','bold'); doc.setFontSize(28); doc.setTextColor(16,185,129);
    doc.text('Rx', 40, y);
    doc.setFontSize(12); doc.setTextColor(20,20,20);

    // Meds table
    y += 20;
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(120,120,120);
    doc.text('MEDICATION', 40, y);
    doc.text('DOSAGE', 280, y);
    doc.text('FREQUENCY', 400, y);
    y += 8;
    doc.setLineWidth(0.5); doc.setDrawColor(210,210,210);
    doc.line(40, y, W-40, y);
    y += 16;
    doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(20,20,20);
    (rx.meds || []).forEach(m => {
      doc.setFont('helvetica','bold'); doc.text(m.name || '', 40, y);
      doc.setFont('helvetica','normal');
      doc.text(m.dose || '', 280, y);
      doc.text(m.freq || '', 400, y);
      y += 18;
      doc.setDrawColor(240,240,240);
      doc.line(40, y-6, W-40, y-6);
    });

    // Instructions
    y += 14;
    if (rx.duration || rx.instructions) {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(120,120,120);
      doc.text('INSTRUCTIONS', 40, y);
      y += 14;
      doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(40,40,40);
      const txt = [rx.duration, rx.instructions].filter(Boolean).join(' · ');
      const lines = doc.splitTextToSize(txt, W - 80);
      doc.text(lines, 40, y);
      y += 14 * lines.length;
    }

    // Signature line
    const sigY = H - 110;
    doc.setDrawColor(60,60,60);
    doc.line(W - 220, sigY, W - 40, sigY);
    doc.setFont('helvetica','italic'); doc.setFontSize(11); doc.setTextColor(40,40,40);
    doc.text('Dr. Alisha Rao', W - 130, sigY - 6, { align:'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(120,120,120);
    doc.text('Digital signature', W - 130, sigY + 14, { align:'center' });

    // Footer
    doc.setFontSize(8); doc.setTextColor(140,140,140);
    doc.text('This prescription is digitally generated and valid without physical signature.', 40, H - 40);
    doc.text('Cura · Sharon, Aaron & Sam', W - 40, H - 40, { align:'right' });

    doc.save(`Cura-Rx-${rx.id}.pdf`);
    window.showToast && window.showToast(`Prescription ${rx.id} downloaded`, '⬇');
  }

  window.downloadPrescriptionPdf = downloadPrescriptionPdf;
})();
