import Draggabilly from 'draggabilly';

const applyCSS = (element: HTMLElement, styles: Record<string, unknown>) => {
  for (const property of Object.keys(styles)) {
    element.style[property] = styles[property];
  }
};

const sleep = (duration: number) => new Promise(res => setTimeout(() => res(true), duration));

const createElement = (tagName: string, { id, styles }: { id?: string; styles?: Record<string, unknown> }): HTMLElement => {
  const element = document.createElement(tagName);
  if (id) element.id = id;
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

  async load() {
    await this.workflowBoardLoaded();
    await sleep(500);

    const existingScroller = document.getElementById(this.boardScrollerId);
    if (existingScroller) {
      existingScroller.remove();
    }

    this.workflowBoardWrapper = document.querySelector('[class*="workflowBoardWrapper"]') as HTMLElement;

    if (!this.workflowBoardWrapper) return;

    this.workflowBoard = document.querySelector('[class*="workflowBoard-"]') as HTMLElement;
    this.boardScroller = this.createBoardScroller();
    this.boardScrollerInner = this.createBoardScrollerInner();
    this.boardScrollerHandle = this.createBoardScrollerHandle();
    this.boardScroller.appendChild(this.boardScrollerInner);
    this.boardScrollerInner.appendChild(this.boardScrollerHandle);
    this.workflowBoardWrapper.appendChild(this.boardScroller);
    this.setScrollerDimensions();
    this.createBoardScrollerColumns();
    this.setHandlePosition();
    this.createEvents(this.boardScrollerHandle);
  }

  setScrollerDimensions() {
    const scrollerRatio = this.workflowBoard.offsetHeight / this.workflowBoard.offsetWidth;

    if (this.workflowBoardWrapper.offsetHeight > this.workflowBoard.offsetHeight) {
      this.boardScrollerHeight = Math.ceil(this.boardScrollerWidth * (this.workflowBoardWrapper.offsetHeight / this.workflowBoard.offsetWidth));
    } else {
      this.boardScrollerHeight = Math.ceil(this.boardScrollerWidth * (this.workflowBoard.offsetHeight / this.workflowBoard.offsetWidth));
    }

    this.boardScroller.style.width = this.boardScrollerWidth + 10 + 'px';
    this.boardScroller.style.height = this.boardScrollerHeight + 10 + 'px';
    this.boardScrollerInner.style.width = this.boardScrollerWidth + 4 + 'px';
    this.boardScrollerInner.style.height = this.boardScrollerHeight + 4 + 'px';
    this.boardScrollerHandle.style.width = this.boardScrollerWidth * (this.workflowBoardWrapper.offsetWidth / this.workflowBoard.offsetWidth) + 'px';
    this.boardScrollerHandle.style.height = Math.ceil(this.boardScrollerWidth * scrollerRatio) * (this.workflowBoardWrapper.offsetHeight / this.workflowBoard.offsetHeight) + 2 + 'px';

    this.originalHandleLeft = this.boardScrollerHandle.offsetLeft;
    this.originalHandleTop = this.boardScrollerHandle.offsetTop;
    this.scrollableHeight = this.workflowBoard.offsetHeight - this.workflowBoardWrapper.offsetHeight;
    this.scrollableWidth = this.workflowBoard.offsetWidth - (this.workflowBoardWrapper.offsetWidth - 32);
    this.draggableHeight = this.boardScrollerInner.offsetHeight - this.boardScrollerHandle.offsetHeight;
    this.draggableWidth = this.boardScrollerInner.offsetWidth - this.boardScrollerHandle.offsetWidth;
  }

  createEvents(element: HTMLElement) {
    const _this = this;

    const draggable = new Draggabilly(element, {
      containment: true,
    });

    draggable.on('dragMove', function () {
      _this.workflowBoardWrapper.scrollTop = (this.position.y - _this.originalHandleTop) * (_this.scrollableHeight / _this.draggableHeight);
      _this.workflowBoardWrapper.scrollLeft = (this.position.x - _this.originalHandleLeft) * (_this.scrollableWidth / _this.draggableWidth);
    });

    draggable.on('pointerDown', () => {
      element.style.cursor = 'grabbing';
    });

    draggable.on('pointerUp', () => {
      element.style.cursor = 'grab';
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

    // document.getElementById(this.boardScrollerId).style.opacity = '1';

    this.workflowBoardWrapper.addEventListener('mouseover', () => {
      document.getElementById(this.boardScrollerId).style.opacity = '1';
    });

    this.workflowBoardWrapper.addEventListener('mouseout', () => {
      document.getElementById(this.boardScrollerId).style.opacity = '0';
    });
  }

  setHandlePosition() {
    this.boardScrollerHandle.style.top = (this.boardScroller.offsetHeight - this.boardScrollerHandle.offsetHeight - 14) * (this.workflowBoardWrapper.scrollTop / this.scrollableHeight) + 'px';
    this.boardScrollerHandle.style.left = (this.boardScroller.offsetWidth - this.boardScrollerHandle.offsetWidth - 14) * (this.workflowBoardWrapper.scrollLeft / this.scrollableWidth) + 'px';
  }

  createBoardScroller() {
    return createElement('div', {
      id: this.boardScrollerId,
      styles: {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
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

  createBoardScrollerInner() {
    return createElement('div', {
      id: this.boardScrollerId + 'Inner',
      styles: {
        position: 'absolute',
        top: '3px',
        right: '3px',
        bottom: '3px',
        left: '3px',
        zIndex: '1001',
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        backgroundColor: 'var(--theme-container-page-background)',
        boxSizing: 'border-box',
        borderRadius: '4px',
      },
    });
  }

  createBoardScrollerHandle() {
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

  createBoardScrollerColumns() {
    const columnHeaders = document.querySelectorAll('[class*="workflowColumnHeaders"] [class*="columnHeader-"]') as NodeListOf<HTMLElement>;
    const columns = document.querySelectorAll('[class*="workflowGroupItems"] [class*="workflowColumn-"]') as NodeListOf<HTMLElement>;

    let left = 4;

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const columnHeader = columnHeaders[i];

      const cardContainer = column.querySelector('[class*="workflowCardContainer"]') as HTMLElement;
      const widthRatio = column.offsetWidth / this.workflowBoard.offsetWidth;
      const heightRatio = cardContainer.offsetHeight / this.workflowBoard.offsetHeight;
      const headerHeightRatio = columnHeader.offsetHeight / this.workflowBoard.offsetHeight;

      const columnHeaderElement = createElement('div', {
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
          height: Math.ceil(this.boardScrollerHeight * heightRatio) - 2 + 'px',
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

  workflowBoardLoaded(): Promise<boolean> {
    return new Promise(resolve => {
      if (document.querySelector('[class*="workflowBoard-"]')) {
        return resolve(true);
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector('[class*="workflowBoard-"]')) {
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
