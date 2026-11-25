import {Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, createSignal, delay, easeInOutCubic, easeOutCubic} from '@canvas-commons/core';
import {C, Card, Header, LegendItem, Svg, T, addDashes, enter, hide, leave, loadBrandFonts} from './brand';
import {DASH_ROWS} from './gwebkit';

const NEXT = '#8FA9E8';
const BASE_WIDTH = 140;
const MAX_WIDTH = 474;
const MIN_WIDTH = 6;

const TILES = [
  {id: 'pages', title: 'Req/s', next: 13600, goose: 223000, nextLabel: '13.6k', gooseLabel: '223k'},
  {id: 'memory', title: 'Memory at rest', next: 105, goose: 2, nextLabel: '105 MB', gooseLabel: '2 MB'},
  {id: 'startup', title: 'Startup', next: 267, goose: 6, nextLabel: '267 ms', gooseLabel: '6 ms'},
  {id: 'deploy', title: 'Deploy size', next: 375, goose: 0.4, nextLabel: '375 MB', gooseLabel: '0.4 MB'},
];

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const cards = createRefArray<Node>();
  const footer = createRef<Node>();

  const tiles = TILES.map((tile, index) => ({
    ...tile,
    x: 150 + (index % 2) * 830,
    y: 396 + Math.floor(index / 2) * 290,
    nextWidth: createSignal(0),
    gooseWidth: createSignal(0),
    nextShow: createSignal(0),
    gooseShow: createSignal(0),
  }));

  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="compact" eyebrow="The Payoff" title="gweb vs Next.js" subtitle="Same shop. Same machine." />
      <Node ref={cards}>
        <LegendItem x={1544} y={346} color={C.cyan} text="gweb" />
        <LegendItem x={1663} y={346} color={NEXT} text="Next.js" />
      </Node>
      {tiles.map(tile => (
        <Node ref={cards}>
          <Card x={tile.x} y={tile.y} width={790} height={260} />
          <T text={tile.title} x={tile.x + 40} y={tile.y + 28} size={28} weight={600} lineHeight={36} />
          <Rect x={tile.x + 40} y={tile.y + 92} width={tile.gooseWidth} height={40} radius={10} fill={C.cyan} anchor={[-1, -1]} />
          <Rect x={tile.x + 40} y={tile.y + 160} width={tile.nextWidth} height={40} radius={10} fill={NEXT} anchor={[-1, -1]} />
          <Svg text={tile.gooseLabel} x={() => tile.x + 40 + tile.gooseWidth() + 16} y={tile.y + 120} size={26} weight={600} color={C.cyan} opacity={tile.gooseShow} />
          <Svg text={tile.nextLabel} x={() => tile.x + 40 + tile.nextWidth() + 16} y={tile.y + 188} size={26} weight={600} color={C.subtitle} opacity={tile.nextShow} />
        </Node>
      ))}
      <T ref={footer} text="One worker each." x={150} y={984} size={22} lineHeight={27} color="#A9BEDF" />
    </Node>,
  );
  const dashes = addDashes(stage(), [{side: 'right', edge: 1950, top: 96, height: 14, gap: 10, rowGap: 12, firstDelayMs: 0, rows: DASH_ROWS}]);

  hide([...head, ...cards, footer()]);
  yield* enter(dashes, [...head, ...cards, footer()]);
  yield* beginSlide('intro');

  for (const tile of tiles) {
    yield* all(tile.nextWidth(BASE_WIDTH, 0.5, easeOutCubic), delay(0.25, tile.nextShow(1, 0.3)));
    yield* beginSlide(`${tile.id}-next`);

    // The scale re-fits so the larger value is always the full bar: the smaller one shrinks or grows, and nothing leaves the tile.
    const gooseBigger = tile.goose > tile.next;
    const nextFit = gooseBigger ? Math.max(MIN_WIDTH, (MAX_WIDTH * tile.next) / tile.goose) : MAX_WIDTH;
    const gooseFit = gooseBigger ? MAX_WIDTH : Math.max(MIN_WIDTH, (MAX_WIDTH * tile.goose) / tile.next);
    yield* all(
      tile.nextWidth(nextFit, 0.7, easeInOutCubic),
      tile.gooseWidth(gooseFit, 0.7, easeInOutCubic),
      delay(0.25, tile.gooseShow(1, 0.3)),
    );
    yield* beginSlide(`${tile.id}-goose`);
  }
  yield* leave(stage());
});
