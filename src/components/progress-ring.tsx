import { StyleSheet, View } from "react-native";

/**
 * Pure RN progress ring — two clipped semicircle borders, no native deps.
 * Each half is a full circle with only its top+right borders colored
 * (renders as a 180° arc), clipped to half the ring and rotated.
 */
export function ProgressRing({
  percent,
  size = 74,
  strokeWidth = 5,
  color,
  trackColor,
  children,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  children?: React.ReactNode;
}) {
  const half = size / 2;
  const clamped = Math.max(0, Math.min(100, percent));
  const firstDeg = Math.min(clamped, 50) * 3.6;
  const secondDeg = clamped > 50 ? (clamped - 50) * 3.6 : 0;

  const arc = {
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: strokeWidth,
    borderTopColor: color,
    borderRightColor: color,
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  } as const;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <View
        style={[
          styles.track,
          {
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: trackColor,
          },
        ]}
      />
      {/* Right clip: sweeps 0–50% */}
      <View style={[styles.clip, { width: half, height: size, left: half }]}>
        <View
          style={[
            arc,
            { position: "absolute", left: -half },
            { transform: [{ rotate: `${-135 + firstDeg}deg` }] },
          ]}
        />
      </View>
      {/* Left clip: sweeps 50–100% */}
      <View style={[styles.clip, { width: half, height: size, left: 0 }]}>
        <View
          style={[
            arc,
            { position: "absolute", left: 0 },
            { transform: [{ rotate: `${45 + secondDeg}deg` }] },
          ]}
        />
      </View>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  clip: {
    position: "absolute",
    top: 0,
    overflow: "hidden",
  },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
