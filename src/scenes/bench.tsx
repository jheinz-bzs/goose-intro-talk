import {Line, Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, createSignal, delay, easeInOutCubic, easeOutCubic} from '@canvas-commons/core';
import {C, Card, Header, LegendItem, Svg, T, addDashes, enter, hide, leave, loadBrandFonts} from './brand';

const SPEED = C.cyan;
const MEMORY = '#8FA9E8';
const GRID = '#3D5FA3';
const AXIS = '#7F9AD1';
const MUTED = '#A9BEDF';
const BAR_X = 170;
const UNIT = 110;
const INSIDE_MIN = 160;

const ADVANTAGE = [
  {name: 'Everyday', sub: 'C++', speed: 3.54, memory: 1.95, y: 38},
  {name: 'Expert', sub: 'C++', speed: 1.26, memory: 1.32, y: 124},
  {name: 'Safe', sub: 'Rust', speed: 1.19, memory: 1.25, y: 210},
];

const RECORDS = [
  {key: 'goose', name: 'Goose', sub: '', value: 149, y: 30, nameY: 56, fill: SPEED, outside: SPEED, opacity: 1},
  {key: 'rust', name: 'Rust', sub: '', value: 593, y: 94, nameY: 120, fill: C.red, outside: C.pink, opacity: 1},
  {key: 'expert', name: 'Expert', sub: 'C++', value: 557, y: 158, nameY: 172, fill: MEMORY, outside: C.subtitle, opacity: 1},
  {key: 'everyday', name: 'Everyday', sub: 'C++', value: 713, y: 222, nameY: 236, fill: MEMORY, outside: C.subtitle, opacity: 0.6},
];

const REVEAL_ORDER = ['everyday', 'expert', 'rust', 'goose'];

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const cards = createRefArray<Node>();
  const footer = createRef<Node>();

  const advantage = ADVANTAGE.flatMap(row => [
    {row, kind: 'speed', value: row.speed, y: row.y, fill: SPEED, text: C.cyan, width: createSignal(0), show: createSignal(0)},
    {row, kind: 'memory', value: row.memory, y: row.y + 30, fill: MEMORY, text: C.subtitle, width: createSignal(0), show: createSignal(0)},
  ]);
  const records = RECORDS.map(record => ({
    ...record,
    width: createSignal(0),
    show: createSignal(0),
    rowOpacity: createSignal(0),
    inside: createSignal(0),
  }));

  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="compact" eyebrow="Benchmarks" title="Fast and Lean" subtitle="Goose against C++ and Rust." />
      <Node ref={cards}>
        <Card x={150} title="Goose advantage" />
        <LegendItem x={638} color={SPEED} text="Speed" />
        <LegendItem x={764} color={MEMORY} text="Memory" />
        <Node x={190} y={513}>
          {[410, 520, 630].map(x => (
            <Line points={[[x, 14], [x, 270]]} stroke={GRID} lineWidth={1.5} />
          ))}
          <Line points={[[190, 14], [190, 270]]} stroke={AXIS} lineWidth={2} />
          <Line points={[[300, 14], [300, 270]]} stroke="#FFFFFF" lineWidth={2} lineDash={[6, 6]} opacity={0.7} />
          {['0', '1×', '2×', '3×', '4×'].map((text, index) => (
            <Svg text={text} x={190 + index * 110} y={294} size={18} color={MUTED} align="middle" />
          ))}
          {ADVANTAGE.map(row => (
            <Node>
              <Svg text={row.name} x={0} y={row.y + 19} size={24} weight={600} />
              <Svg text={row.sub} x={0} y={row.y + 45} size={20} weight={500} color={MUTED} />
            </Node>
          ))}
          {advantage.map(bar => (
            <Node>
              <Rect x={190} y={bar.y} width={bar.width} height={26} radius={8} fill={bar.fill} anchor={[-1, -1]} />
              <Svg text={`${bar.value.toFixed(2)}×`} x={() => 190 + bar.width() + 12} y={bar.y + 20} size={20} weight={600} color={bar.text} opacity={bar.show} />
            </Node>
          ))}
        </Node>
      </Node>
      <Node ref={cards}>
        <Card x={990} title="Memory · 16M records" />
        <Node x={1030} y={513}>
          <Line points={[[BAR_X, 14], [BAR_X, 270]]} stroke={AXIS} lineWidth={2} />
          {records.map(record => (
            <Node opacity={record.rowOpacity}>
              <Svg text={record.name} x={0} y={record.nameY} size={24} weight={600} />
              {record.sub ? <Svg text={record.sub} x={0} y={record.nameY + 24} size={20} weight={500} color={MUTED} /> : null}
            </Node>
          ))}
          {records.map(record => (
            <Node>
              <Rect x={BAR_X} y={record.y} width={record.width} height={34} radius={8} fill={record.fill} opacity={() => record.opacity * record.rowOpacity()} anchor={[-1, -1]} />
              <Svg text={`${record.value} MB`} x={() => BAR_X + record.width() - 12} y={record.y + 25} size={22} weight={600} color={C.ink} align="end" opacity={() => record.show() * record.inside()} />
              <Svg text={`${record.value} MB`} x={() => BAR_X + record.width() + 13} y={record.y + 25} size={22} weight={600} color={record.outside} opacity={() => record.show() * (1 - record.inside())} />
            </Node>
          ))}
        </Node>
      </Node>
      <T ref={footer} text="Source: aardappel.github.io/goose/bench" x={150} y={1016} size={20} lineHeight={24} color={MUTED} />
    </Node>,
  );
  const dashes = addDashes(stage(), [
    {
      side: 'right', edge: 1950, top: 96, height: 14, gap: 10, rowGap: 12, firstDelayMs: 0,
      rows: [
        [[130, 'c'], [60, 'd'], [110, 'b'], [40, 'r']],
        [[80, 'b'], [150, 'c'], [50, 'd']],
        [[46, 'c'], [120, 'd'], [70, 'b'], [100, 'c']],
      ],
    },
  ]);

  hide([...head, ...cards, footer()]);
  yield* enter(dashes, [...head, ...cards, footer()]);
  yield* all(
    ...advantage.map((bar, index) => {
      const stagger = Math.floor(index / 2) * 0.15 + (index % 2) * 0.05;
      return delay(stagger, all(bar.width(bar.value * UNIT, 0.5, easeOutCubic), delay(0.3, bar.show(1, 0.3))));
    }),
  );
  yield* beginSlide('intro');

  const visible = new Set<string>();
  for (const key of REVEAL_ORDER) {
    visible.add(key);
    const min = Math.min(...records.filter(r => visible.has(r.key)).map(r => r.value));
    const pxPerMb = UNIT / min;
    const motions = [];
    for (const record of records.filter(r => visible.has(r.key))) {
      const target = record.value * pxPerMb;
      const side = target > INSIDE_MIN ? 1 : 0;
      if (record.key === key) {
        record.inside(side);
        motions.push(record.width(target, 0.5, easeOutCubic), record.rowOpacity(1, 0.3), delay(0.25, record.show(1, 0.3)));
      } else {
        motions.push(record.width(target, 0.6, easeInOutCubic));
        // Flips late so the label is already near its final spot when it crosses over.
        if (side !== record.inside()) motions.push(delay(0.2, record.inside(side, 0.3, easeInOutCubic)));
      }
    }
    yield* all(...motions);
    yield* beginSlide(key);
  }
  yield* leave(stage());
});
