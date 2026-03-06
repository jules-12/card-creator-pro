import { useState, useRef, useCallback } from 'react';
import { Contributor } from '@/types/contributor';
import { exportSingleCardToPdf, exportAllCardsToPdf, exportAllCardsToZip } from '@/utils/pdfExporter';

/**
 * Hook encapsulating all card export logic (SRP).
 * Manages progress state and card element refs.
 */
export const useCardExport = () => {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const setCardRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  const getElements = (contributors: Contributor[]): HTMLDivElement[] =>
    contributors
      .map(c => cardRefs.current.get(c.id))
      .filter((el): el is HTMLDivElement => el !== undefined);

  const withExportState = async (fn: () => Promise<void>, showProgress = false) => {
    setIsExporting(true);
    if (showProgress) setExportProgress(0);
    try {
      await fn();
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const exportSingle = async (contributor: Contributor) => {
    const el = cardRefs.current.get(contributor.id);
    if (!el) return;
    await withExportState(() => exportSingleCardToPdf(el, contributor));
  };

  const exportAllPdf = async (contributors: Contributor[]) => {
    const elements = getElements(contributors);
    if (elements.length === 0) return;
    await withExportState(() => exportAllCardsToPdf(elements, setExportProgress), true);
  };

  const exportZip = async (contributors: Contributor[]) => {
    const elements = getElements(contributors);
    if (elements.length === 0) return;
    await withExportState(() => exportAllCardsToZip(elements, contributors, setExportProgress), true);
  };

  return {
    setCardRef,
    isExporting,
    exportProgress,
    exportSingle,
    exportAllPdf,
    exportZip,
  };
};
