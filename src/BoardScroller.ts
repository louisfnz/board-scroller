import Draggabilly from 'draggabilly';
import debounce from 'lodash.debounce';
import { createElement } from './helpers';

export default class BoardScroller {
  initialLoad: boolean;

  mutationObserver?: MutationObserver;

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
  columnSizes?: string;

  boundSidebarListener: (e: Event) => void;
  boundResizeListener: (e: Event) => void;
  boundWorkflowBoardListener: (e: Event) => void;
  boundPageChangeListener: (e: Event) => void;

  constructor() {
    this.boardScrollerId = 'boardScroller';
    this.boardScrollerWidth = 160;
    this.isDragging = false;
    this.initialLoad = false;

    this.boundSidebarListener = this.sidebarListener.bind(this);
    this.boundResizeListener = this.resizeListener.bind(this);
    this.boundWorkflowBoardListener = this.workflowBoardListener.bind(this);
    this.boundPageChangeListener = this.pageChangeListener.bind(this);
  }

  initialize(): void {
    document.addEventListener('page:change', this.boundPageChangeListener);
  }

  pageChangeListener(): void {
    if (window.location.href.includes('workflow_boards')) {
      if (!this.mutationObserver) {
        this.mutationObserver = this.createObserver();
      }
      this.observeChanges();
    } else {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
    }
  }

  removeBoardScroller(): void {
    const existingScroller = document.getElementById(this.boardScrollerId);
    if (existingScroller) {
      existingScroller.remove();
    }
  }

  load(): void {
    this.removeBoardScroller();

    try {
      this.workflowBoardWrapper = document.querySelector('[class*="workflowBoardWrapper--"]') as HTMLElement;
      this.workflowBoard = document.querySelector('[class*="workflowBoard--"]') as HTMLElement;

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

      this.initialLoad = true;
    } catch (e) {
      console.log('Error loading board scroller');
      console.error(e);
    }
  }

  createObserver(): MutationObserver {
    const observer = debounce(() => {
      if (window.location.href.includes('workflow_boards')) {
        if (!this.initialLoad) {
          this.load();
          return;
        } else {
          const columnSizes = this.getColumnSizeString();
          if (columnSizes !== this.columnSizes) {
            this.columnSizes = columnSizes;
            this.load();
            return;
          }
        }
      } else {
        this.initialLoad = false;
      }
    }, 200);

    return new MutationObserver(observer);
  }

  observeChanges(): void {
    this.mutationObserver.observe(document, {
      childList: true,
      subtree: true,
    });
  }

  setScrollerDimensions(): void {
    const scrollerRatio = this.workflowBoard.offsetHeight / this.workflowBoard.offsetWidth;

    this.boardScrollerHeight = Math.ceil((this.boardScrollerWidth - 10) * (this.getBoardHeight() / this.workflowBoard.offsetWidth));

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

  sidebarListener(): void {
    setTimeout(() => this.load(), 50);
  }

  resizeListener(): void {
    this.setScrollerDimensions();
  }

  workflowBoardListener(): void {
    if (!this.isDragging) {
      this.setHandlePosition();
    }
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
      this.isDragging = true;
    });

    draggable.on('dragEnd', () => {
      this.isDragging = false;
    });

    document.querySelectorAll('.sidebar-layout__toggle-collapsed').forEach(element => element.addEventListener('click', this.boundSidebarListener));

    window.addEventListener('resize', this.boundResizeListener);

    this.workflowBoardWrapper.addEventListener('scroll', this.boundWorkflowBoardListener);

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
        zIndex: '890',
        boxSizing: 'border-box',
        backgroundColor: 'var(--theme-container-page-background)',
        border: '1px solid var(--theme-primary-border)',
        boxShadow: '0px 2px 5px rgb(0 0 0 / 20%)',
        borderRadius: '4px',
        opacity: '0',
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
    const columnHeaders = document.querySelectorAll('[class*="workflowColumnHeaders--"] [class*="columnHeader--"]') as NodeListOf<HTMLElement>;
    const workflowGroups = document.querySelectorAll('[class*="workflowGroupItems--"]') as NodeListOf<HTMLElement>;

    const boardHeight = this.getBoardHeight();

    let includeHeaders = true;
    let top = 0;

    workflowGroups.forEach(child => {
      let left = 4;
      const workflowGroup = child.parentElement;
      const columns = workflowGroup.querySelectorAll('[class*="workflowColumn--"]') as NodeListOf<HTMLElement>;

      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const columnHeader = columnHeaders[i];

        const cardContainer = column.querySelector('[class*="workflowCardContainer--"]') as HTMLElement;
        const widthRatio = column.offsetWidth / this.workflowBoard.offsetWidth;
        const heightRatio = cardContainer.offsetHeight / boardHeight;
        const headerHeightRatio = columnHeader.offsetHeight / boardHeight;

        let extraHeight = 0;

        if (includeHeaders) {
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
          extraHeight = columnHeaderElement.offsetHeight;
        }

        const columnElement = createElement('div', {
          styles: {
            position: 'absolute',
            top: top + Math.ceil(this.boardScrollerHeight * headerHeightRatio) + 5 + 'px',
            left: left + 'px',
            width: Math.ceil(this.boardScrollerWidth * widthRatio) - 2 + 'px',
            height: Math.ceil(this.boardScrollerHeight * heightRatio) - 2 - extraHeight + 'px',
            zIndex: '1002',
            boxSizing: 'border-box',
            backgroundColor: 'var(--WorkflowBoard--status-background-color)',
            borderRadius: '1px',
          },
        });
        this.boardScrollerInner.appendChild(columnElement);
        left += Math.ceil(this.boardScrollerWidth * widthRatio);
      }

      includeHeaders = false;
      top = top + this.boardScrollerHeight * (workflowGroup.offsetHeight / boardHeight);
    });
  }

  getBoardHeight() {
    return this.workflowBoard.offsetHeight > this.workflowBoardWrapper.offsetHeight ? this.workflowBoard.offsetHeight : this.workflowBoardWrapper.offsetHeight;
  }

  getColumnSizeString(): string {
    const columns = document.querySelectorAll('[class*="workflowGroupItems--"] [class*="workflowColumn--"]') as NodeListOf<HTMLElement>;
    const values = [];

    columns.forEach(column => {
      const { offsetWidth, offsetHeight } = column;
      values.push(`{${offsetWidth},${offsetHeight}}`);
    });

    return values.toString();
  }
}
