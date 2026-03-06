import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Contributor } from '@/types/contributor';

const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 54;

// Optimisé : scale 2 suffit pour la qualité carte bancaire
const SCALE_FACTOR = 2;
const JPEG_QUALITY = 0.85;

// Nombre de captures en parallèle
const BATCH_SIZE = 4;

const waitForFonts = async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
};

const captureCardAsCanvas = async (cardElement: HTMLElement): Promise<HTMLCanvasElement> => {
  return html2canvas(cardElement, {
    scale: SCALE_FACTOR,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    width: cardElement.scrollWidth,
    height: cardElement.scrollHeight,
    windowWidth: cardElement.scrollWidth,
    windowHeight: cardElement.scrollHeight,
    onclone: (_doc, clonedElement) => {
      clonedElement.style.overflow = 'visible';
      clonedElement.querySelectorAll('*').forEach((child) => {
        const el = child as HTMLElement;
        if (el.style) {
          if (el.style.overflow === 'hidden') el.style.overflow = 'visible';
          if (el.style.textOverflow === 'ellipsis') el.style.textOverflow = 'clip';
        }
      });
    },
  });
};

/** Capture par lots en parallèle */
const captureAllCanvases = async (
  elements: HTMLElement[],
  onProgress?: (done: number, total: number) => void
): Promise<HTMLCanvasElement[]> => {
  const results: HTMLCanvasElement[] = new Array(elements.length);
  let done = 0;

  for (let i = 0; i < elements.length; i += BATCH_SIZE) {
    const batch = elements.slice(i, i + BATCH_SIZE);
    const canvases = await Promise.all(batch.map(el => captureCardAsCanvas(el)));
    canvases.forEach((c, j) => {
      results[i + j] = c;
    });
    done += canvases.length;
    onProgress?.(done, elements.length);
  }

  return results;
};

const canvasToDataUrl = (canvas: HTMLCanvasElement): string =>
  canvas.toDataURL('image/jpeg', JPEG_QUALITY);

export const exportSingleCardToPdf = async (
  cardElement: HTMLElement,
  contributor: Contributor
): Promise<void> => {
  try {
    await waitForFonts();
    const canvas = await captureCardAsCanvas(cardElement);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
    });

    pdf.addImage(canvasToDataUrl(canvas), 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    pdf.save(`carte-b2-${contributor.npc || contributor.id}.pdf`);
  } catch (error) {
    console.error('Erreur export PDF individuel:', error);
    throw new Error("Erreur lors de l'export PDF");
  }
};

export const exportAllCardsToPdf = async (
  cardElements: HTMLElement[],
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (cardElements.length === 0) throw new Error('Aucune carte à exporter');

  try {
    await waitForFonts();

    const canvases = await captureAllCanvases(cardElements, (done, total) => {
      onProgress?.(Math.round((done / total) * 100));
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
    });

    for (let i = 0; i < canvases.length; i++) {
      if (i > 0) pdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
      pdf.addImage(canvasToDataUrl(canvases[i]), 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    }

    pdf.save(`cartes-b2-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Erreur export PDF global:', error);
    throw new Error("Erreur lors de l'export PDF global");
  }
};

export const exportAllCardsToZip = async (
  cardElements: HTMLElement[],
  contributors: Contributor[],
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (cardElements.length === 0 || contributors.length === 0) {
    throw new Error('Aucune carte à exporter');
  }

  try {
    await waitForFonts();

    // Une seule capture par carte (réutilisée pour PDF individuel + global)
    const canvases = await captureAllCanvases(cardElements, (done, total) => {
      onProgress?.(Math.round((done / total) * 80));
    });

    const zip = new JSZip();
    const cardsFolder = zip.folder('cartes-b2-individuelles')!;

    // Pré-convertir toutes les images une seule fois
    const imgDataList = canvases.map(canvasToDataUrl);

    // Générer les PDF individuels
    for (let i = 0; i < canvases.length; i++) {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
      });
      pdf.addImage(imgDataList[i], 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      cardsFolder.file(
        `carte-b2-${contributors[i].npc || contributors[i].id}.pdf`,
        pdf.output('blob')
      );
    }

    // Générer le PDF global
    const globalPdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
    });

    for (let i = 0; i < canvases.length; i++) {
      if (i > 0) globalPdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
      globalPdf.addImage(imgDataList[i], 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    }

    zip.file('toutes-les-cartes-b2.pdf', globalPdf.output('blob'));

    onProgress?.(90);

    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } });
    saveAs(zipBlob, `cartes-b2-${Date.now()}.zip`);
    onProgress?.(100);
  } catch (error) {
    console.error('Erreur export ZIP:', error);
    throw new Error("Erreur lors de l'export ZIP");
  }
};
