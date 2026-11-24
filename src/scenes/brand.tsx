import {Img, Line, Node, Rect, Txt} from '@canvas-commons/2d';
import {ReferenceArray, all, delay, easeOutCubic, tween} from '@canvas-commons/core';

export const C = {
  bg: '#1F3D7A',
  panel: '#2A4C8F',
  code: '#152B57',
  cyan: '#56C5E8',
  ink: '#10264F',
  subtitle: '#DCE8F5',
  white: '#FFFFFF',
  mint: '#9EECFB',
  red: '#F2434A',
  pink: '#FFB0B1',
};

export const HEAD = "Poppins, 'Helvetica Neue', Arial, sans-serif";
export const BODY = "Montserrat, 'Helvetica Neue', Arial, sans-serif";
export const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap';
const FACES: [string, number[]][] = [
  ['Poppins', [600, 700, 800]],
  ['Montserrat', [400, 500, 600]],
];

function stylesheetReady(): Promise<void> {
  let link = document.querySelector<HTMLLinkElement>('link[data-brand-fonts]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    link.dataset.brandFonts = '';
    document.head.append(link);
  }
  const sheet = link;
  if (sheet.sheet) return Promise.resolve();
  return new Promise((resolve, reject) => {
    sheet.addEventListener('load', () => resolve());
    sheet.addEventListener('error', () => reject(new Error('Google Fonts stylesheet failed to load')));
  });
}

let fontsLoaded: Promise<void> | undefined;

/** Resolves once every weight is loaded; rejects rather than letting a frame render in a fallback font. */
export function loadBrandFonts(): Promise<void> {
  fontsLoaded ??= (async () => {
    await stylesheetReady();
    await document.fonts.ready;
    for (const [family, weights] of FACES) {
      for (const weight of weights) {
        const faces = await document.fonts.load(`${weight} 40px ${family}`);
        if (!faces.length || faces.some(face => face.status !== 'loaded')) {
          throw new Error(`font ${family} ${weight} did not load`);
        }
      }
    }
    await document.fonts.ready;
  })();
  return fontsLoaded;
}

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress, overshoot included. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const coefficients = (a: number, b: number) => {
    const c = 3 * a;
    const mid = 3 * (b - a) - c;
    return [1 - c - mid, mid, c];
  };
  const [ax, bx, cx] = coefficients(x1, x2);
  const [ay, by, cy] = coefficients(y1, y2);
  const sample = (a: number, b: number, c: number, t: number) => ((a * t + b) * t + c) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (progress: number) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    let t = progress;
    for (let i = 0; i < 8; i++) {
      const error = sample(ax, bx, cx, t) - progress;
      if (Math.abs(error) < 1e-6) return sample(ay, by, cy, t);
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    let low = 0;
    let high = 1;
    t = progress;
    while (high - low > 1e-6) {
      if (sample(ax, bx, cx, t) < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sample(ay, by, cy, t);
  };
}

export const spring = cubicBezier(0.34, 1.56, 0.64, 1);

const DASH_COLORS = {c: C.cyan, b: '#3F64C8', r: C.red, d: '#163470'};
type DashColor = keyof typeof DASH_COLORS;
export type DashRow = [number, DashColor][];

export interface DashGroup {
  side: 'right' | 'left';
  /** Where the rows end: the right edge for 'right', the left edge for 'left'. */
  edge: number;
  top: number;
  height: number;
  gap: number;
  rowGap: number;
  /** The design's --d for the first dash; each following dash adds 25. */
  firstDelayMs: number;
  rows: DashRow[];
}

interface Dash {
  node: Rect;
  baseX: number;
  from: number;
  delay: number;
}

const DASH_TRAVEL = 160;
const DASH_DURATION = 0.6;

export function addDashes(parent: Node, groups: DashGroup[]): Dash[] {
  const dashes: Dash[] = [];
  for (const group of groups) {
    let count = 0;
    group.rows.forEach((row, rowIndex) => {
      const y = group.top + rowIndex * (group.height + group.rowGap);
      const ordered = group.side === 'right' ? [...row].reverse() : row;
      let cursor = group.edge;
      for (const [width, color] of ordered) {
        const x = group.side === 'right' ? cursor - width : cursor;
        cursor = group.side === 'right' ? x - group.gap : x + width + group.gap;
        const dash = {
          node: new Rect({x, y, width, height: group.height, radius: group.height / 2, fill: DASH_COLORS[color], anchor: [-1, -1]}),
          baseX: x,
          from: group.side === 'right' ? DASH_TRAVEL : -DASH_TRAVEL,
          delay: ((group.firstDelayMs + 25 * count++) * 0.5) / 1000,
        };
        dash.node.x(x + dash.from).opacity(0);
        parent.add(dash.node);
        dashes.push(dash);
      }
    });
  }
  return dashes;
}

export function* streamIn(dashes: Dash[]) {
  const total = Math.max(...dashes.map(dash => dash.delay)) + DASH_DURATION;
  yield* tween(total, value => {
    const time = value * total;
    for (const dash of dashes) {
      const eased = spring(Math.min(1, Math.max(0, (time - dash.delay) / DASH_DURATION)));
      dash.node.x(dash.baseX + dash.from * (1 - eased));
      dash.node.opacity(Math.min(1, eased));
    }
  });
}

const RISE = 24;

/** Hides nodes and offsets them so rise() can bring them in. */
export function hide(nodes: Node[]) {
  for (const node of nodes) node.opacity(0).y(node.y() + RISE);
}

export function* rise(nodes: Node[], stagger = 0.08, duration = 0.4) {
  yield* all(
    ...nodes.map((node, index) =>
      delay(index * stagger, all(node.opacity(1, duration, easeOutCubic), node.y(node.y() - RISE, duration, easeOutCubic))),
    ),
  );
}

interface TextProps {
  ref?: any;
  text: string;
  x: number;
  y: number;
  size: number;
  weight?: number;
  color?: string;
  font?: string;
  lineHeight: number;
  letterSpacing?: number;
  center?: boolean;
}

/** Text placed in design pixels: the top-left of its line box, or its center when `center`. One Txt per line, since Txt would otherwise re-wrap. */
export function T({text, x, y, size, weight = 400, color = C.white, font = BODY, lineHeight, letterSpacing = 0, center, ref}: TextProps) {
  return (
    <Node ref={ref} x={x} y={y}>
      {text.split('\n').map((line, index) => (
        <Txt
          text={line}
          y={index * lineHeight}
          anchor={center ? [0, 0] : [-1, -1]}
          fontFamily={font}
          fontSize={size}
          fontWeight={weight}
          fill={color}
          lineHeight={lineHeight}
          letterSpacing={letterSpacing}
          textWrap={false}
        />
      ))}
    </Node>
  );
}

/** Text placed by its baseline and horizontal alignment, like SVG text in the designs; the vertical offset is the cap-height centre of Montserrat. */
export function Svg(props: {ref?: any; text: any; x: any; y: any; size: number; weight?: number; color?: any; align?: 'start' | 'middle' | 'end'; opacity?: any}) {
  const {size, weight = 400, align = 'start'} = props;
  const offset = -0.36 * size;
  const y = typeof props.y === 'function' ? () => props.y() + offset : props.y + offset;
  return (
    <Txt
      ref={props.ref}
      text={props.text}
      x={props.x}
      y={y}
      fontFamily={BODY}
      fontSize={size}
      fontWeight={weight}
      lineHeight={size * 1.22}
      fill={props.color ?? C.white}
      opacity={props.opacity ?? 1}
      anchor={[align === 'start' ? -1 : align === 'end' ? 1 : 0, 0]}
      textWrap={false}
    />
  );
}

/** The 780x453 card of the Benchmarks and Web Server designs, with its title; content is placed in absolute stage coordinates. */
export function Card(props: {x: number; title: string}) {
  return (
    <>
      <Rect x={props.x} y={404} width={780} height={453} radius={20} fill={C.panel} anchor={[-1, -1]} />
      <T text={props.title.toUpperCase()} x={props.x + 40} y={452} size={24} weight={600} color={C.cyan} lineHeight={29} letterSpacing={2.88} />
    </>
  );
}

export function LegendItem(props: {x: number; color: string; text: string}) {
  return (
    <>
      <Rect x={props.x} y={464} width={26} height={10} radius={5} fill={props.color} anchor={[-1, -1]} />
      <Svg text={props.text} x={props.x + 34} y={477} size={22} color={C.subtitle} />
    </>
  );
}

export function Panel(props: {x: number; y: number; width: number; height: number; fill?: string}) {
  return <Rect {...props} anchor={[-1, -1]} radius={12} fill={props.fill ?? C.panel} />;
}

type HeaderKind = 'standard' | 'compact' | 'hero' | 'next';

// [top, font size, line height, letter spacing] straight from the design.
const HEADER = {
  standard: {eyebrow: [130, 24, 29, 3.84], title: [186, 96, 100.8, -0.96], subtitle: [315.8, 38, 47]},
  compact: {eyebrow: [110, 24, 29, 3.84], title: [161, 96, 100.8, -0.96], subtitle: [283.8, 34, 41]},
  hero: {eyebrow: [383.5, 26, 32, 4.16], title: [447.5, 168, 168, -1.68], subtitle: [647.5, 40, 49]},
  next: {eyebrow: [406.09, 26, 32, 4.16], title: [470.09, 120, 124.8, -1.2], subtitle: [626.89, 38, 47]},
};

/** Eyebrow, title and subtitle, pushed onto `items` in that order. */
export function Header(props: {items: ReferenceArray<Node>; kind?: HeaderKind; eyebrow: string; title: string; subtitle: string}) {
  const {items, kind = 'standard'} = props;
  const m = HEADER[kind];
  return (
    <>
      <T ref={items} text={props.eyebrow.toUpperCase()} x={150} y={m.eyebrow[0]} size={m.eyebrow[1]} weight={600} color={C.cyan} lineHeight={m.eyebrow[2]} letterSpacing={m.eyebrow[3]} />
      <T ref={items} text={props.title} x={150} y={m.title[0]} size={m.title[1]} weight={800} font={HEAD} lineHeight={m.title[2]} letterSpacing={m.title[3]} />
      <T ref={items} text={props.subtitle} x={150} y={m.subtitle[0]} size={m.subtitle[1]} weight={500} color={C.subtitle} lineHeight={m.subtitle[2]} />
    </>
  );
}

export function Arrow(props: {x: number; y: number; ref?: any}) {
  return (
    <Node x={props.x} y={props.y} ref={props.ref}>
      <Line points={[[8, 20], [128, 20]]} stroke={C.cyan} lineWidth={12} lineCap="round" />
      <Line points={[[118, 6], [140, 20], [118, 34]]} stroke={C.cyan} lineWidth={10} lineCap="round" lineJoin="round" />
    </Node>
  );
}

export const LOGO_W = 880;
// Explicit so no scene has to read the Img's size, which is unavailable until the image loads (PNG is 1615x768).
export const LOGO_H = (LOGO_W * 768) / 1615;

export function Logo(props: {src: string; ref?: any}) {
  return <Img ref={props.ref} src={props.src} x={910} y={340.75} width={LOGO_W} height={LOGO_H} anchor={[-1, -1]} />;
}

/** Dashes stream in while the given text and panels rise. */
export function* enter(dashes: Dash[], nodes: Node[]) {
  yield* all(streamIn(dashes), rise(nodes));
}

export function* leave(stage: Node) {
  yield* stage.opacity(0, 0.25);
}

/** Standard right-hand dash stream used by every content slide. */
export function contentDashes(rows: DashRow[]): DashGroup {
  return {side: 'right', edge: 1950, top: 112, height: 14, gap: 10, rowGap: 12, firstDelayMs: 0, rows};
}
