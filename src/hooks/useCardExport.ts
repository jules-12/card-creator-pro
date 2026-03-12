import { useCallback, useRef, useState } from 'react';
import { Contributor } from '@/types/contributor';
import { exportSingleCardToPdf, exportAllCardsToPdf, exportAllCardsToZip } from '@/utils/pdfExporter';

/**
 * Hook encapsulating all card export logic (single PDF, global PDF, ZIP).
 * Eliminates duplicated isExporting / progress / try-catch patterns in CardGallery.
 */
export const useCardExport = (contributors: Contributor[]) => {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const setCardRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) cardRefs.current.set(id, element);
    else cardRefs.current.delete(id);
  }, []);

  const collectElements = (): HTMLDivElement[] =>
    contributors
      .map(c => cardRefs.current.get(c.id))
      .filter((el): el is HTMLDivElement => el !== undefined);

  const runExport = useCallback(async (fn: () => Promise<void>) => {
    setIsExporting(true);
    setExportProgress(0);
    try {
      await fn();
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, []);

  const exportSingle = useCallback(async (contributor: Contributor) => {
    const el = cardRefs.current.get(contributor.id);
    if (!el) return;
    setIsExporting(true);
    try {
      await exportSingleCardToPdf(el, contributor);
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportAllPdf = useCallback(() => {
    const elements = collectElements();
    if (elements.length === 0) return;
    return runExport(() => exportAllCardsToPdf(elements, setExportProgress));
  }, [contributors, runExport]);

  const exportZip = useCallback(() => {
    const elements = collectElements();
    if (elements.length === 0) return;
    return runExport(() => exportAllCardsToZip(elements, contributors, setExportProgress));
  }, [contributors, runExport]);

  return { cardRefs, setCardRef, isExporting, exportProgress, exportSingle, exportAllPdf, exportZip };
};
