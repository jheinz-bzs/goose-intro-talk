import {Line, Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, delay, easeInOutCubic} from '@canvas-commons/core';
import {C, Card, Header, MONO, T, addDashes, enter, hide, leave, loadBrandFonts, rise} from './brand';
import {Arrow, CODE_BG, DASH_ROWS, Why, makeArrowRefs, FileName} from './gwebkit';

const ROUTES = [
  ['app/page.html', '/'],
  ['app/blog/[id]/page.html', '/blog/7'],
  ['app/api/time/route.goose', '/api/time'],
];

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const write = createRef<Node>();
  const build = createRef<Node>();
  const ship = createRef<Node>();
  const first = makeArrowRefs();
  const second = makeArrowRefs();
  const why = createRef<Node>();
  const routes = createRef<Node>();

  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="compact" eyebrow="The Framework" title="Meet gweb" subtitle="Like Next.js, for Goose." />
      <Node ref={write}>
        <Card x={150} y={364} width={480} height={270} />
        <T text="YOU WRITE" x={190} y={390} size={26} weight={600} color={C.cyan} lineHeight={32} letterSpacing={3.12} />
        <Rect x={190} y={436} width={400} height={72} radius={16} fill={CODE_BG} anchor={[-1, -1]} />
        <T text="pages · HTML" x={390} y={472} size={30} weight={600} lineHeight={36} center />
        <Rect x={190} y={522} width={400} height={72} radius={16} fill={CODE_BG} anchor={[-1, -1]} />
        <T text="data · Goose" x={390} y={558} size={30} weight={600} lineHeight={36} center />
      </Node>
      <Arrow x1={630} x2={720} y={499} shaft={first.shaft} head={first.head} />
      <Node ref={build}>
        <Card x={720} y={364} width={480} height={270} />
        <T text="GWEB BUILDS" x={760} y={390} size={26} weight={600} color={C.cyan} lineHeight={32} letterSpacing={3.12} />
        <Rect x={790} y={432} width={110} height={46} radius={12} fill="#3F64C8" anchor={[-1, -1]} />
        <Rect x={790} y={520} width={110} height={46} radius={12} fill="#8FA9E8" anchor={[-1, -1]} />
        <Line points={[[905, 455], [960, 455], [980, 499]]} stroke={C.cyan} lineWidth={6} lineCap="round" lineJoin="round" radius={30} />
        <Line points={[[905, 543], [960, 543], [980, 499]]} stroke={C.cyan} lineWidth={6} lineCap="round" lineJoin="round" radius={30} />
        <Rect x={985} y={462} width={110} height={74} radius={14} fill={C.cyan} anchor={[-1, -1]} />
        <T text="everything compiles together" x={960} y={602} size={24} weight={600} lineHeight={29} color={C.subtitle} center />
      </Node>
      <Arrow x1={1200} x2={1290} y={499} shaft={second.shaft} head={second.head} />
      <Node ref={ship}>
        <Card x={1290} y={364} width={480} height={270} />
        <T text="YOU SHIP" x={1330} y={390} size={26} weight={600} color={C.cyan} lineHeight={32} letterSpacing={3.12} />
        <Rect x={1330} y={436} width={400} height={126} radius={16} fill={C.cyan} anchor={[-1, -1]} />
        <T text="one native binary" x={1530} y={499} size={34} weight={600} lineHeight={41} color={C.ink} center />
      </Node>
      <Node ref={why}>
        <Why text="No runtime, no node_modules. Copy one file and run it." y={654} />
      </Node>
      <Node ref={routes}>
        <Card x={150} y={744} width={1620} height={240} />
        <FileName x={190} y={762} text="app/ folders → URLs" />
        <Rect x={190} y={808} width={1540} height={150} radius={14} fill={CODE_BG} anchor={[-1, -1]} />
        {ROUTES.map(([path, url], index) => (
          <Node>
            <T text={path} x={216} y={820 + index * 36} size={22} font={MONO} lineHeight={36} />
            <T text="→" x={700} y={820 + index * 36} size={22} lineHeight={36} color={C.cyan} />
            <T text={url} x={760} y={820 + index * 36} size={22} font={MONO} lineHeight={36} color={C.mint} />
          </Node>
        ))}
      </Node>
    </Node>,
  );
  const dashes = addDashes(stage(), [{side: 'right', edge: 1950, top: 96, height: 14, gap: 10, rowGap: 12, firstDelayMs: 0, rows: DASH_ROWS}]);

  hide([...head, write(), build(), ship(), why(), routes()]);
  yield* enter(dashes, [...head]);
  yield* beginSlide('intro');

  yield* rise([write()]);
  yield* beginSlide('write');

  // Zero-length round caps would show as dots, so each shaft stays hidden until it starts drawing.
  yield* all(first.shaft().opacity(1, 0), first.shaft().end(1, 0.45, easeInOutCubic), delay(0.35, first.head().opacity(1, 0.15)), delay(0.3, rise([build()], 0, 0.4)));
  yield* beginSlide('build');

  yield* all(second.shaft().opacity(1, 0), second.shaft().end(1, 0.45, easeInOutCubic), delay(0.35, second.head().opacity(1, 0.15)), delay(0.3, rise([ship()], 0, 0.4)));
  yield* beginSlide('ship');

  yield* rise([why()]);
  yield* beginSlide('why');

  yield* rise([routes()]);
  yield* beginSlide('routes');
  yield* leave(stage());
});
