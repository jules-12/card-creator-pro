import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parseExcelFile } from '@/utils/excelParser';
import { Contributor } from '@/types/contributor';

interface FileUploaderProps {
  onDataLoaded: (contributors: Contributor[]) => void;
  onError: (error: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const validExtensions = ['.xls', '.xlsx'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(extension)) {
      onError('Format de fichier non supporté. Utilisez .xls ou .xlsx');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const result = await parseExcelFile(file);
      
      if (result.contributors.length === 0) {
        onError('Aucune donnée valide trouvée dans le fichier');
        return;
      }

      onDataLoaded(result.contributors);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier');
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div
      className={`drop-zone cursor-pointer ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".xls,.xlsx"
        onChange={handleInputChange}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement de {fileName}...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {isDragging ? (
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="font-heading font-semibold text-foreground mb-1">
              {isDragging ? 'Déposez le fichier ici' : 'Importer un fichier Excel'}
            </p>
            <p className="text-sm text-muted-foreground">
              Glissez-déposez ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Formats acceptés : .xls, .xlsx
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
