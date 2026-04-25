// MorningLight — RN port of docs/design/Intently - App/intently-imagery.jsx.
// A painterly sunrise panel: gradient sky from cream → peach → terracotta with
// two soft "sun" disks (blurred, screen-blend on web) and a layered horizon
// silhouette. Used as a hero backdrop for Daily Brief and the morning CTA.
//
// On web, the gradient is a CSS string (`backgroundImage`); on native we pin a
// solid mid-tone fallback (terracotta peach) since react-native-web is the
// demo target and pulling expo-linear-gradient just for this isn't worth it.
// The horizon SVG works on both platforms via react-native-svg.
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = { style?: ViewStyle };

const SKY_GRADIENT =
  'linear-gradient(180deg, #F3D7A2 0%, #EFB88F 45%, #C66B3F 100%)';
const SKY_FALLBACK = '#EFB88F';

export default function MorningLight({ style }: Props) {
  return (
    <View
      style={[
        {
          overflow: 'hidden',
          backgroundColor: SKY_FALLBACK,
        },
        Platform.OS === 'web' ? ({ backgroundImage: SKY_GRADIENT } as any) : null,
        style,
      ]}
    >
      {/* Soft sun discs — two blurred circles with screen blend mode (web).
          On native we render as low-opacity flat circles, which still reads
          as a warm light source. */}
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: '#F5E8C8',
            opacity: Platform.OS === 'web' ? 1 : 0.55,
          },
          Platform.OS === 'web'
            ? ({ filter: 'blur(28px)', mixBlendMode: 'screen' } as any)
            : null,
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: -130,
            left: -80,
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: 'rgba(255,224,175,0.6)',
          },
          Platform.OS === 'web'
            ? ({ filter: 'blur(28px)', mixBlendMode: 'screen' } as any)
            : null,
        ]}
      />
      {/* Horizon silhouette — two stacked layers reading as distant + nearer
          ridge. Stretches to fill the bottom 40% of the panel. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 300"
          preserveAspectRatio="none"
        >
          <Path
            d="M0 300 L0 180 Q100 160 200 175 T400 170 L400 300 Z"
            fill="#5F4A35"
            opacity={0.55}
          />
          <Path
            d="M0 300 L0 218 Q140 204 260 214 T400 210 L400 300 Z"
            fill="#2B2118"
            opacity={0.6}
          />
        </Svg>
      </View>
    </View>
  );
}
