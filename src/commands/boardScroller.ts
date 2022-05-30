import BoardScroller from '../BoardScroller';

try {
  const bs = new BoardScroller();
  bs.initialize();
} catch (e) {
  console.log('Workflow board scroller could not initialize!');
}
