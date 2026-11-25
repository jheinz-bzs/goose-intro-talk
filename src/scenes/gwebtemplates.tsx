import {Circle, Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, delay, easeInOutCubic} from '@canvas-commons/core';
import {C, Card, Header, MONO, T, addDashes, enter, hide, leave, loadBrandFonts, rise} from './brand';
import {Arrow, CodeBlock, DASH_ROWS, FileName, SYN, Token, Why, makeArrowRefs} from './gwebkit';

const GOOSE_LINES: Token[][] = [
  [['struct', SYN.kw], [' Props { reply: state::Reply }', SYN.plain]],
  [['fn', SYN.kw], [' ', SYN.plain], ['load', SYN.fn], ['(req: ', SYN.plain], ['const', SYN.kw], [' http::Request&, ctx: gweb::Ctx&) -> Props {', SYN.plain]],
  [['    …', SYN.dim]],
  [['    ', SYN.plain], ['return', SYN.kw], [' Props { reply: reply };', SYN.plain]],
  [['}', SYN.plain]],
];

const HTML_LINES: Token[][] = [
  [['<h1>', SYN.kw], ['Notes', SYN.plain], ['</h1>', SYN.kw]],
  [['{#for', SYN.fn], [' n ', SYN.plain], ['in', SYN.fn], [' props.reply.notes', SYN.plain], ['}', SYN.fn]],
  [['<li>', SYN.kw], ['{n.text}', SYN.plain], ['</li>', SYN.kw]],
  [['{/for}', SYN.fn]],
];

const STEPS = ['find the page', 'load the data', 'fill the template'];

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const asks = createRef<Node>();
  const request = createRef<Node>();
  const binary = createRef<Node>();
  const steps = createRefArray<Node>();
  const reply = createRef<Node>();
  const answer = createRef<Node>();
  const why = createRef<Node>();
  const aside = createRef<Node>();
  const left = createRef<Node>();
  const right = createRef<Node>();
  const first = makeArrowRefs();
  const second = makeArrowRefs();

  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="compact" eyebrow="Under the Hood" title="How a Request Works" subtitle="One request, three steps." />
      <Node ref={asks}>
        <Rect x={150} y={394} width={220} height={202} radius={16} fill={C.panel} anchor={[-1, -1]} />
        <T text="Browser" x={260} y={477} size={32} weight={600} lineHeight={39} center />
        <T text="asks" x={260} y={514} size={26} weight={500} lineHeight={32} color="#A9BEDF" center />
      </Node>
      <Arrow x1={380} x2={650} y={495} shaft={first.shaft} head={first.head} />
      <Node ref={request} opacity={0}>
        <T text="GET /" x={515} y={437} size={26} font={MONO} lineHeight={32} color={C.mint} center />
      </Node>
      <Node ref={binary}>
        <Card x={660} y={364} width={620} height={262} />
        <T text="YOUR BINARY" x={700} y={386} size={26} weight={600} color={C.cyan} lineHeight={32} letterSpacing={3.12} />
      </Node>
      {STEPS.map((text, index) => (
        <Node ref={steps}>
          <Circle x={722} y={468 + index * 60} size={44} fill={C.cyan} />
          <T text={`${index + 1}`} x={722} y={468 + index * 60} size={26} weight={600} lineHeight={32} color={C.ink} center />
          <T text={text} x={764} y={450 + index * 60} size={30} weight={600} lineHeight={36} />
        </Node>
      ))}
      <Arrow x1={1290} x2={1560} y={495} shaft={second.shaft} head={second.head} />
      <Node ref={reply} opacity={0}>
        <T text="finished HTML" x={1425} y={429} size={26} weight={600} lineHeight={32} color={C.mint} center />
      </Node>
      <Node ref={answer}>
        <Rect x={1570} y={394} width={200} height={202} radius={16} fill={C.panel} anchor={[-1, -1]} />
        <T text="Browser" x={1670} y={477} size={32} weight={600} lineHeight={39} center />
        <T text="gets a page" x={1670} y={514} size={26} weight={500} lineHeight={32} color="#A9BEDF" center />
      </Node>
      <Node ref={why}>
        <Why text="Templates are compiled in. A typo fails the build, not the page." y={650} />
      </Node>
      <Node ref={aside}>
        <Card x={150} y={744} width={1620} height={276} />
      </Node>
      <Node ref={left}>
        <FileName x={190} y={762} text="app/page.goose" badge="2" />
        <CodeBlock x={190} y={806} width={900} height={198} size={22} lineHeight={34} padX={26} padY={12} lines={GOOSE_LINES} />
      </Node>
      <Node ref={right}>
        <FileName x={1130} y={762} text="app/page.html" badge="3" />
        <CodeBlock x={1130} y={806} width={600} height={198} size={22} lineHeight={34} padX={26} padY={12} lines={HTML_LINES} />
      </Node>
    </Node>,
  );
  const dashes = addDashes(stage(), [{side: 'right', edge: 1950, top: 96, height: 14, gap: 10, rowGap: 12, firstDelayMs: 0, rows: DASH_ROWS}]);

  hide([...head, asks(), binary(), ...steps, answer(), why(), aside(), left(), right()]);
  yield* enter(dashes, [...head]);
  yield* beginSlide('intro');

  // Zero-length round caps would show as dots, so each shaft stays hidden until it starts drawing.
  yield* all(rise([asks()]), delay(0.2, first.shaft().opacity(1, 0)), delay(0.2, first.shaft().end(1, 0.45, easeInOutCubic)), delay(0.55, first.head().opacity(1, 0.15)), delay(0.4, request().opacity(1, 0.3)));
  yield* beginSlide('ask');

  yield* all(rise([binary()]), delay(0.25, rise([steps[0]], 0, 0.4)));
  yield* beginSlide('find');

  yield* all(rise([steps[1]]), delay(0.2, rise([aside(), left()], 0.1, 0.4)));
  yield* beginSlide('load');

  yield* all(rise([steps[2]]), delay(0.2, rise([right()])));
  yield* beginSlide('fill');

  yield* all(second.shaft().opacity(1, 0), second.shaft().end(1, 0.45, easeInOutCubic), delay(0.35, second.head().opacity(1, 0.15)), delay(0.3, rise([answer()], 0, 0.4)), delay(0.3, reply().opacity(1, 0.3)));
  yield* beginSlide('answer');

  yield* rise([why()]);
  yield* beginSlide('why');
  yield* leave(stage());
});
