import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Contributor } from '@/types/contributor';

// Dimensions de la carte B2 en mm (format carte bancaire)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 54;

// Optimisation perf sans changer la mise en page
const SCALE_FACTOR = 2;
const JPEG_QUALITY = 0.9;

const waitForFonts = async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
};

const waitNextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

const captureCardAsCanvas = async (
  cardElement: HTMLElement,
  retryCount = 1
): Promise<HTMLCanvasElement> => {
  await waitForFonts();

  // Stabiliser le layout avant capture
  cardElement.offsetHeight;
  await waitNextFrame();

  try {
    return await html2canvas(cardElement, {
      scale: SCALE_FACTOR,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: cardElement.scrollWidth,
      height: cardElement.scrollHeight,
      windowWidth: cardElement.scrollWidth,
      windowHeight: cardElement.scrollHeight,
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.overflow = 'visible';
        const allChildren = clonedElement.querySelectorAll('*');
        allChildren.forEach((child) => {
          const el = child as HTMLElement;
          if (el.style) {
            if (el.style.overflow === 'hidden') {
              el.style.overflow = 'visible';
            }
            if (el.style.textOverflow === 'ellipsis') {
              el.style.textOverflow = 'clip';
            }
          }
        });
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (retryCount > 0 && message.includes('Unable to find element in cloned iframe')) {
      await waitNextFrame();
      return captureCardAsCanvas(cardElement, retryCount - 1);
    }
    throw error;
  }
};

const canvasToDataUrl = (canvas: HTMLCanvasElement) =>
  canvas.toDataURL('image/jpeg', JPEG_QUALITY);

export const exportSingleCardToPdf = async (
  cardElement: HTMLElement,
  contributor: Contributor
): Promise<void> => {
  try {
    const canvas = await captureCardAsCanvas(cardElement);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
    });

    pdf.addImage(canvasToDataUrl(canvas), 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

    const fileName = `carte-b2-${contributor.npc || contributor.id}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Erreur export PDF individuel:', error);
    throw new Error("Erreur lors de l'export PDF");
  }
};

export const exportAllCardsToPdf = async (
  cardElements: HTMLElement[],
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (cardElements.length === 0) {
    throw new Error('Aucune carte à exporter');
  }

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
    });

    for (let i = 0; i < cardElements.length; i++) {
      if (i > 0) {
        pdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
      }

      const canvas = await captureCardAsCanvas(cardElements[i]);
      pdf.addImage(canvasToDataUrl(canvas), 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      onProgress?.(Math.round(((i + 1) / cardElements.length) * 100));
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
    const zip = new JSZip();
    const cardsFolder = zip.folder('cartes-b2-individuelles');

    const globalPdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
    });

    // Une seule capture par carte, réutilisée pour PDF individuel + global
    for (let i = 0; i < cardElements.length; i++) {
      const canvas = await captureCardAsCanvas(cardElements[i]);
      const imgData = canvasToDataUrl(canvas);

      const singlePdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
      });
      singlePdf.addImage(imgData, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      const fileName = `carte-b2-${contributors[i].npc || contributors[i].id}.pdf`;
      cardsFolder?.file(fileName, singlePdf.output('blob'));

      if (i > 0) {
        globalPdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
      }
      globalPdf.addImage(imgData, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      onProgress?.(Math.round(((i + 1) / cardElements.length) * 85));
    }

    zip.file('toutes-les-cartes-b2.pdf', globalPdf.output('blob'));

    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
        streamFiles: true,
      },
      (metadata) => {
        const zipPhase = Math.round((metadata.percent / 100) * 15);
        onProgress?.(85 + zipPhase);
      }
    );

    saveAs(zipBlob, `cartes-b2-${Date.now()}.zip`);
    onProgress?.(100);
  } catch (error) {
    console.error('Erreur export ZIP:', error);
    throw new Error("Erreur lors de l'export ZIP");
  }
};
