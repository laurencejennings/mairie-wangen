export type BulletinCommunal = {
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

const OLD_BULLETIN_FILE_PREFIX = '/api/bulletins/files/';
const PUBLIC_BULLETIN_FILE_PREFIX = '/bulletins/files/';

export function normalizeBulletinPdfUrl(pdfUrl: string) {
  if (pdfUrl.startsWith(OLD_BULLETIN_FILE_PREFIX)) {
    return `${PUBLIC_BULLETIN_FILE_PREFIX}${pdfUrl.slice(OLD_BULLETIN_FILE_PREFIX.length)}`;
  }

  return pdfUrl;
}

export function normalizeBulletin(bulletin: BulletinCommunal): BulletinCommunal {
  return {
    ...bulletin,
    pdfUrl: normalizeBulletinPdfUrl(bulletin.pdfUrl),
  };
}
