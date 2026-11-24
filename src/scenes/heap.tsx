import {Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {beginSlide, createRef, createRefArray} from '@canvas-commons/core';
import {C, HEAD, Header, T, addDashes, contentDashes, enter, hide, leave, loadBrandFonts, rise} from './brand';

const COLUMNS = [
  {x: 150, bar: C.cyan, title: 'Cheap to allocate', body: 'New data goes on top of the\nstack, like stacking plates.'},
  {x: 714, bar: '#3F64C8', title: 'Cleanup is\nautomatic', body: 'When a block ends, its memory\nis gone. No collector, no pauses.'},
  {x: 1278, bar: C.red, title: 'Data stays put', body: 'Values never move, so\nreferences to them stay valid.'},
];

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const columns = createRefArray<Node>();
  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} eyebrow="Memory" title="Why Drop the Heap?" subtitle={'Simpler memory makes programs faster and easier to reason\nabout.'} />
      {COLUMNS.map(column => {
        const twoLines = column.title.includes('\n');
        return (
          <Node ref={columns}>
            <Rect x={column.x} y={533.8} width={120} height={14} anchor={[-1, -1]} radius={7} fill={column.bar} />
            <T text={column.title} x={column.x} y={567.8} size={46} weight={700} font={HEAD} lineHeight={52.9} />
            <T text={column.body} x={column.x} y={twoLines ? 693.58 : 640.69} size={30} lineHeight={43.5} color={C.subtitle} />
          </Node>
        );
      })}
    </Node>,
  );
  const dashes = addDashes(stage(), [
    contentDashes([
      [[110, 'b'], [50, 'c'], [140, 'd'], [70, 'c']],
      [[40, 'r'], [160, 'c'], [60, 'b'], [90, 'd'], [50, 'b']],
      [[80, 'd'], [120, 'b'], [100, 'c']],
      [[130, 'c'], [40, 'b'], [70, 'd'], [36, 'r'], [110, 'c']],
      [[90, 'b'], [150, 'c'], [60, 'd']],
    ]),
  ]);
  hide([...head, ...columns]);
  yield* enter(dashes, [...head, columns[0]]);
  yield* beginSlide('alloc');
  yield* rise([columns[1]]);
  yield* beginSlide('cleanup');
  yield* rise([columns[2]]);
  yield* beginSlide('stays');
  yield* leave(stage());
});
