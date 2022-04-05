import BoardScroller from '../BoardScroller';

let currentUrl = window.location.href;

const loadBoardScroller = () => {
  console.log('loadBoardScroller');
  if (currentUrl.includes('workflow_boards')) {
    new BoardScroller().load().then(() => console.log('Board scroller extension loaded'));
  }
};

new MutationObserver(() => {
  const url = window.location.href;
  if (url !== currentUrl) {
    currentUrl = url;
    console.log('observer', currentUrl, url);
    loadBoardScroller();
  }
}).observe(document, { subtree: true, childList: true });

loadBoardScroller();
