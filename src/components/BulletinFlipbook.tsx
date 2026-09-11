import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import HTMLFlipBook, {
  type HTMLFlipBookRef,
  type PageFlipEvent,
} from 'react-pageflip';
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

type RenderedPage = {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
};

type BulletinFlipbookProps = {
  pdfUrl: string;
  title: string;
};

type FlipPageProps = {
  page: RenderedPage;
  title: string;
  totalPages: number;
  cover?: boolean;
};

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(
  ({ page, title, totalPages, cover = false }, ref) => (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-white ${
        cover ? 'rounded-r-sm' : ''
      }`}
    >
      <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-slate-950/10 to-transparent" />
      <img
        src={page.imageUrl}
        alt={`${title} - page ${page.pageNumber}`}
        className="h-full w-full object-contain"
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-white/90 via-white/60 to-transparent px-4 pb-3 pt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        <span>{cover ? 'Couverture' : `Page ${page.pageNumber}`}</span>
        <span>{totalPages}</span>
      </div>
    </div>
  ),
);

FlipPage.displayName = 'FlipPage';

function pageSpreadLabel(pageIndex: number, totalPages: number) {
  if (totalPages === 0) {
    return '0 / 0';
  }

  const firstPage = Math.min(pageIndex + 1, totalPages);
  const secondPage = Math.min(pageIndex + 2, totalPages);

  if (firstPage === secondPage || firstPage === 1) {
    return `${firstPage} / ${totalPages}`;
  }

  return `${firstPage}-${secondPage} / ${totalPages}`;
}

async function renderPdfPages(pdfUrl: string, signal: AbortSignal) {
  const loadingTask = pdfjs.getDocument({
    url: pdfUrl,
    withCredentials: false,
  });

  signal.addEventListener('abort', () => {
    loadingTask.destroy();
  });

  const pdf = await loadingTask.promise;
  const pages: RenderedPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (signal.aborted) {
      break;
    }

    const page = await pdf.getPage(pageNumber);
    const sourceViewport = page.getViewport({ scale: 1 });
    const targetWidth = 980;
    const scale = targetWidth / sourceViewport.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });

    if (!context) {
      throw new Error('Impossible de préparer le rendu du PDF.');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    pages.push({
      pageNumber,
      imageUrl: canvas.toDataURL('image/jpeg', 0.92),
      width: viewport.width,
      height: viewport.height,
    });

    page.cleanup();
  }

  await pdf.cleanup();

  return pages;
}

export default function BulletinFlipbook({ pdfUrl, title }: BulletinFlipbookProps) {
  const bookRef = useRef<HTMLFlipBookRef>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [status, setStatus] = useState('Préparation du bulletin...');
  const [error, setError] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setPages([]);
    setError('');
    setCurrentPageIndex(0);
    setStatus('Préparation du bulletin...');

    renderPdfPages(pdfUrl, controller.signal)
      .then((renderedPages) => {
        if (controller.signal.aborted) {
          return;
        }

        setPages(renderedPages);
        setStatus('');
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setError("Le lecteur à pages n'a pas pu charger ce PDF.");
        setStatus('');
      });

    return () => {
      controller.abort();
    };
  }, [pdfUrl]);

  const aspectRatio = useMemo(() => {
    const firstPage = pages[0];

    if (!firstPage) {
      return 1.414;
    }

    return firstPage.height / firstPage.width;
  }, [pages]);

  const bookHeight = Math.round(420 * aspectRatio);

  function flipPrevious() {
    bookRef.current?.pageFlip()?.flipPrev();
  }

  function flipNext() {
    bookRef.current?.pageFlip()?.flipNext();
  }

  function updateCurrentPage(event: PageFlipEvent) {
    setCurrentPageIndex(event.data);
  }

  if (error) {
    return (
      <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-extrabold">{error}</p>
            <p className="mt-2 text-sm leading-6">
              Vous pouvez toujours ouvrir ou télécharger le PDF avec les boutons au-dessus.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[26px] border border-slate-200 bg-slate-900 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-300" />
          <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-200">
            {status}
          </p>
          <p className="mt-2 text-sm text-slate-300">Les pages se préparent pour la lecture.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-900 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">
              {pageSpreadLabel(currentPageIndex, pages.length)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={flipPrevious}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            title="Page précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={flipNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            title="Page suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.18),transparent_28%),linear-gradient(135deg,#0f172a_0%,#1f2937_52%,#111827_100%)] px-2 py-7 sm:px-5 lg:px-8">
        <div className="pointer-events-none absolute inset-x-6 bottom-5 h-10 rounded-full bg-black/40 blur-2xl" />
        <div className="relative mx-auto flex min-h-[620px] items-center justify-center">
          <HTMLFlipBook
            key={pdfUrl}
            ref={bookRef}
            width={420}
            height={bookHeight}
            minWidth={280}
            maxWidth={520}
            minHeight={396}
            maxHeight={736}
            size="stretch"
            startPage={0}
            drawShadow
            flippingTime={900}
            usePortrait
            startZIndex={1}
            autoSize
            maxShadowOpacity={0.45}
            showCover
            mobileScrollSupport
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners
            disableFlipByClick={false}
            className="bulletin-pageflip"
            style={{ margin: '0 auto' }}
            onFlip={updateCurrentPage}
          >
            {pages.map((page, index) => (
              <FlipPage
                key={page.pageNumber}
                page={page}
                title={title}
                totalPages={pages.length}
                cover={index === 0}
              />
            ))}
          </HTMLFlipBook>
        </div>
      </div>
    </div>
  );
}
