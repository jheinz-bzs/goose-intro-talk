import {Circle, Line, Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, createSignal, delay, easeInOutCubic, easeOutCubic} from '@canvas-commons/core';
import {C, Card, HEAD, Header, Svg, T, addDashes, enter, hide, leave, loadBrandFonts, rise} from './brand';
import {CODE_BG, CodeBlock, DASH_ROWS, FileName, SYN, Token, Why} from './gwebkit';

const CODE: Token[][] = [
  [['<script goose>', SYN.kw]],
  [['@state', SYN.kw], [' ', SYN.plain], ['var', SYN.kw], [' count: ', SYN.plain], ['i64', SYN.fn], [' = 0;', SYN.plain]],
  [['fn', SYN.kw], [' ', SYN.plain], ['inc', SYN.fn], ['() { count += 1; }', SYN.plain]],
  [['</script>', SYN.kw]],
  [['<button', SYN.kw], [' on:click=', SYN.plain], ['"inc"', SYN.str], ['>', SYN.kw], ['Clicked {count} times', SYN.plain], ['</button>', SYN.kw]],
];

function textWidth(text: string, size: number, weight: number) {
  const context = document.createElement('canvas').getContext('2d')!;
  context.font = `${weight} ${size}px Montserrat`;
  return context.measureText(text).width;
}

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const page = createRef<Node>();
  const blocks = createRefArray<Node>();
  const button = createRef<Node>();
  const tag = createRef<Node>();
  const chip = createRef<Rect>();
  const source = createRef<Node>();
  const branches = createRefArray<Line>();
  const outputs = createRefArray<Node>();
  const why = createRef<Node>();
  const aside = createRef<Node>();
  const code = createRef<Node>();
  const figure = createRef<Node>();
  const count = createSignal(3);

  // The button text is laid out from measured widths so the changing digit can sit in its own chip.
  const word = textWidth('Clicked', 28, 600);
  const times = textWidth('times', 28, 600);
  const digit = textWidth('3', 28, 600) + 24;
  const gap = 10;
  const startX = 350 - (word + gap + digit + gap + times) / 2;
  const chipX = startX + word + gap;
  const tagWidth = textWidth('← only the number updates', 24, 600) + 44;

  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="compact" eyebrow="Reactivity" title="Interactive Where It Counts" subtitle="Plain pages. A little JS, only where needed." />
      <Node ref={page}>
        <Card x={150} y={364} width={820} height={258} />
        <Circle x={187} y={387} size={14} fill={C.red} />
        <Circle x={213} y={387} size={14} fill="#8FA9E8" />
        <Circle x={239} y={387} size={14} fill={C.cyan} />
      </Node>
      {[408, 464].map(top => (
        <Node ref={blocks}>
          <Rect x={190} y={top} width={740} height={46} radius={12} fill="#3D5FA3" anchor={[-1, -1]} />
          <T text="plain HTML" x={560} y={top + 23} size={26} weight={500} lineHeight={32} color={C.subtitle} center />
        </Node>
      ))}
      <Node ref={button}>
        <Rect x={184} y={524} width={332} height={84} radius={22} fill={C.cyan} opacity={0.3} anchor={[-1, -1]} />
        <Rect x={190} y={530} width={320} height={72} radius={16} fill={C.cyan} anchor={[-1, -1]} />
        <Svg text="Clicked" x={startX} y={566 + 10} size={28} weight={600} color={C.ink} />
        <Rect ref={chip} x={chipX + digit / 2} y={566} width={digit} height={42} radius={8} fill={C.ink} />
        <Svg text={() => `${Math.round(count())}`} x={chipX + digit / 2} y={566 + 10} size={28} weight={600} align="middle" />
        <Svg text="times" x={chipX + digit + gap} y={566 + 10} size={28} weight={600} color={C.ink} />
      </Node>
      <Node ref={tag}>
        <Rect x={550} y={538} width={tagWidth} height={56} radius={28} fill={CODE_BG} anchor={[-1, -1]} />
        <Svg text="← only the number updates" x={572} y={566 + 9} size={24} weight={600} color={C.mint} />
      </Node>
      <Node ref={source}>
        <Rect x={1030} y={364} width={740} height={90} radius={16} fill="#3F64C8" anchor={[-1, -1]} />
        <T text="one component source" x={1400} y={409} size={32} weight={600} lineHeight={39} center />
      </Node>
      <Line ref={branches} points={[[1400, 454], [1400, 472], [1210, 472], [1210, 498]]} stroke={C.cyan} lineWidth={6} lineCap="round" lineJoin="round" end={0} opacity={0} />
      <Line ref={branches} points={[[1400, 472], [1590, 472], [1590, 498]]} stroke={C.cyan} lineWidth={6} lineCap="round" lineJoin="round" end={0} opacity={0} />
      <Node ref={outputs}>
        <Rect x={1030} y={500} width={350} height={122} radius={16} fill={CODE_BG} anchor={[-1, -1]} />
        <T text={'server:\nfirst render (HTML)'} x={1205} y={531} size={26} weight={600} lineHeight={30} center />
      </Node>
      <Node ref={outputs}>
        <Rect x={1420} y={500} width={350} height={122} radius={16} fill={C.cyan} anchor={[-1, -1]} />
        <T text={'browser:\nits own small JS'} x={1595} y={531} size={26} weight={600} lineHeight={30} color={C.ink} center />
      </Node>
      <Node ref={why}>
        <Why text="Compiled reactivity: only what changed updates. ~2 KB runtime." y={646} />
      </Node>
      <Node ref={aside}>
        <Card x={150} y={730} width={1620} height={282} />
        <FileName x={190} y={748} text="components/Counter.gshtml" />
      </Node>
      <Node ref={code}>
        <CodeBlock x={190} y={792} width={800} height={194} size={22} lineHeight={34} padX={26} padY={12} lines={CODE} />
      </Node>
      <Node ref={figure}>
        <Rect x={1060} y={792} width={670} height={194} radius={14} fill={CODE_BG} anchor={[-1, -1]} />
        <T text="~2 KB" x={1395} y={874} size={56} weight={800} font={HEAD} lineHeight={64} center />
        <T text="browser runtime, gzip" x={1395} y={921} size={24} lineHeight={29} color={C.subtitle} center />
      </Node>
    </Node>,
  );
  const dashes = addDashes(stage(), [{side: 'right', edge: 1950, top: 96, height: 14, gap: 10, rowGap: 12, firstDelayMs: 0, rows: DASH_ROWS}]);

  hide([...head, page(), ...blocks, button(), tag(), source(), ...outputs, why(), aside(), code(), figure()]);
  yield* enter(dashes, [...head]);
  yield* beginSlide('intro');

  yield* all(rise([page()]), delay(0.2, rise(blocks, 0.15, 0.4)));
  yield* beginSlide('page');

  yield* rise([button()]);
  yield* beginSlide('button');

  // Only the digit chip pulses and changes, which is the whole point of the slide.
  yield* all(
    chip().scale(1.3, 0.15, easeOutCubic).to(1, 0.25, easeInOutCubic),
    delay(0.15, count(4, 0.2, easeInOutCubic)),
    delay(0.2, rise([tag()], 0, 0.4)),
  );
  yield* beginSlide('tick');

  yield* all(
    ...branches.map(branch => all(branch.opacity(1, 0), branch.end(1, 0.5, easeInOutCubic))),
    rise([source()]),
    delay(0.35, rise(outputs, 0.15, 0.4)),
  );
  yield* beginSlide('split');

  yield* rise([why()]);
  yield* beginSlide('why');

  yield* all(rise([aside()]), delay(0.15, rise([code()])));
  yield* beginSlide('code');

  yield* rise([figure()]);
  yield* beginSlide('runtime');
  yield* leave(stage());
});
