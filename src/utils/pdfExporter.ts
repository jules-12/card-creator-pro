import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Contributor } from '@/types/contributor';

// Dimensions de la carte B2 en mm (format carte bancaire)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 54;

// DPI élevé pour une fidélité parfaite à l'écran
const SCALE_FACTOR = 3;
const JPEG_QUALITY = 0.92;

const waitForFonts = async () => {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
};

const captureCardAsCanvas = async (cardElement: HTMLElement): Promise<HTMLCanvasElement> => {
  await waitForFonts();

  // Force le navigateur à recalculer le layout avant capture
  cardElement.offsetHeight;

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
    onclone: (clonedDoc, clonedElement) => {
      // S'assurer que tous les éléments du clone sont visibles
      clonedElement.style.overflow = 'visible';
      const allChildren = clonedElement.querySelectorAll('*');
      allChildren.forEach((child) => {
        const el = child as HTMLElement;
        if (el.style) {
          // Empêcher tout clipping de texte dans le PDF
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
};

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

    const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    pdf.addImage(imgData, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    
    const fileName = `carte-b2-${contributor.npc || contributor.id}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Erreur export PDF individuel:', error);
    throw new Error('Erreur lors de l\'export PDF');
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
      const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      pdf.addImage(imgData, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / cardElements.length) * 100));
      }
    }

    pdf.save(`cartes-b2-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Erreur export PDF global:', error);
    throw new Error('Erreur lors de l\'export PDF global');
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

    // Générer chaque PDF individuel
    for (let i = 0; i < cardElements.length; i++) {
      const canvas = await captureCardAsCanvas(cardElements[i]);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
      });

      const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      pdf.addImage(imgData, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      
      const pdfBlob = pdf.output('blob');
      const fileName = `carte-b2-${contributors[i].npc || contributors[i].id}.pdf`;
      cardsFolder?.file(fileName, pdfBlob);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / cardElements.length) * 50));
      }
    }

    // Générer le PDF global
    const globalPdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
    });

    for (let i = 0; i < cardElements.length; i++) {
      if (i > 0) {
        globalPdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
      }

      const canvas = await captureCardAsCanvas(cardElements[i]);
      const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      globalPdf.addImage(imgData, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      if (onProgress) {
        onProgress(50 + Math.round(((i + 1) / cardElements.length) * 50));
      }
    }

    const globalPdfBlob = globalPdf.output('blob');
    zip.file('toutes-les-cartes-b2.pdf', globalPdfBlob);

    // Générer et télécharger le ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `cartes-b2-${Date.now()}.zip`);
  } catch (error) {
    console.error('Erreur export ZIP:', error);
    throw new Error('Erreur lors de l\'export ZIP');
  }
};
