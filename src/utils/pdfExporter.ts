import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Contributor } from '@/types/contributor';

// Dimensions de la carte B2 en mm (format carte bancaire)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 54;

// DPI pour une bonne qualité d'impression
const SCALE_FACTOR = 3;

const captureCardAsCanvas = async (cardElement: HTMLElement): Promise<HTMLCanvasElement> => {
  return await html2canvas(cardElement, {
    scale: SCALE_FACTOR,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
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

    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    
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
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

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

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      
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
      const imgData = canvas.toDataURL('image/png', 1.0);
      globalPdf.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

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
