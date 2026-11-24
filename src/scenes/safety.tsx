import {Node, makeScene2D} from '@canvas-commons/2d';
import {beginSlide, createRef, createRefArray} from '@canvas-commons/core';
import {C, HEAD, Header, T, addDashes, contentDashes, enter, hide, leave, loadBrandFonts, rise} from './brand';

const ITEMS = [
  {column: 0, row: 0, title: 'No null surprises', body: 'If a value can be missing, you have to check it.'},
  {column: 1, row: 0, title: 'No out-of-bounds reads', body: 'Every array access is checked.'},
  {column: 0, row: 1, title: 'No dangling references', body: "A reference can't outlive the data it points to."},
  {column: 1, row: 1, title: 'No data races', body: "Threads don't share memory. They pass messages."},
];

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const rows = [createRefArray<Node>(), createRefArray<Node>()];
  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} eyebrow="Safety" title="Safe by Default" subtitle="The compiler catches these before your program ever runs." />
      {ITEMS.map(item => (
        <Node ref={rows[item.row]}>
          <T text={item.title} x={150 + item.column * 858} y={478.8 + item.row * 181} size={44} weight={700} font={HEAD} lineHeight={65} />
          <T text={item.body} x={150 + item.column * 858} y={553.8 + item.row * 181} size={30} lineHeight={42} color={C.subtitle} />
        </Node>
      ))}
    </Node>,
  );
  const dashes = addDashes(stage(), [
    contentDashes([
      [[150, 'c'], [70, 'b'], [100, 'r'], [30, 'd'], [60, 'b'], [80, 'd']],
      [[90, 'b'], [40, 'd'], [130, 'c'], [50, 'b']],
      [[70, 'd'], [50, 'c'], [36, 'b'], [110, 'c'], [60, 'd'], [80, 'b']],
      [[100, 'c'], [36, 'r'], [60, 'c'], [130, 'b']],
      [[130, 'b'], [110, 'c'], [70, 'b'], [40, 'c'], [100, 'd']],
    ]),
  ]);
  hide([...head, ...rows[0], ...rows[1]]);
  yield* enter(dashes, [...head, ...rows[0]]);
  yield* beginSlide('top');
  yield* rise(rows[1]);
  yield* beginSlide('bottom');
  yield* leave(stage());
});
