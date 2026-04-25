// PainterlyBlock — RN port of docs/design/Intently - App/intently-imagery.jsx.
// Renders a textured "painted" panel: a flat base color, four deterministically
// positioned + blurred SVG ellipse "blobs" using the palette accents, and an
// optional grain overlay on web for paper-like texture. Children render on top.
//
// The source uses CSS `mix-blend-mode: multiply` for grain — web-only. On native
// we skip the grain layer entirely; the blob layer alone reads as painterly,
// and visual fidelity for the hackathon demo is judged on web (Vercel deploy).
//
// Palette contract: [base, accent1, accent2, highlight]. The base is the flat
// background; accent1/accent2/highlight render as the four blobs at fixed
// relative positions per the source recipe.
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, FeGaussianBlur, Filter, G } from 'react-native-svg';

export type PainterlyPalette = [
  base: string,
  accent1: string,
  accent2: string,
  highlight: string,
];

type Props = {
  palette?: PainterlyPalette;
  seed?: number;
  style?: ViewStyle;
  children?: ReactNode;
};

const DEFAULT_PALETTE: PainterlyPalette = ['#8CB39A', '#5F8A72', '#C66B3F', '#F1DE8A'];

// Deterministic blob layout — matches the source `intently-imagery.jsx`
// layout exactly so painted compositions read identical to the design canvas.
type Blob = { color: string; cx: number; cy: number; rx: number; ry: number; opacity: number };

function blobsFor(palette: PainterlyPalette): Blob[] {
  const ry = (r: number) => r * 0.7;
  return [
    { color: palette[1], cx: 20, cy: 80, rx: 70, ry: ry(70), opacity: 0.85 },
    { color: palette[2], cx: 80, cy: 30, rx: 55, ry: ry(55), opacity: 0.7 },
    { color: palette[3], cx: 65, cy: 85, rx: 45, ry: ry(45), opacity: 0.75 },
    { color: palette[1], cx: 10, cy: 15, rx: 40, ry: ry(40), opacity: 0.5 },
  ];
}

export default function PainterlyBlock({
  palette = DEFAULT_PALETTE,
  seed = 1,
  style,
  children,
}: Props) {
  const blobs = blobsFor(palette);
  const filterId = `painterly-bl-${seed}`;
  return (
    <View style={[{ backgroundColor: palette[0], overflow: 'hidden' }, style]}>
      {/* Blob layer — absolute fill behind children. preserveAspectRatio="none"
          stretches the 100×100 viewBox to the container, matching the source's
          stretch behavior so blob positions land in the same relative spots. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <Filter id={filterId}>
              <FeGaussianBlur stdDeviation="6" />
            </Filter>
          </Defs>
          <G filter={`url(#${filterId})`}>
            {blobs.map((b, i) => (
              <Ellipse
                key={i}
                cx={b.cx}
                cy={b.cy}
                rx={b.rx}
                ry={b.ry}
                fill={b.color}
                opacity={b.opacity}
              />
            ))}
          </G>
        </Svg>
      </View>
      {/* Grain overlay — web only. CSS mix-blend-mode + base64 SVG noise.
          Cast to any: react-native-web passes web-only style props through to
          the DOM, but the RN typings don't include them. */}
      {Platform.OS === 'web' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.17  0 0 0 0 0.13  0 0 0 0 0.09  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              opacity: 0.55,
              mixBlendMode: 'multiply',
            } as any,
          ]}
        />
      ) : null}
      {/* Content sits above the painterly layers. zIndex matters on web. */}
      {children ? (
        <View style={{ position: 'relative', zIndex: 2, height: '100%' }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}
