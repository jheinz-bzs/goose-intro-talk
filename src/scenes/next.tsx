import {Node, makeScene2D} from '@canvas-commons/2d';
import {beginSlide, createRef, createRefArray} from '@canvas-commons/core';
import {C, Header, addDashes, enter, hide, loadBrandFonts} from './brand';

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} kind="next" eyebrow="Up Next" title="[NEXT SECTION TITLE]" subtitle="Compiles to C. Stacks, not a heap. Checked before it runs." />
    </Node>,
  );
  const dashes = addDashes(stage(), [
    {
      side: 'right', edge: 1960, top: 120, height: 18, gap: 14, rowGap: 18, firstDelayMs: 0,
      rows: [
        [[90, 'd'], [190, 'c'], [70, 'b'], [130, 'd']],
        [[150, 'b'], [46, 'r'], [110, 'c'], [60, 'b'], [120, 'd']],
        [[120, 'c'], [80, 'b'], [170, 'c']],
        [[60, 'b'], [140, 'd'], [46, 'c'], [160, 'b'], [50, 'r']],
        [[200, 'c'], [100, 'b'], [130, 'd']],
      ],
    },
    {
      side: 'left', edge: -40, top: 906, height: 18, gap: 14, rowGap: 18, firstDelayMs: 300,
      rows: [
        [[160, 'b'], [220, 'c'], [70, 'd']],
        [[120, 'c'], [90, 'r'], [150, 'b'], [50, 'c']],
      ],
    },
  ]);
  hide(head);
  yield* enter(dashes, head);
  yield* beginSlide('intro');
});
