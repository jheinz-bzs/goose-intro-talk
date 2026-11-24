import {Node, makeScene2D} from '@canvas-commons/2d';
import {beginSlide, createRef, createRefArray} from '@canvas-commons/core';
import {Arrow, C, HEAD, Header, MONO, Panel, T, addDashes, contentDashes, enter, hide, leave, loadBrandFonts, rise} from './brand';

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const steps = createRefArray<Node>();
  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} eyebrow="The Big Picture" title="From Source to Program" subtitle={'Goose turns your code into a single C file. A C compiler does the\nrest.'} />
      <Node ref={steps}>
        <Panel x={150} y={547.8} width={440} height={220} />
        <T text="app.goose" x={250.78} y={611.3} size={44} font={MONO} lineHeight={51} />
        <T text="your code" x={305.59} y={672.3} size={26} lineHeight={32} color={C.subtitle} />
      </Node>
      <Node ref={steps}>
        <Arrow x={590} y={637.8} />
        <Panel x={740} y={547.8} width={440} height={220} />
        <T text="app.c" x={893.77} y={611.3} size={44} font={MONO} lineHeight={51} />
        <T text="one C file" x={899.89} y={672.3} size={26} lineHeight={32} color={C.subtitle} />
      </Node>
      <Node ref={steps}>
        <Arrow x={1180} y={637.8} />
        <Panel x={1330} y={547.8} width={440} height={220} fill={C.cyan} />
        <T text="Your program" x={1384.14} y={602.3} size={46} weight={700} font={HEAD} lineHeight={69} color={C.ink} />
        <T text="native, fast" x={1478.77} y={681.3} size={26} weight={500} lineHeight={32} color={C.ink} />
      </Node>
    </Node>,
  );
  const dashes = addDashes(stage(), [
    contentDashes([
      [[130, 'b'], [40, 'd'], [160, 'c'], [60, 'b'], [90, 'd']],
      [[70, 'c'], [110, 'r'], [36, 'd'], [120, 'b']],
      [[90, 'd'], [140, 'c'], [50, 'b'], [80, 'c']],
      [[60, 'b'], [30, 'c'], [150, 'd'], [100, 'c'], [44, 'r']],
      [[170, 'c'], [80, 'b'], [120, 'd']],
    ]),
  ]);
  hide([...head, ...steps]);
  yield* enter(dashes, [...head, steps[0]]);
  yield* beginSlide('source');
  yield* rise([steps[1]]);
  yield* beginSlide('c');
  yield* rise([steps[2]]);
  yield* beginSlide('program');
  yield* leave(stage());
});
