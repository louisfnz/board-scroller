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

  constructor() {
    this.boardSelector = '[class*="workflowBoard-"]';
    this.boardScrollerId = 'boardScroller';
    this.boardScrollerWidth = 140;
  }

  async load() {
    await this.workflowBoardLoaded();
    await sleep(500);

    const existingScroller = document.getElementById(this.boardScrollerId);
    if (existingScroller) {
      existingScroller.remove();
    }

    this.workflowBoardWrapper = document.querySelector('[class*="workflowBoardWrapper"]') as HTMLElement;
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
    this.showBoardScroller();
  }

  setScrollerDimensions() {
    const scrollerRatio = this.workflowBoard.offsetHeight / this.workflowBoard.offsetWidth;

    this.boardScrollerHeight = Math.round(this.boardScrollerWidth * scrollerRatio);

    this.boardScroller.style.width = this.boardScrollerWidth + 'px';
    this.boardScroller.style.height = this.boardScrollerHeight + 'px';
    this.boardScrollerHandle.style.width = (this.boardScrollerWidth - 10) * ((this.workflowBoardWrapper.offsetWidth - 30) / this.workflowBoard.offsetWidth) + 'px';
    this.boardScrollerHandle.style.height = Math.round((this.boardScrollerWidth - 10) * scrollerRatio) * (this.workflowBoardWrapper.offsetHeight / this.workflowBoard.offsetHeight) + 'px';

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

    draggable.on('dragMove', function (event, pointer, vector) {
      _this.workflowBoardWrapper.scrollTop = (this.position.y - _this.originalHandleTop) * (_this.scrollableHeight / _this.draggableHeight);
      _this.workflowBoardWrapper.scrollLeft = (this.position.x - _this.originalHandleLeft) * (_this.scrollableWidth / _this.draggableWidth);
    });

    draggable.on('pointerDown', function () {
      element.style.cursor = 'grabbing';
    });

    draggable.on('pointerUp', function () {
      element.style.cursor = 'grab';
    });

    let dragMove = false;

    draggable.on('dragStart', () => {
      dragMove = true;
    });

    draggable.on('dragEnd', () => {
      dragMove = false;
    });

    window.addEventListener('resize', function () {
      _this.setScrollerDimensions();
    });

    this.workflowBoardWrapper.addEventListener('scroll', function (e) {
      if (!dragMove) {
        _this.setHandlePosition();
      }
    });
  }

  setHandlePosition() {
    this.boardScrollerHandle.style.top = (this.boardScroller.offsetHeight - this.boardScrollerHandle.offsetHeight - 14) * (this.workflowBoardWrapper.scrollTop / this.scrollableHeight) + 'px';
    this.boardScrollerHandle.style.left = (this.boardScroller.offsetWidth - this.boardScrollerHandle.offsetWidth - 14) * (this.workflowBoardWrapper.scrollLeft / this.scrollableWidth) + 'px';
  }

  showBoardScroller() {
    document.getElementById(this.boardScrollerId).style.opacity = '1';
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
        backgroundColor: 'var(--aha-gray-200)',
        border: '1px solid var(--aha-gray-400)',
        borderRadius: '4px',
        opacity: '0',
        transition: 'opacity 100ms ease',
      },
    });
  }

  createBoardScrollerInner() {
    return createElement('div', {
      id: this.boardScrollerId + 'Inner',
      styles: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        bottom: '5px',
        left: '5px',
        zIndex: '1001',
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        backgroundColor: 'var(--aha-gray-200)',
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
        width: '30px',
        height: '30px',
        zIndex: '1003',
        boxSizing: 'border-box',
        border: '2px solid var(--aha-blue-400)',
        borderRadius: '4px',
        cursor: 'grab',
      },
    });
  }

  createBoardScrollerColumns() {
    const columns = document.querySelectorAll('[class*="workflowGroupItems"] [class*="workflowColumn-"]');

    const columnMargin = Math.ceil(14 / this.workflowBoard.offsetWidth);

    let left = columnMargin;

    columns.forEach((column: HTMLElement) => {
      const cardContainer = column.querySelector('[class*="workflowCardContainer"]') as HTMLElement;
      const widthRatio = (column.offsetWidth - Math.ceil(column.offsetWidth * 0.1)) / this.workflowBoard.offsetWidth;
      const heightRatio = (cardContainer.offsetHeight - Math.ceil(cardContainer.offsetHeight * 0.05)) / this.workflowBoard.offsetHeight;

      const columnElement = createElement('div', {
        styles: {
          position: 'absolute',
          top: '2px',
          left: left + 'px',
          width: this.boardScrollerWidth * widthRatio + 'px',
          height: this.boardScrollerHeight * heightRatio + 'px',
          zIndex: '1002',
          boxSizing: 'border-box',
          backgroundColor: 'var(--aha-gray-400)',
          borderRadius: '2px',
        },
      });

      left += this.boardScrollerWidth * widthRatio + columnMargin;
      this.boardScrollerInner.appendChild(columnElement);
    });
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
