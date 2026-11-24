import {Img, Node, Rect, makeScene2D} from '@canvas-commons/2d';
import {beginSlide, createRef, createRefArray, easeInQuad, easeInOutCubic, easeOutCubic, easeOutQuad, map, tween, waitFor} from '@canvas-commons/core';
import logo from '../goose-logo-white.png';
import {C, Header, LOGO_H, LOGO_W, Logo, addDashes, enter, hide, loadBrandFonts} from './brand';

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  yield loadBrandFonts();
  const stage = createRef<Node>();
  const head = createRefArray<Node>();
  const picture = createRef<Img>();
  view.add(
    <Node ref={stage} x={-960} y={-540}>
      <Logo ref={picture} src={logo} />
      <Header items={head} kind="hero" eyebrow="An Intro" title="Goose" subtitle="A memory-safe systems language, at a glance" />
    </Node>,
  );
  const dashes = addDashes(stage(), [
    {
      side: 'right', edge: 1960, top: 120, height: 18, gap: 14, rowGap: 18, firstDelayMs: 0,
      rows: [
        [[200, 'c'], [90, 'b'], [130, 'r'], [40, 'd'], [80, 'b'], [110, 'd']],
        [[120, 'b'], [50, 'd'], [170, 'c'], [70, 'b']],
        [[90, 'd'], [70, 'c'], [46, 'b'], [150, 'c'], [80, 'd'], [110, 'b']],
        [[130, 'c'], [46, 'r'], [80, 'c'], [170, 'b']],
        [[170, 'b'], [140, 'c'], [90, 'b'], [50, 'c'], [130, 'd']],
      ],
    },
    {
      side: 'left', edge: -40, top: 906, height: 18, gap: 14, rowGap: 18, firstDelayMs: 300,
      rows: [
        [[230, 'c'], [100, 'r'], [140, 'b'], [60, 'd']],
        [[90, 'd'], [180, 'b'], [110, 'c']],
      ],
    },
  ]);
  const entering = [...head, picture()];
  hide(entering);
  yield* enter(dashes, entering);
  const FRAME_W = 1920;
  const BAR_W = 2400;
  // Squashing and stretching must happen about the logo's own center, not its top-left anchor.
  picture().anchor([0, 0]).position([910 + LOGO_W / 2, 340.75 + LOGO_H / 2]);
  const startX = picture().x();

  const bar = createRef<Rect>();
  // Same colour as the page: the bar reads as the goose erasing the slide behind it.
  stage().add(<Rect ref={bar} y={-2} height={1084} width={BAR_W} fill={C.bg} anchor={[-1, -1]} x={FRAME_W} />);
  picture().moveToTop();

  yield* beginSlide('intro');

  const WIND_UP = 0.5;
  const HOLD = 0.04;
  const LAUNCH = 0.4;
  const SQUASH = 0.55;
  // Right edge ends 20px from the frame edge: centre + half the squashed width.
  const anticipatedX = FRAME_W - 20 - (LOGO_W * SQUASH) / 2;
  yield* tween(WIND_UP, value => {
    const t = easeInOutCubic(value);
    picture().scale([map(1, SQUASH, t), map(1, 1.05, t)]).x(map(startX, anticipatedX, t));
  });
  yield* waitFor(HOLD);

  const goneX = -(LOGO_W * 1.6) / 2 - 120;
  const rightEdge = () => picture().x() + (LOGO_W * picture().scale.x()) / 2;
  const hidden = [...head, ...dashes.map(dash => dash.node)];
  yield* tween(LAUNCH, value => {
    const t = easeInQuad(value);
    picture().scale([map(SQUASH, 1.6, easeOutQuad(value)), map(1.05, 0.9, easeOutQuad(value))]).x(map(anticipatedX, goneX, t));
    // Whole pixels, and tucked 2px behind the goose, so no anti-aliased seam shows at the bar's edge.
    bar().x(Math.round(map(FRAME_W, rightEdge(), easeOutCubic(Math.min(1, value / 0.2)))) - 2);
  });

  for (const node of hidden) node.opacity(0);
  bar().x(-BAR_W);
});
