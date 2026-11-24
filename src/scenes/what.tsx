import {Node, makeScene2D} from '@canvas-commons/2d';
import {beginSlide, createRef, createRefArray} from '@canvas-commons/core';
import {C, HEAD, Header, MONO, Panel, T, addDashes, contentDashes, enter, hide, leave, loadBrandFonts} from './brand';

const POINTS = [
  ['Runs like C', 'It compiles down to native code.'],
  ['No garbage collector', 'No pauses, and no manual free.'],
  ['Safe by default', 'The compiler rules out whole classes of bugs.'],
];
const CHAR = 22.885;
const CODE_X = 1119.16;

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const blocks = createRefArray<Node>();
  const code = (text: string, column: number, line: number, color = C.white) => (
    <T text={text} x={CODE_X + column * CHAR} y={612.89 + line * 57} size={38} font={MONO} lineHeight={57} color={color} />
  );
  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Header items={head} eyebrow="The Language" title="What Is Goose?" subtitle="A systems language for fast programs that can't corrupt memory." />
      {POINTS.map(([title, body], index) => (
        <Node ref={blocks}>
          <T text={title} x={150} y={481.89 + index * 159} size={44} weight={700} font={HEAD} lineHeight={65} />
          <T text={body} x={150} y={554.89 + index * 159} size={30} lineHeight={42} color={C.subtitle} />
        </Node>
      ))}
      <Node ref={blocks}>
        <Panel x={1063.16} y={564.89} width={706.84} height={267} fill={C.code} />
        {code('fn', 0, 0, C.cyan)}
        {code('main() {', 3, 0)}
        {code('print(', 4, 1)}
        {code('"hello, goose"', 10, 1, C.mint)}
        {code(');', 24, 1)}
        {code('}', 0, 2)}
      </Node>
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
  const entering = [...head, ...blocks];
  hide(entering);
  yield* enter(dashes, entering);
  yield* beginSlide('intro');
  yield* leave(stage());
});
