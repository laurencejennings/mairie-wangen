export type ProcesVerbal = {
  id: string;
  title: string;
  year: number;
  issueDate: string;
  description?: string;
  pdfUrl: string;
  fileName?: string;
  fileSize?: number;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const OLD_PROCES_VERBAL_FILE_PREFIX = '/api/procesverbal/files/';
const PUBLIC_PROCES_VERBAL_FILE_PREFIX = '/proces-verbaux/files/';

export function normalizeProcesVerbalPdfUrl(pdfUrl: string) {
  if (pdfUrl.startsWith(OLD_PROCES_VERBAL_FILE_PREFIX)) {
    return `${PUBLIC_PROCES_VERBAL_FILE_PREFIX}${pdfUrl.slice(
      OLD_PROCES_VERBAL_FILE_PREFIX.length,
    )}`;
  }

  return pdfUrl;
}

export function normalizeProcesVerbal(
  procesVerbal: ProcesVerbal,
): ProcesVerbal {
  return {
    ...procesVerbal,
    pdfUrl: normalizeProcesVerbalPdfUrl(procesVerbal.pdfUrl),
  };
}