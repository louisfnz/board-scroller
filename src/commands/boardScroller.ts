import BoardScroller from '../BoardScroller';

let currentUrl = window.location.href;

const loadBoardScroller = () => {
  if (currentUrl.includes('workflow_boards')) {
    new BoardScroller().load().then(() => console.log('Board scroller extension loaded'));
  }
};

// TODO: This is hacky, need a nicer way to know what page we're on
new MutationObserver(() => {
  const url = window.location.href;
  if (url !== currentUrl) {
    currentUrl = url;
    loadBoardScroller();
  }
}).observe(document, { subtree: true, childList: true });

loadBoardScroller();
