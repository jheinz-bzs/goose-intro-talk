import {Circle, Line, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, beginSlide, createRef, createRefArray, createSignal, delay, easeInOutCubic, easeOutCubic} from '@canvas-commons/core';
import {C, Card, Header, LegendItem, Svg, T, addDashes, enter, hide, leave, loadBrandFonts} from './brand';

const EXPRESS = '#8FA9E8';
const GRID = '#3D5FA3';
const AXIS = '#7F9AD1';
const MUTED = '#A9BEDF';
const XS = [60, 265, 470, 675, 880];
const BASE_Y = 340;
const PLOT_H = 330;
const TICK_STEP = PLOT_H / 4;
const FAIL_FULL = 360;

const LINES = [
  {key: 'flask', values: [2553, 2430, 2383, 2271, 2131], color: C.red, width: 5, dot: 5},
  {key: 'express', values: [27803, 59325, 59031, 55046, 48064], color: EXPRESS, width: 5, dot: 6},
  {key: 'goose', values: [50982, 168205, 178118, 171984, 166000], color: C.cyan, width: 6, dot: 7},
];

// Failure rates at 512 clients from goose-bench SUMMARY.md; ranges draw at their upper bound.
const FAILED = [
  {id: 'fail1-flask', name: 'Flask', color: C.red, percent: 65, label: '63–65%', text: C.pink},
  {id: 'fail2-express', name: 'Express', color: EXPRESS, percent: 34, label: '21–34%', text: C.subtitle},
  {id: 'fail3-goose', name: 'Goose', color: C.cyan, percent: 0, label: '0%', text: C.cyan},
];

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
  const failed = FAILED.map((row, index) => ({
    ...row,
    index,
    width: createSignal(0),
    group: createSignal(0),
    show: createSignal(0),
    value: createRef<Txt>(),
  }));
  const labelColor = {flask: C.pink, express: C.subtitle, goose: C.white};

  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="compact" eyebrow="The Experiment" title="So I Built a Web Server" subtitle="Fast language. Fast web server?" />
      <Node ref={cards}>
        <Card x={150} y={396} width={1000} height={570} title="Todo API · req/s" />
        <LegendItem x={754} y={456} color={C.cyan} text="Goose" />
        <LegendItem x={879} y={456} color={EXPRESS} text="Express" />
        <LegendItem x={1019} y={456} color={C.red} text="Flask" />
        <Node x={214} y={505}>
          {[1, 2, 3, 4].map(tick => (
            <Line points={[[60, BASE_Y - tick * TICK_STEP], [880, BASE_Y - tick * TICK_STEP]]} stroke={GRID} lineWidth={1.5} />
          ))}
          <Line points={[[60, BASE_Y], [880, BASE_Y]]} stroke={AXIS} lineWidth={2} />
          {[0, 1, 2, 3, 4].map(tick => (
            <Svg text={() => (tick === 0 ? '0' : format((scale() * tick) / 4))} x={48} y={BASE_Y - tick * TICK_STEP + 7} size={22} color={MUTED} align="end" />
          ))}
          {['1', '16', '64', '256', '512'].map((text, index) => (
            <Svg text={text} x={XS[index]} y={372} size={22} color={MUTED} align="middle" />
          ))}
          <Svg text="clients" x={470} y={400} size={22} color={MUTED} align="middle" />
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
              x={470}
              y={() => y(line.values[2]) - 14}
              size={24}
              weight={600}
              color={labelColor[line.key as keyof typeof labelColor]}
              align="middle"
              opacity={line.label}
            />
          ))}
          <Svg text="2.6k" x={470} y={() => y(2383) - 14} size={24} weight={600} color={C.pink} align="middle" opacity={lines[0].oldLabel} />
        </Node>
      </Node>
      <Node ref={cards}>
        <Card x={1190} y={396} width={580} height={570} />
        <T text={'FAILED REQUESTS\n512 CLIENTS'} x={1230} y={444} size={24} weight={600} color={C.cyan} lineHeight={32.4} letterSpacing={1.44} />
        {failed.map(row => (
          <Node>
            <Node opacity={row.group}>
              <T text={row.name} x={1230} y={540 + row.index * 130} size={26} weight={600} lineHeight={36} />
            </Node>
            <Rect x={1230} y={588 + row.index * 130} width={row.width} height={40} radius={10} fill={row.color} anchor={[-1, -1]} opacity={() => (row.width() > 0 ? 1 : 0)} />
            <Svg ref={row.value} text={row.label} x={() => 1230 + row.width() + 14} y={620 + row.index * 130} size={26} weight={600} color={row.text} opacity={row.show} />
          </Node>
        ))}
      </Node>
      <T ref={footer} text="One worker each, same machine." x={150} y={984} size={22} lineHeight={27} color={MUTED} />
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

  for (const row of failed) {
    const motions = [row.group(1, 0.3), row.width(Math.max(3, (FAIL_FULL * row.percent) / 100), 0.5, easeOutCubic), delay(0.25, row.show(1, 0.3))];
    // The empty bar is the payoff, so the 0% label pulses to make sure it is read.
    if (row.percent === 0) motions.push(delay(0.5, row.value().scale(1.35, 0.2, easeOutCubic).to(1, 0.35, easeInOutCubic)));
    yield* all(...motions);
    yield* beginSlide(row.id);
  }
  yield* leave(stage());
});
