import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface Certificate {
  id: string;
  learnerName: string;
  trainerName: string;
  courseName: string;
  date: string;
  averageScore: number;
  mention: string;
  quizScores: number[];
}

export function calculateMention(averageScore: number): string {
  if (averageScore >= 95) return "Excellent";
  if (averageScore >= 85) return "Très Bien";
  if (averageScore >= 70) return "Bien";
  if (averageScore >= 50) return "Passable";
  return "Insuffisant";
}

export function generateCertificateNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `CERT-${timestamp}-${random}`;
}

/** Graduation cap */
function drawGraduationCap(doc: jsPDF, cx: number, cy: number, size: number) {
  const s = size / 20;
  doc.setFillColor(200, 210, 240);
  doc.ellipse(cx, cy + 11 * s, 14 * s, 3 * s, "F");
  doc.setFillColor(30, 58, 138);
  doc.triangle(
    cx,
    cy - 10 * s,
    cx - 13 * s,
    cy - 2 * s,
    cx + 13 * s,
    cy - 2 * s,
    "F",
  );
  doc.setFillColor(37, 70, 165);
  doc.rect(cx - 10 * s, cy - 2 * s, 20 * s, 3 * s, "F");
  doc.setFillColor(24, 45, 110);
  doc.triangle(
    cx - 10 * s,
    cy - 2 * s,
    cx - 10 * s,
    cy + 8 * s,
    cx,
    cy + 11 * s,
    "F",
  );
  doc.triangle(
    cx + 10 * s,
    cy - 2 * s,
    cx + 10 * s,
    cy + 8 * s,
    cx,
    cy + 11 * s,
    "F",
  );
  doc.setFillColor(30, 58, 138);
  doc.triangle(
    cx - 10 * s,
    cy + 8 * s,
    cx + 10 * s,
    cy + 8 * s,
    cx,
    cy + 11 * s,
    "F",
  );
  doc.setDrawColor(218, 165, 32);
  doc.setLineWidth(0.7 * s);
  doc.line(cx + 13 * s, cy - 2 * s, cx + 13 * s, cy + 6 * s);
  doc.setFillColor(218, 165, 32);
  doc.circle(cx + 13 * s, cy + 6 * s, 1.5 * s, "F");
  doc.setLineWidth(0.4 * s);
  doc.line(cx + 12 * s, cy + 6 * s, cx + 11 * s, cy + 10 * s);
  doc.line(cx + 13 * s, cy + 6 * s, cx + 13 * s, cy + 10 * s);
  doc.line(cx + 14 * s, cy + 6 * s, cx + 15 * s, cy + 10 * s);
}

/**
 * ✅ NOUVEAU — Décoration de coin style capture 1
 * Grille 5×5 de petits carrés en damier (sombre / clair)
 */
function drawCornerDecoration(
  doc: jsPDF,
  startX: number,
  startY: number,
  size: number,
) {
  const gridN = 5;
  const cell = size / gridN;
  const dark: [number, number, number] = [10, 20, 80];
  const light: [number, number, number] = [245, 247, 255];

  doc.setLineWidth(0.28);
  doc.setDrawColor(dark[0], dark[1], dark[2]);

  for (let row = 0; row < gridN; row++) {
    for (let col = 0; col < gridN; col++) {
      const x = startX + col * cell;
      const y = startY + row * cell;

      const isBorderCell =
        row === 0 || row === gridN - 1 || col === 0 || col === gridN - 1;

      if (isBorderCell || (row % 2 === 0 && col % 2 === 0)) {
        // Cellule foncée
        doc.setFillColor(dark[0], dark[1], dark[2]);
        doc.rect(x, y, cell, cell, "FD");
      } else {
        // Cellule claire
        doc.setFillColor(light[0], light[1], light[2]);
        doc.rect(x, y, cell, cell, "FD");
      }
    }
  }
}

/** Charge une image depuis une URL et retourne un dataURL base64 */
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateCertificatePDF(
  certificate: Certificate,
): Promise<void> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // ── Fond blanc ─────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // ══════════════════════════════════════════════════════
  //  ✅ NOUVEAU CADRE STYLE CAPTURE 1
  // ══════════════════════════════════════════════════════
  const margin = 12;
  const cornerSize = 24;
  const darkNavy: [number, number, number] = [10, 20, 80];

  // Bordure extérieure (ligne épaisse)
  doc.setDrawColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setLineWidth(1.4);
  doc.rect(margin, margin, width - 2 * margin, height - 2 * margin);

  // Bordure intérieure (ligne fine)
  doc.setLineWidth(0.45);
  doc.rect(
    margin + 4.5,
    margin + 4.5,
    width - 2 * (margin + 4.5),
    height - 2 * (margin + 4.5),
  );

  // ══════════════════════════════════════════════════════

  // ── Graduation cap ─────────────────────────────────────
  drawGraduationCap(doc, width / 2, 30, 18);

  // ── Titre ───────────────────────────────────────────────
  doc.setFontSize(38);
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICAT", width / 2, 54, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("DE FORMATION PROFESSIONNELLE", width / 2, 63, { align: "center" });

  // Ligne décorative sous le titre
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 60, 66, width / 2 + 60, 66);

  // Sous-titre
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text("FIÈREMENT DÉCERNÉ À", width / 2, 75, { align: "center" });

  // Nom de l'apprenant
  doc.setFontSize(32);
  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.text(certificate.learnerName, width / 2, 88, { align: "center" });

  // Description
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "normal");
  doc.text(
    "En reconnaissance pour sa participation et son soutien lors de la formation",
    width / 2,
    100,
    { align: "center" },
  );

  // Nom de la formation
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229);
  doc.setFont("helvetica", "bold");
  doc.text(certificate.courseName, width / 2, 112, { align: "center" });

  // ── Section Date + Mention ──────────────────────────────
  const sectionY = 125;

  // Gauche — Date
  const dateCx = 70;
  //  Image sous la date
  const badgeWidth = 40;
  const badgeHeight = 40;

  // centré sous la date
  const badgeX = dateCx - badgeWidth / 2;
  const badgeY = sectionY + 20;

  try {
    const badgeBase64 = await loadImageAsBase64("/images/certified.png");
    doc.addImage(badgeBase64, "PNG", badgeX, badgeY, badgeWidth, badgeHeight);
  } catch (error) {
    console.error("Erreur chargement image badge:", error);
  }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("DATE D'ÉMISSION", dateCx, sectionY, { align: "center" });
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(
    new Date(certificate.date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    dateCx,
    sectionY + 10,
    { align: "center" },
  );

  // Droite — Mention
  const mentionCx = 227;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("MENTION", mentionCx, sectionY, { align: "center" });
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(certificate.mention, mentionCx, sectionY + 10, { align: "center" });

  // ── Signature ───────────────────────────────────────────
  const signatureY = sectionY + 24;
  const signatureW = 52;
  const signatureH = 22;
  const signatureX = mentionCx - signatureW / 2;

  try {
    const signatureBase64 = await loadImageAsBase64("/images/signature.png");
    doc.addImage(
      signatureBase64,
      "PNG",
      signatureX,
      signatureY,
      signatureW,
      signatureH,
    );
  } catch {
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(
      signatureX,
      signatureY + signatureH - 2,
      signatureX + signatureW,
      signatureY + signatureH - 2,
    );
    doc.setLineDashPattern([], 0);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);

  // ── QR Code ─────────────────────────────────────────────
  const appUrl =
    import.meta.env.VITE_APP_URL || window.location.origin.replace(/\/$/, "");
  const verifyUrl = `${appUrl.replace(/\/$/, "")}/verify/${certificate.id}`;

  const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 300,
    margin: 1,
    color: { dark: "#1e293b", light: "#ffffff" },
  });

  const qrX = width / 2 - 18;
  const qrY = height - 68;
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX - 3, qrY - 3, 42, 42, "F");
  doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, 36, 36);

  // Numéro du certificat
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text("CERTIFICAT N°", width / 2, height - 27, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(certificate.id, width / 2, height - 22, { align: "center" });

  // Éléments décoratifs pied de page (dark navy)
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.circle(35, height - 25, 1.5, "F");
  doc.circle(42, height - 25, 1, "F");
  doc.circle(width - 35, height - 25, 1.5, "F");
  doc.circle(width - 42, height - 25, 1, "F");

  // Sauvegarde
  doc.save(
    `Certificat_${certificate.learnerName.replace(/\s+/g, "_")}_${certificate.id}.pdf`,
  );
}

function getMentionColor(mention: string): { r: number; g: number; b: number } {
  switch (mention) {
    case "Excellent":
      return { r: 16, g: 185, b: 129 };
    case "Très Bien":
      return { r: 59, g: 130, b: 246 };
    case "Bien":
      return { r: 139, g: 92, b: 246 };
    case "Passable":
      return { r: 251, g: 146, b: 60 };
    default:
      return { r: 239, g: 68, b: 68 };
  }
}
