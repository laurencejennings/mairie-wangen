declare module 'react-pageflip' {
  import type { CSSProperties, ReactNode, Ref } from 'react';

  export type PageFlipEvent = {
    data: number;
  };

  export type PageFlipInstance = {
    flipNext: () => void;
    flipPrev: () => void;
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
  };

  export type HTMLFlipBookRef = {
    pageFlip: () => PageFlipInstance | undefined;
  };

  export type HTMLFlipBookProps = {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    size: 'fixed' | 'stretch';
    startPage?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    renderOnlyPageLengthChange?: boolean;
    onFlip?: (event: PageFlipEvent) => void;
  };

  export default function HTMLFlipBook(
    props: HTMLFlipBookProps & { ref?: Ref<HTMLFlipBookRef> },
  ): JSX.Element;
}
