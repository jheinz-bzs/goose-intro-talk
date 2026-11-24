import {Circle, Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, delay, easeInOutCubic, easeInOutSine, easeOutCubic, map, tween} from '@canvas-commons/core';
import {C, HEAD, Header, Panel, T, addDashes, contentDashes, enter, hide, leave, loadBrandFonts, rise} from './brand';

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BITS = [C.code, C.code, C.code, C.code, C.code, C.cyan, C.cyan, C.cyan, '#3F64C8', '#3F64C8', '#3F64C8', C.red, C.red];

/** Flash ring plus a seeded particle burst, so the prerender is deterministic. */
function* burst(parent: Node, [cx, cy]: [number, number]) {
  const random = seeded(7);
  const ring = createRef<Circle>();
  parent.add(<Circle ref={ring} x={cx} y={cy} size={60} stroke={C.cyan} lineWidth={6} opacity={0.9} />);
  const count = 18;
  const bits = Array.from({length: count}, (_, i) => {
    const angle = ((i + random() * 0.8) / count) * Math.PI * 2;
    const speed = 500 + random() * 700;
    const node = createRef<Rect>();
    const w = 10 + random() * 14;
    parent.add(<Rect ref={node} x={cx} y={cy} width={w} height={w * (0.6 + random() * 0.5)} radius={4} fill={BITS[Math.floor(random() * BITS.length)]} />);
    return {node, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, spin: (random() - 0.5) * 900};
  });
  const DURATION = 0.6;
  const DRAG = 5;
  const GRAVITY = 700;
  yield* tween(DURATION, value => {
    const time = value * DURATION;
    const travel = (1 - Math.exp(-DRAG * time)) / DRAG;
    for (const bit of bits) {
      bit.node().position([cx + bit.vx * travel, cy + bit.vy * travel + 0.5 * GRAVITY * time * time]).rotation(bit.spin * time);
      bit.node().scale(1 - value * 0.8).opacity(1 - easeOutCubic(Math.max(0, (value - 0.4) / 0.6)));
    }
    ring().size(map(60, 300, easeOutCubic(Math.min(1, value / 0.4)))).opacity(0.9 * Math.max(0, 1 - value / 0.4));
  });
  for (const bit of bits) bit.node().remove();
  ring().remove();
}

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const panels = createRefArray<Node>();
  const noHeap = createRef<Node>();
  const stackChip = createRef<Rect>();
  const heapChip = createRef<Rect>();
  const stackLabel = createRef<Node>();
  const stacksLabel = createRef<Node>();
  const heapLabel = createRef<Node>();
  const oldCaption = createRef<Node>();
  const newCaption = createRef<Node>();
  const label = (text: string, x: number, color = C.white, y = 667.8) => (
    <T text={text} x={x} y={y} size={36} weight={600} lineHeight={44} color={color} center />
  );
  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} eyebrow="Memory" title="Where Memory Lives" subtitle="Most languages use a stack and a heap. Goose only uses stacks." />
      <Node ref={panels}>
        <Panel x={150} y={462.8} width={778} height={413} />
        <T text="Most languages" x={202} y={506.8} size={44} weight={700} font={HEAD} lineHeight={65} />
        <Panel x={202} y={607.8} width={325} height={120} fill={C.code} />
        <Panel x={551} y={607.8} width={325} height={120} fill={C.code} />
        {label('Stack', 364.5)}
        {label('Heap', 713.5)}
        <T text={'The heap needs a garbage collector, or you free\nit by hand.'} x={202} y={763.8} size={28} lineHeight={34} color={C.subtitle} />
      </Node>
      <Node ref={panels}>
        <Panel x={992} y={462.8} width={778} height={413} />
        <T text="Goose" x={1044} y={506.8} size={44} weight={700} font={HEAD} lineHeight={65} color={C.cyan} />
        <Rect ref={stackChip} x={1206.5} y={667.8} width={325} height={120} radius={12} fill={C.code} />
        <Node ref={noHeap} opacity={0} scale={0.96} x={1554} y={667.8}>
          <Rect x={-162.5} y={-58.5} width={325} height={117} anchor={[-1, -1]} radius={10.5} stroke={C.red} lineWidth={3} lineDash={[8, 5]} />
          {label('No heap', 0, C.pink, 0)}
        </Node>
        <Rect ref={heapChip} x={1555.5} y={667.8} width={325} height={120} radius={12} fill={C.code} />
        <Node ref={stackLabel}>{label('Stack', 1206.5)}</Node>
        <Node ref={stacksLabel} opacity={0}>{label('Stacks', 1206.5, C.ink)}</Node>
        <Node ref={heapLabel} x={1555.5} y={667.8}>{label('Heap', 0, C.white, 0)}</Node>
        <Node ref={oldCaption}>
          <T text={'The heap needs a garbage collector, or you free\nit by hand.'} x={1044} y={763.8} size={28} lineHeight={34} color={C.subtitle} />
        </Node>
        <Node ref={newCaption} opacity={0}>
          <T text={'Memory is handed out in order and given back\nwhen a block ends.'} x={1044} y={763.8} size={28} lineHeight={34} color={C.subtitle} />
        </Node>
      </Node>
    </Node>,
  );
  const dashes = addDashes(stage(), [
    contentDashes([
      [[60, 'd'], [140, 'c'], [80, 'b'], [36, 'c'], [120, 'd']],
      [[100, 'b'], [50, 'r'], [150, 'c']],
      [[130, 'c'], [40, 'd'], [90, 'b'], [60, 'c'], [70, 'b']],
      [[80, 'b'], [110, 'd'], [40, 'c'], [90, 'c']],
      [[150, 'c'], [36, 'r'], [100, 'b'], [70, 'd']],
    ]),
  ]);
  hide([...head, ...panels]);
  yield* enter(dashes, [...head, panels[0]]);
  yield* beginSlide('typical');
  yield* rise([panels[1]]);
  yield* beginSlide('goose');
  yield* all(
    stackChip().fill(C.cyan, 0.5, easeInOutCubic),
    stackLabel().opacity(0, 0.5, easeInOutCubic),
    stacksLabel().opacity(1, 0.5, easeInOutCubic),
  );
  yield* beginSlide('stacks');

  const popAt: [number, number] = [1555.5, 667.8];
  const inflate = 0.7;
  const wobble = 0.15;
  yield* tween(inflate, value => {
    const t = easeInOutSine(Math.pow(value, 1.25));
    const shake = Math.max(0, (value * inflate - (inflate - wobble)) / wobble);
    const jitter = shake * Math.sin(value * inflate * 90);
    const w = map(325, 325 * 1.25, t) + jitter * 5;
    const h = map(120, 120 * 1.45, t) - jitter * 5;
    heapChip().size([w, h]).radius(Math.min(w, h) / 2 * t + 12 * (1 - t)).rotation(jitter * 1.5);
    heapLabel().scale(map(1, 1.2, t)).rotation(jitter * 1.5);
  });

  heapChip().opacity(0);
  heapLabel().opacity(0);
  yield* all(burst(stage(), popAt),
    delay(0.15, all(noHeap().opacity(1, 0.45, easeOutCubic), noHeap().scale(1, 0.45, easeOutCubic))),
    delay(0.35, all(oldCaption().opacity(0, 0.4, easeInOutCubic), newCaption().opacity(1, 0.4, easeInOutCubic))));

  yield* beginSlide('pop');
  yield* leave(stage());
});
