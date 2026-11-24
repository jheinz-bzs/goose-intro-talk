import {Circle, Line, Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, createSignal, delay, easeInOutCubic, easeOutCubic} from '@canvas-commons/core';
import {C, Card, Header, LegendItem, Svg, T, addDashes, enter, hide, leave, loadBrandFonts} from './brand';

const EXPRESS = '#8FA9E8';
const GRID = '#3D5FA3';
const AXIS = '#7F9AD1';
const MUTED = '#A9BEDF';
const XS = [60, 215, 370, 525, 680];
const BASE_Y = 250;
const PLOT_H = 240;
const BAR_X = 240;
const BAR_FULL = 220;

const LINES = [
  {key: 'flask', values: [2553, 2430, 2383, 2271, 2131], color: C.red, width: 5, dot: 5},
  {key: 'express', values: [27803, 59325, 59031, 55046, 48064], color: EXPRESS, width: 5, dot: 6},
  {key: 'goose', values: [50982, 168205, 178118, 171984, 166000], color: C.cyan, width: 6, dot: 7},
];

const SHOP = [
  {title: 'Req/s', next: 13600, goose: 223000, nextLabel: '13.6k', gooseLabel: '223k'},
  {title: 'Memory at rest', next: 105, goose: 2, nextLabel: '105 MB', gooseLabel: '2 MB'},
  {title: 'Startup', next: 267, goose: 6, nextLabel: '267 ms', gooseLabel: '6 ms'},
  {title: 'Deploy size', next: 375, goose: 0.4, nextLabel: '375 MB', gooseLabel: '0.4 MB'},
];

const STEP_IDS = ['pages', 'memory', 'startup', 'deploy'];

function format(value: number) {
  if (value >= 10000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return `${Math.round(value)}`;
}

/** Smallest even-quarter axis that holds 1.1 x the data, so tick labels read as round numbers. */
function axisMax(peak: number) {
  const raw = (peak * 1.1) / 4;
  const exponent = Math.floor(Math.log10(raw));
  const mantissa = raw / 10 ** exponent;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(m => m >= mantissa - 1e-9)!;
  return 4 * step * 10 ** exponent;
}

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const cards = createRefArray<Node>();
  const footer = createRef<Node>();

  const scale = createSignal(1000);
  // Clamped because the axis is still growing toward Flask's fit while its line draws in.
  const y = (value: number) => Math.max(BASE_Y - PLOT_H, BASE_Y - (PLOT_H * value) / scale());
  const lines = LINES.map(line => ({
    ...line,
    end: createSignal(0),
    label: createSignal(0),
    oldLabel: createSignal(0),
  }));
  const shop = SHOP.map((row, index) => ({
    ...row,
    index,
    group: createSignal(0),
    nextWidth: createSignal(0),
    gooseWidth: createSignal(0),
    nextShow: createSignal(0),
    gooseShow: createSignal(0),
  }));
  const labelColor = {flask: C.pink, express: C.subtitle, goose: C.white};
  const labelWeight = {flask: 600, express: 600, goose: 600};

  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="compact" eyebrow="The Experiment" title="So I Built a Web Server" subtitle="Fast language. Fast web server?" />
      <Node ref={cards}>
        <Card x={150} title="Todo API · req/s" />
        <LegendItem x={534} color={C.cyan} text="Goose" />
        <LegendItem x={659} color={EXPRESS} text="Express" />
        <LegendItem x={800} color={C.red} text="Flask" />
        <Node x={190} y={513}>
          {[10, 70, 130, 190].map(gridY => (
            <Line points={[[60, gridY], [680, gridY]]} stroke={GRID} lineWidth={1.5} />
          ))}
          <Line points={[[60, BASE_Y], [680, BASE_Y]]} stroke={AXIS} lineWidth={2} />
          {[0, 1, 2, 3, 4].map(tick => (
            <Svg text={() => (tick === 0 ? '0' : format((scale() * tick) / 4))} x={48} y={BASE_Y - tick * 60 + 6} size={18} color={MUTED} align="end" />
          ))}
          {['1', '16', '64', '256', '512'].map((text, index) => (
            <Svg text={text} x={XS[index]} y={280} size={18} color={MUTED} align="middle" />
          ))}
          <Svg text="clients" x={370} y={300} size={16} color={MUTED} align="middle" />
          {lines.map(line => (
            <Node>
              <Line
                points={() => line.values.map((value, i) => [XS[i], y(value)])}
                stroke={line.color}
                lineWidth={line.width}
                lineCap="round"
                lineJoin="round"
                end={line.end}
                opacity={() => (line.end() > 0 ? 1 : 0)}
              />
              {line.values.map((value, i) => (
                <Circle
                  x={XS[i]}
                  y={() => y(value)}
                  size={(i === 2 ? line.dot + 2 : line.dot) * 2}
                  fill={line.color}
                  opacity={() => (line.end() > 0 ? Math.min(1, Math.max(0, (line.end() * 4 - i) * 5 + 1)) : 0)}
                />
              ))}
            </Node>
          ))}
          {lines.map(line => (
            <Svg
              text={format(line.values[2])}
              x={370}
              y={() => y(line.values[2]) - 12}
              size={20}
              weight={line.key === 'goose' ? 600 : labelWeight[line.key as keyof typeof labelWeight]}
              color={labelColor[line.key as keyof typeof labelColor]}
              align="middle"
              opacity={line.label}
            />
          ))}
          <Svg text="2.6k" x={370} y={() => y(2383) - 12} size={20} weight={600} color={C.pink} align="middle" opacity={lines[0].oldLabel} />
        </Node>
      </Node>
      <Node ref={cards}>
        <Card x={990} title="Shop site" />
        <LegendItem x={1498} color={C.cyan} text="Goose" />
        <LegendItem x={1623} color={EXPRESS} text="Next.js" />
        <Node x={1030} y={513}>
          {shop.map(row => (
            <Node>
              {row.index < 3 ? <Line points={[[0, 65 + row.index * 75], [700, 65 + row.index * 75]]} stroke={GRID} lineWidth={1.5} opacity={row.group} /> : null}
              <Svg text={row.title} x={0} y={32 + row.index * 75} size={22} weight={600} opacity={row.group} />
              <Rect x={BAR_X} y={14 + row.index * 75} width={row.gooseWidth} height={18} radius={6} fill={C.cyan} anchor={[-1, -1]} />
              <Rect x={BAR_X} y={38 + row.index * 75} width={row.nextWidth} height={18} radius={6} fill={EXPRESS} anchor={[-1, -1]} />
              <Svg text={row.gooseLabel} x={() => BAR_X + row.gooseWidth() + 10} y={29 + row.index * 75} size={16} weight={600} color={C.cyan} opacity={row.gooseShow} />
              <Svg text={row.nextLabel} x={() => BAR_X + row.nextWidth() + 10} y={53 + row.index * 75} size={16} weight={600} color={C.subtitle} opacity={row.nextShow} />
            </Node>
          ))}
        </Node>
      </Node>
      <T ref={footer} text="One worker each, same machine." x={150} y={1016} size={20} lineHeight={24} color={MUTED} />
    </Node>,
  );
  const dashes = addDashes(stage(), [
    {
      side: 'right', edge: 1950, top: 96, height: 14, gap: 10, rowGap: 12, firstDelayMs: 0,
      rows: [
        [[90, 'c'], [60, 'd'], [110, 'b'], [40, 'r']],
        [[80, 'b'], [120, 'c'], [50, 'd']],
        [[46, 'c'], [120, 'd'], [70, 'b'], [100, 'c']],
      ],
    },
  ]);

  hide([...head, ...cards, footer()]);
  yield* enter(dashes, [...head, ...cards, footer()]);
  yield* beginSlide('intro');

  const [flask, express, goose] = lines;
  yield* all(scale(axisMax(2553), 0.6, easeInOutCubic), delay(0.2, flask.end(1, 0.7, easeInOutCubic)), delay(0.8, flask.oldLabel(1, 0.3)));
  yield* beginSlide('flask');

  yield* all(
    scale(axisMax(59325), 0.6, easeInOutCubic),
    express.end(1, 0.7, easeInOutCubic),
    flask.oldLabel(0, 0.3),
    flask.label(1, 0.3),
    delay(0.6, express.label(1, 0.3)),
  );
  yield* beginSlide('express');

  yield* all(scale(axisMax(178118), 0.6, easeInOutCubic), goose.end(1, 0.7, easeInOutCubic), delay(0.6, goose.label(1, 0.3)));
  yield* beginSlide('goose');

  for (const row of shop) {
    yield* all(row.group(1, 0.3), row.nextWidth(BAR_FULL, 0.5, easeOutCubic), delay(0.25, row.nextShow(1, 0.3)));
    yield* beginSlide(`${STEP_IDS[row.index]}-next`);
    // Goose only outgrows Next.js on pages per second; there Next.js rescales so Goose can end at full width.
    const motions = [row.gooseWidth(row.goose > row.next ? BAR_FULL : Math.max(6, (BAR_FULL * row.goose) / row.next), 0.5, easeOutCubic), delay(0.25, row.gooseShow(1, 0.3))];
    if (row.goose > row.next) motions.push(row.nextWidth((BAR_FULL * row.next) / row.goose, 0.6, easeInOutCubic));
    yield* all(...motions);
    yield* beginSlide(`${STEP_IDS[row.index]}-goose`);
  }
  yield* leave(stage());
});
