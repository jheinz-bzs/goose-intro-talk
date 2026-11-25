import {Circle, Line, Node, Rect, Txt} from '@canvas-commons/2d';
import {Reference, createRef} from '@canvas-commons/core';
import {C, MONO, T} from './brand';

export const SYN = {plain: '#DCE8F5', kw: C.cyan, str: C.mint, fn: C.pink, dim: '#7F9AD1'};
export const CODE_BG = '#163470';
export type Token = [string, string];

/** Width of one monospace cell, measured so highlights can sit on exact columns of the code. */
export function monoAdvance(size: number) {
  const context = document.createElement('canvas').getContext('2d')!;
  context.font = `${size}px ${MONO}`;
  return context.measureText('M'.repeat(40)).width / 40;
}

// Non-breaking spaces keep indentation and gaps from being collapsed between inline spans.
const keepSpaces = (text: string) => text.replace(/ /g, ' ');

// A non-zero letter spacing is what stops the browser from forming ligatures such as -> and :: on canvas text.
const NO_LIGATURES = 0.01;

export function CodeBlock(props: {x: number; y: number; width: number; height: number; size: number; lineHeight: number; padX: number; padY: number; lines: Token[][]}) {
  const {x, y, width, height, size, lineHeight, padX, padY, lines} = props;
  return (
    <Node x={x} y={y}>
      <Rect width={width} height={height} radius={14} fill={CODE_BG} anchor={[-1, -1]} />
      {lines.map((tokens, index) => (
        <Txt x={padX} y={padY + lineHeight * index + lineHeight / 2} anchor={[-1, 0]} fontFamily={MONO} fontSize={size} lineHeight={lineHeight} fill={SYN.plain} letterSpacing={NO_LIGATURES} textWrap={false}>
          {tokens.map(([text, color]) => (
            <Txt text={keepSpaces(text)} fill={color} letterSpacing={NO_LIGATURES} />
          ))}
        </Txt>
      ))}
    </Node>
  );
}

export function Arrow(props: {x1: number; x2: number; y: number; shaft: Reference<Line>; head: Reference<Line>}) {
  const {x1, x2, y} = props;
  return (
    <>
      <Line ref={props.shaft} points={[[x1 + 4, y], [x2 - 4, y]]} stroke={C.cyan} lineWidth={6} lineCap="round" end={0} opacity={0} />
      <Line ref={props.head} points={[[x2 - 24, y - 14], [x2 - 6, y], [x2 - 24, y + 14]]} stroke={C.cyan} lineWidth={6} lineCap="round" lineJoin="round" opacity={0} />
    </>
  );
}

export function makeArrowRefs() {
  return {shaft: createRef<Line>(), head: createRef<Line>()};
}

export const DASH_ROWS = [
  [[130, 'c'], [60, 'd'], [110, 'b'], [40, 'r']],
  [[80, 'b'], [150, 'c'], [50, 'd']],
  [[46, 'c'], [120, 'd'], [70, 'b'], [100, 'c']],
] as [number, 'c' | 'd' | 'b' | 'r'][][];

/** The full-width callout pill every gweb board closes its diagram with. */
export function Why(props: {text: string; y: number}) {
  return (
    <>
      <Rect x={150} y={props.y} width={1620} height={64} radius={32} fill={C.panel} anchor={[-1, -1]} />
      <T text={props.text} x={960} y={props.y + 32} size={30} weight={600} lineHeight={36} center />
    </>
  );
}

export function FileName(props: {x: number; y: number; text: string; badge?: string}) {
  const offset = props.badge ? 44 : 0;
  return (
    <>
      {props.badge ? (
        <>
          <Circle x={props.x + 16} y={props.y + 18} size={32} fill={C.cyan} />
          <T text={props.badge} x={props.x + 16} y={props.y + 18} size={22} weight={600} lineHeight={27} color={C.ink} center />
        </>
      ) : null}
      <T text={props.text} x={props.x + offset} y={props.y} size={24} weight={600} lineHeight={36} color={C.subtitle} />
    </>
  );
}
