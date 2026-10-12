import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

/**
 * Un "documento" es { titulo, subtitulo, secciones: [ { titulo, kv?, columnas?, filas?, texto? } ] }.
 * Con él se generan tanto el PDF como el Excel, así ambos formatos muestran siempre lo mismo.
 */
const VERDE = '#0f7a5c';
const GRIS = '#46544f';

const limpiarPDF = (v) => String(v ?? '—').replace(/₂/g, '2').replace(/[→⚠️✓]/g, '').replace(/[^\x00-\xFF]/g, '?');

export function generarPDF(res, doc, nombreArchivo) {
  const ancha = doc.secciones.some((s) => s.columnas && s.columnas.length > 5);
  const pdf = new PDFDocument({ size: 'A4', layout: ancha ? 'landscape' : 'portrait', margin: 36, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.pdf"`);
  pdf.pipe(res);

  const W = pdf.page.width - 72;
  const bottom = () => pdf.page.height - 56;

  pdf.fillColor(VERDE).font('Helvetica-Bold').fontSize(18).text(limpiarPDF(doc.titulo));
  pdf.fillColor(GRIS).font('Helvetica').fontSize(9).text(limpiarPDF(doc.subtitulo || ''));
  pdf.moveDown(0.3).strokeColor(VERDE).lineWidth(1.2).moveTo(36, pdf.y).lineTo(36 + W, pdf.y).stroke().moveDown(0.8);

  for (const s of doc.secciones) {
    if (pdf.y > bottom() - 60) pdf.addPage();
    if (s.titulo) pdf.fillColor('#0f3b33').font('Helvetica-Bold').fontSize(12).text(limpiarPDF(s.titulo)).moveDown(0.3);

    if (s.texto) pdf.fillColor('#1d2b27').font('Helvetica').fontSize(9.5).text(limpiarPDF(s.texto), { width: W }).moveDown(0.6);

    if (s.kv) {
      for (const [k, v] of s.kv) {
        if (pdf.y > bottom() - 14) pdf.addPage();
        const y = pdf.y;
        pdf.fillColor(GRIS).font('Helvetica-Bold').fontSize(9).text(limpiarPDF(k), 36, y, { width: 150 });
        pdf.fillColor('#1d2b27').font('Helvetica').fontSize(9).text(limpiarPDF(v), 190, y, { width: W - 154 });
        pdf.y = Math.max(pdf.y, y + 12);
      }
      pdf.moveDown(0.6);
    }

    if (s.columnas) {
      const total = s.columnas.reduce((a, c) => a + (c.ancho || 1), 0);
      const anchos = s.columnas.map((c) => ((c.ancho || 1) / total) * W);
      const cabecera = () => {
        const y = pdf.y;
        pdf.rect(36, y - 2, W, 16).fill(VERDE);
        let x = 36;
        pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        s.columnas.forEach((c, i) => { pdf.text(limpiarPDF(c.titulo), x + 3, y + 2, { width: anchos[i] - 6, lineBreak: false, ellipsis: true }); x += anchos[i]; });
        pdf.y = y + 18;
      };
      cabecera();
      if (!s.filas.length) pdf.fillColor(GRIS).font('Helvetica-Oblique').fontSize(9).text('Sin registros en este periodo.', 40).moveDown(0.5);
      s.filas.forEach((fila, idx) => {
        pdf.font('Helvetica').fontSize(8);
        const celdas = s.columnas.map((c) => limpiarPDF(fila[c.clave]));
        const alto = Math.max(...celdas.map((t, i) => pdf.heightOfString(t, { width: anchos[i] - 6 }))) + 6;
        if (pdf.y + alto > bottom()) { pdf.addPage(); cabecera(); }
        const y = pdf.y;
        if (idx % 2 === 0) pdf.rect(36, y - 2, W, alto).fill('#f3ebdd');
        let x = 36;
        pdf.fillColor('#1d2b27');
        celdas.forEach((t, i) => { pdf.text(t, x + 3, y + 1, { width: anchos[i] - 6 }); x += anchos[i]; });
        pdf.y = y + alto - 2;
      });
      pdf.moveDown(0.8);
    }
  }

  const rango = pdf.bufferedPageRange();
  for (let i = 0; i < rango.count; i++) {
    pdf.switchToPage(i);
    pdf.fillColor(GRIS).font('Helvetica').fontSize(8)
      .text(`NurseNote · SIG Geriátrico  |  Página ${i + 1} de ${rango.count}`, 36, pdf.page.height - 30, { width: W, align: 'center', lineBreak: false });
  }
  pdf.end();
}

export async function generarXLSX(res, doc, nombreArchivo) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NurseNote';
  wb.created = new Date();

  const estilarCabecera = (fila) => {
    fila.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F7A5C' } };
      c.alignment = { vertical: 'middle', wrapText: true };
    });
  };
  const nombreHoja = (n, usados) => {
    let base = String(n || 'Hoja').replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || 'Hoja';
    let nombre = base;
    let i = 2;
    while (usados.has(nombre.toLowerCase())) nombre = `${base.slice(0, 25)} ${i++}`;
    usados.add(nombre.toLowerCase());
    return nombre;
  };
  const usados = new Set();

  const resumen = doc.secciones.filter((s) => s.kv || s.texto);
  if (resumen.length) {
    const ws = wb.addWorksheet(nombreHoja('Resumen', usados));
    ws.columns = [{ width: 32 }, { width: 70 }];
    ws.addRow([doc.titulo]).font = { bold: true, size: 14, color: { argb: 'FF0F7A5C' } };
    if (doc.subtitulo) ws.addRow([doc.subtitulo]);
    ws.addRow([]);
    for (const s of resumen) {
      if (s.titulo) ws.addRow([s.titulo]).font = { bold: true };
      if (s.texto) ws.addRow([s.texto]);
      (s.kv || []).forEach(([k, v]) => ws.addRow([k, v ?? '—']));
      ws.addRow([]);
    }
  }
  for (const s of doc.secciones.filter((x) => x.columnas)) {
    const ws = wb.addWorksheet(nombreHoja(s.titulo, usados));
    ws.columns = s.columnas.map((c) => ({ header: c.titulo, key: c.clave, width: Math.max(10, Math.round((c.ancho || 1) * 12)) }));
    estilarCabecera(ws.getRow(1));
    s.filas.forEach((f) => ws.addRow(s.columnas.reduce((o, c) => ({ ...o, [c.clave]: f[c.clave] ?? '' }), {})));
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    if (s.filas.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: s.columnas.length } };
  }
  if (!wb.worksheets.length) wb.addWorksheet('Sin datos');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}
