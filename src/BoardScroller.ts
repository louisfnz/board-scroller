import Draggabilly from 'draggabilly';

const applyCSS = (element: HTMLElement, styles: Record<string, unknown>) => {
  for (const property of Object.keys(styles)) {
    element.style[property] = styles[property];
  }
};

const createElement = (tagName: string, { id, className, styles }: { id?: string; className?: string; styles?: Record<string, unknown> }): HTMLElement => {
  const element = document.createElement(tagName);
  if (id) element.id = id;
  if (className) element.className = className;
  if (styles) applyCSS(element, styles);
  return element;
};

export default class BoardScroller {
  boardSelector: string;
  boardScrollerId: string;
  boardScrollerWidth: number;
  boardScrollerHeight: number;
  workflowBoardWrapper: HTMLElement;
  workflowBoard: HTMLElement;
  boardScroller: HTMLElement;
  boardScrollerInner: HTMLElement;
  boardScrollerHandle: HTMLElement;
  scrollableHeight: number;
  scrollableWidth: number;
  draggableHeight: number;
  draggableWidth: number;
  originalHandleLeft: number;
  originalHandleTop: number;
  isDragging: boolean;

  constructor() {
    this.boardSelector = '[class*="workflowBoard-"]';
    this.boardScrollerId = 'boardScroller';
    this.boardScrollerWidth = 160;
    this.isDragging = false;
  }

  async load(): Promise<void> {
    await this.workflowBoardLoaded();

    // Tear down existing scroller
    const existingScroller = document.getElementById(this.boardScrollerId);
    if (existingScroller) {
      existingScroller.remove();
    }

    this.workflowBoardWrapper = document.querySelector('[class*="workflowBoardWrapper"]') as HTMLElement;
    this.workflowBoard = document.querySelector('[class*="workflowBoard-"]') as HTMLElement;

    if (!this.workflowBoardWrapper || !this.workflowBoard) return;

    this.boardScroller = this.createBoardScroller();
    this.boardScrollerInner = this.createBoardScrollerInner();
    this.boardScrollerHandle = this.createBoardScrollerHandle();
    this.boardScroller.appendChild(this.boardScrollerInner);
    this.boardScrollerInner.appendChild(this.boardScrollerHandle);
    this.workflowBoardWrapper.appendChild(this.boardScroller);
    this.setScrollerDimensions();
    this.createBoardScrollerColumns();
    this.setHandlePosition();
    this.createEvents();
  }

  setScrollerDimensions(): void {
    // TODO: Figure out dimensions glitches with boards of different sizes

    const scrollerRatio = this.workflowBoard.offsetHeight / this.workflowBoard.offsetWidth;

    if (this.workflowBoardWrapper.offsetHeight > this.workflowBoard.offsetHeight) {
      this.boardScrollerHeight = Math.ceil((this.boardScrollerWidth - 10) * (this.workflowBoardWrapper.offsetHeight / this.workflowBoard.offsetWidth));
    } else {
      this.boardScrollerHeight = Math.ceil((this.boardScrollerWidth - 10) * (this.workflowBoard.offsetHeight / this.workflowBoard.offsetWidth));
    }

    this.boardScroller.style.width = this.boardScrollerWidth + 10 + 'px';
    this.boardScroller.style.height = this.boardScrollerHeight + 10 + 'px';
    this.boardScrollerHandle.style.width = this.boardScrollerWidth * (this.workflowBoardWrapper.offsetWidth / this.workflowBoard.offsetWidth) + 'px';
    this.boardScrollerHandle.style.height =
      Math.ceil((this.boardScrollerWidth - 10) * scrollerRatio) * (this.workflowBoardWrapper.offsetHeight / this.workflowBoard.offsetHeight) + 2 + 'px';
    if (this.boardScrollerHandle.offsetHeight > this.boardScrollerInner.offsetHeight) {
      this.boardScrollerHandle.style.height = this.boardScrollerInner.offsetHeight + 'px';
    }
    if (this.boardScrollerHandle.offsetHeight > this.boardScrollerInner.offsetWidth) {
      this.boardScrollerHandle.style.width = this.boardScrollerInner.offsetWidth + 'px';
    }

    this.originalHandleLeft = this.boardScrollerHandle.offsetLeft;
    this.originalHandleTop = this.boardScrollerHandle.offsetTop;
    this.scrollableHeight = this.workflowBoard.offsetHeight - this.workflowBoardWrapper.offsetHeight + 30;
    this.scrollableWidth = this.workflowBoard.offsetWidth - this.workflowBoardWrapper.offsetWidth + 50;
    this.draggableHeight = this.boardScrollerInner.offsetHeight - this.boardScrollerHandle.offsetHeight;
    this.draggableWidth = this.boardScrollerInner.offsetWidth - this.boardScrollerHandle.offsetWidth;
  }

  createEvents(): void {
    const _this = this;

    const draggable = new Draggabilly(this.boardScrollerHandle, {
      containment: true,
    });

    draggable.on('dragMove', function () {
      _this.workflowBoardWrapper.scrollTop = (this.position.y - _this.originalHandleTop) * (_this.scrollableHeight / _this.draggableHeight);
      _this.workflowBoardWrapper.scrollLeft = (this.position.x - _this.originalHandleLeft) * (_this.scrollableWidth / _this.draggableWidth);
    });

    draggable.on('pointerDown', () => {
      this.boardScrollerHandle.style.cursor = 'grabbing';
    });

    draggable.on('pointerUp', () => {
      this.boardScrollerHandle.style.cursor = 'grab';
    });

    draggable.on('dragStart', () => {
      _this.isDragging = true;
    });

    draggable.on('dragEnd', () => {
      _this.isDragging = false;
    });

    window.addEventListener('resize', () => {
      _this.setScrollerDimensions();
    });

    this.workflowBoardWrapper.addEventListener('scroll', () => {
      if (!_this.isDragging) {
        _this.setHandlePosition();
      }
    });

    document.getElementById(this.boardScrollerId).style.opacity = '1';
  }

  setHandlePosition(): void {
    let top = (this.boardScrollerInner.offsetHeight - this.boardScrollerHandle.offsetHeight) * (this.workflowBoardWrapper.scrollTop / this.scrollableHeight);
    let left = (this.boardScrollerInner.offsetWidth - this.boardScrollerHandle.offsetWidth) * (this.workflowBoardWrapper.scrollLeft / this.scrollableWidth);

    if (top > 0) {
      if (top + this.boardScrollerHandle.offsetHeight > this.boardScrollerInner.offsetHeight) {
        top = this.boardScrollerInner.offsetHeight - this.boardScrollerHandle.offsetHeight;
      }
    } else {
      top = 0;
    }

    if (left > 0) {
      if (left + this.boardScrollerHandle.offsetWidth > this.boardScrollerInner.offsetWidth) {
        left = this.boardScrollerInner.offsetWidth - this.boardScrollerHandle.offsetWidth;
      }
    } else {
      left = 0;
    }

    this.boardScrollerHandle.style.top = top + 'px';
    this.boardScrollerHandle.style.left = left + 'px';
  }

  createBoardScroller(): HTMLElement {
    return createElement('div', {
      id: this.boardScrollerId,
      styles: {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100px',
        height: '100px',
        zIndex: '1000',
        boxSizing: 'border-box',
        backgroundColor: 'var(--theme-container-page-background)',
        border: '1px solid var(--theme-primary-border)',
        boxShadow: '0px 2px 5px rgb(0 0 0 / 20%)',
        borderRadius: '4px',
        opacity: '0',
        transition: 'opacity 200ms ease',
      },
    });
  }

  createBoardScrollerInner(): HTMLElement {
    return createElement('div', {
      id: this.boardScrollerId + 'Inner',
      styles: {
        position: 'relative',
        zIndex: '1001',
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        backgroundColor: 'var(--theme-container-page-background)',
        boxSizing: 'border-box',
        borderRadius: '4px',
      },
    });
  }

  createBoardScrollerHandle(): HTMLElement {
    return createElement('div', {
      id: this.boardScrollerId + 'Handle',
      styles: {
        position: 'absolute',
        width: '0',
        height: '0',
        zIndex: '1003',
        boxSizing: 'border-box',
        border: '2px solid var(--aha-blue-400)',
        borderRadius: '4px',
        cursor: 'grab',
      },
    });
  }

  createBoardScrollerColumns(): void {
    // Remove existing columns in case we're reloading
    document.querySelectorAll('.boardScrollerColumn').forEach(element => element.remove());
    const columnHeaders = document.querySelectorAll('[class*="workflowColumnHeaders"] [class*="columnHeader-"]') as NodeListOf<HTMLElement>;
    const columns = document.querySelectorAll('[class*="workflowGroupItems"] [class*="workflowColumn-"]') as NodeListOf<HTMLElement>;

    let left = 4;

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const columnHeader = columnHeaders[i];

      const cardContainer = column.querySelector('[class*="workflowCardContainer"]') as HTMLElement;
      const widthRatio = column.offsetWidth / this.workflowBoard.offsetWidth;
      const heightRatio =
        cardContainer.offsetHeight /
        (this.workflowBoard.offsetHeight > this.workflowBoardWrapper.offsetHeight ? this.workflowBoard.offsetHeight : this.workflowBoardWrapper.offsetHeight);
      const headerHeightRatio =
        columnHeader.offsetHeight /
        (this.workflowBoard.offsetHeight > this.workflowBoardWrapper.offsetHeight ? this.workflowBoard.offsetHeight : this.workflowBoardWrapper.offsetHeight);

      const columnHeaderElement = createElement('div', {
        className: 'boardScrollerColumn',
        styles: {
          position: 'absolute',
          top: '4px',
          left: left + 'px',
          width: Math.ceil(this.boardScrollerWidth * widthRatio) - 2 + 'px',
          height: Math.ceil(this.boardScrollerHeight * headerHeightRatio) - 1 + 'px',
          zIndex: '1002',
          boxSizing: 'border-box',
          backgroundColor: columnHeader.style.backgroundColor,
          borderRadius: '1px',
        },
      });
      this.boardScrollerInner.appendChild(columnHeaderElement);

      const columnElement = createElement('div', {
        styles: {
          position: 'absolute',
          top: Math.ceil(this.boardScrollerHeight * headerHeightRatio) + 5 + 'px',
          left: left + 'px',
          width: Math.ceil(this.boardScrollerWidth * widthRatio) - 2 + 'px',
          height: Math.ceil(this.boardScrollerHeight * heightRatio) - 2 - columnHeaderElement.offsetHeight + 'px',
          zIndex: '1002',
          boxSizing: 'border-box',
          backgroundColor: 'var(--WorkflowBoard--status-background-color)',
          borderRadius: '1px',
        },
      });
      this.boardScrollerInner.appendChild(columnElement);
      left += Math.ceil(this.boardScrollerWidth * widthRatio);
    }
  }

  // TODO: Better way to assert that the workflow board has loaded?
  workflowBoardLoaded(): Promise<boolean> {
    return new Promise(resolve => {
      if (document.querySelector('[class*="workflowColumn--"]')) {
        return resolve(true);
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector('[class*="workflowColumn--"]')) {
          resolve(true);
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
}
