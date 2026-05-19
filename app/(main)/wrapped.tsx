import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay, withRepeat, withSequence, Easing,
  cancelAnimation, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getScanHistory, getScanStats } from '@/lib/api/scan-storage';
import type { ScanRecord } from '@/lib/api/scan-storage';

const { width: W, height: H } = Dimensions.get('window');

type WrappedStats = {
  totalScans: number;
  bestScore: number;
  bestScoreMonth: string;
  topCategory: { name: string; avgScore: number };
  mostImproved: { name: string; delta: number };
  longestStreak: number;
  startAvgScore: number;
  endAvgScore: number;
};

function deriveStats(scans: ScanRecord[], streak: number): WrappedStats {
  const sorted = [...scans].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const scores = sorted.map(s => s.overall_score);
  const best = scores.length ? Math.max(...scores) : 0;
  const bestScan = sorted.find(s => s.overall_score === best);
  const bestMonth = bestScan ? new Date(bestScan.created_at).toLocaleString('default', { month: 'long' }) : 'this month';
  const half = Math.max(1, Math.floor(scores.length / 2));
  const startAvg = scores.length >= 2 ? Math.round(scores.slice(0, half).reduce((a, b) => a + b, 0) / half) : 60;
  const endAvg = scores.length >= 2 ? Math.round(scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half)) : startAvg + 10;
  return {
    totalScans: scans.length,
    bestScore: best,
    bestScoreMonth: bestMonth,
    topCategory: { name: '—', avgScore: endAvg },
    mostImproved: { name: '—', delta: Math.max(0, endAvg - startAvg) },
    longestStreak: streak,
    startAvgScore: startAvg,
    endAvgScore: endAvg,
  };
}

function useCounter(target: number, delayMs = 300, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => {
      const steps = 35;
      const stepMs = Math.max(duration / steps, 16);
      let step = 0;
      interval = setInterval(() => {
        step++;
        setCount(Math.min(Math.round((target / steps) * step), target));
        if (step >= steps && interval) clearInterval(interval);
      }, stepMs);
    }, delayMs);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);
  return count;
}

function StatBar({ score, color = tokens.colors.pinkDeep, delay = 500 }: { score: number; color?: string; delay?: number }) {
  const maxW = W - 80;
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming((score / 100) * maxW, { duration: 1200, easing: Easing.out(Easing.exp) }));
  }, []);
  const barStyle = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <View style={[styles.barTrack, { width: maxW }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, barStyle]} />
    </View>
  );
}

const SPARK_CHARS = ['✦', '✧', '♡', '◉', '✿', '★', '✦', '♡', '✧', '◉'];
const SPARK_COLORS = ['#FFD6EF', '#FFAAD9', '#D4AF37', '#FF9ED5', '#E8399A', '#FFF0F7'];

function Spark({ x, delay, color, char, size }: {
  x: number; delay: number; color: string; char: string; size: number;
}) {
  const ty = useSharedValue(0);
  const o = useSharedValue(0);
  const rot = useSharedValue(0);
  const sc = useSharedValue(0.6);
  const dur = 2100 + (delay % 9) * 200;

  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(-H * 0.7, { duration: dur, easing: Easing.linear }),
      ),
      -1, false,
    ));
    o.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.95, { duration: 300 }),
        withTiming(0.8, { duration: dur - 700 }),
        withTiming(0, { duration: 400 }),
      ),
      -1, false,
    ));
    rot.value = withDelay(delay, withRepeat(
      withTiming(360, { duration: dur, easing: Easing.linear }), -1, false,
    ));
    sc.value = withDelay(delay, withSpring(1, { damping: 8 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: sc.value }, { rotate: `${rot.value}deg` }],
    opacity: o.value,
  }));

  return (
    <Animated.Text style={[styles.sparkle, { left: x, fontSize: size, color }, style]}>
      {char}
    </Animated.Text>
  );
}

function Sparkles({ count = 10 }: { count?: number }) {
  const items = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: W * 0.04 + W * 0.92 * (i / Math.max(count - 1, 1)),
      delay: i * 290,
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      char: SPARK_CHARS[i % SPARK_CHARS.length],
      size: 9 + (i % 3) * 3,
    })), [count]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {items.map(p => <Spark key={p.id} {...p} />)}
    </View>
  );
}

function SlideOpening() {
  const heroSc = useSharedValue(0.72);
  const glowO = useSharedValue(0);

  useEffect(() => {
    heroSc.value = withDelay(350, withSpring(1, { damping: 10, stiffness: 90 }));
    glowO.value = withDelay(500, withTiming(1, { duration: 900 }));
  }, []);

  const heroStyle = useAnimatedStyle(() => ({ transform: [{ scale: heroSc.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowO.value }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#1A0414', '#2A0822', '#1A0414']} style={StyleSheet.absoluteFill} />
      <Sparkles count={14} />
      <Animated.View style={[styles.glowOrb, glowStyle]} />
      <View style={styles.slideBody}>
        <Animated.Text entering={FadeIn.delay(80).duration(500)} style={styles.openEye}>✦</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(450)} style={styles.openSub}>YOUR</Animated.Text>
        <Animated.View style={heroStyle}>
          <Text style={styles.openHero}>BEAUTY{'\n'}WRAPPED</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(650).duration(600)} style={styles.openYear}>2  0  2  6</Animated.Text>
        <Animated.Text entering={FadeIn.delay(1100).duration(700)} style={styles.openHint}>tap to begin  →</Animated.Text>
      </View>
    </View>
  );
}

function SlideScans({ stats }: { stats: WrappedStats }) {
  const count = useCounter(stats.totalScans, 400);
  const dotSc = useSharedValue(1);

  useEffect(() => {
    dotSc.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 450, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 450 }),
      ),
      -1, true,
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotSc.value }] }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#180820', '#2E0E3A', '#180820']} style={StyleSheet.absoluteFill} />
      <Sparkles count={9} />
      <View style={styles.slideBody}>
        <Animated.Text entering={FadeInUp.delay(80).duration(400)} style={styles.eyebrow}>YOUR YEAR IN SCANS</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(400)} style={styles.bodyLabel}>You showed up</Animated.Text>
        <View style={styles.bigNumRow}>
          <Text style={styles.bigNum}>{count}</Text>
          <Animated.Text style={[styles.bigNumDeco, dotStyle]}>✦</Animated.Text>
        </View>
        <Animated.Text entering={FadeIn.delay(350).duration(500)} style={styles.bodyLabel}>times this year</Animated.Text>
        <Animated.Text entering={FadeIn.delay(900).duration(600)} style={styles.bodyCopy}>Every scan is a step toward your best self 💕</Animated.Text>
      </View>
    </View>
  );
}

function SlideBestScore({ stats }: { stats: WrappedStats }) {
  const sc = useSharedValue(0.75);

  useEffect(() => {
    sc.value = withDelay(200, withSpring(1, { damping: 11, stiffness: 100 }));
  }, []);

  const numStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#1A0818', '#320E2C', '#1A0818']} style={StyleSheet.absoluteFill} />
      <Sparkles count={8} />
      <View style={styles.slideBody}>
        <Animated.Text entering={FadeInUp.delay(80).duration(400)} style={styles.eyebrow}>PERSONAL BEST</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(400)} style={styles.bodyLabel}>You hit</Animated.Text>
        <Animated.View style={numStyle}>
          <View style={styles.bestScoreRow}>
            <Text style={styles.bestScore}>{stats.bestScore}</Text>
            <Text style={styles.bestScoreUnit}>/100</Text>
          </View>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(550).duration(500)} style={styles.goldTag}>in {stats.bestScoreMonth}  ✦</Animated.Text>
        <Animated.Text entering={FadeIn.delay(1000).duration(600)} style={styles.bodyCopy}>That look was absolutely iconic 💅</Animated.Text>
      </View>
    </View>
  );
}

function SlideTopCategory({ stats }: { stats: WrappedStats }) {
  const catSc = useSharedValue(0.8);
  const catO = useSharedValue(0);

  useEffect(() => {
    catSc.value = withDelay(320, withSpring(1, { damping: 9, stiffness: 110 }));
    catO.value = withDelay(320, withTiming(1, { duration: 350 }));
  }, []);

  const catStyle = useAnimatedStyle(() => ({ transform: [{ scale: catSc.value }], opacity: catO.value }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#12061E', '#200C32', '#12061E']} style={StyleSheet.absoluteFill} />
      <Sparkles count={10} />
      <View style={styles.slideBody}>
        <Animated.Text entering={FadeInUp.delay(80).duration(400)} style={styles.eyebrow}>STRONGEST LOOK</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(400)} style={styles.bodyLabel}>You absolutely owned</Animated.Text>
        <Animated.View style={catStyle}>
          <Text style={styles.catHero}>{stats.topCategory.name}</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(480).duration(400)} style={{ alignItems: 'center', gap: 8 }}>
          <StatBar score={stats.topCategory.avgScore} color="#C2187A" delay={600} />
          <Text style={styles.scoreChip}>avg  {stats.topCategory.avgScore}</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(1100).duration(600)} style={styles.bodyCopy}>This is your natural superpower 👑</Animated.Text>
      </View>
    </View>
  );
}

function SlideStreak({ stats }: { stats: WrappedStats }) {
  const count = useCounter(stats.longestStreak, 300);
  const fireSc = useSharedValue(1);
  const fireRot = useSharedValue(0);

  useEffect(() => {
    fireSc.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 380, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 420 }),
      ),
      -1, true,
    );
    fireRot.value = withRepeat(
      withSequence(
        withTiming(-9, { duration: 280 }),
        withTiming(9, { duration: 280 }),
      ),
      -1, true,
    );
  }, []);

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireSc.value }, { rotate: `${fireRot.value}deg` }],
  }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#1C0810', '#350E18', '#1C0810']} style={StyleSheet.absoluteFill} />
      <Sparkles count={9} />
      <View style={styles.slideBody}>
        <Animated.Text entering={FadeInUp.delay(80).duration(400)} style={styles.eyebrow}>STREAK QUEEN</Animated.Text>
        <Animated.View entering={FadeIn.delay(150).duration(400)} style={fireStyle}>
          <Text style={styles.fireEmoji}>🔥</Text>
        </Animated.View>
        <View style={styles.bigNumRow}>
          <Text style={styles.bigNum}>{count}</Text>
          <Text style={styles.streakLabel}> days</Text>
        </View>
        <Animated.Text entering={FadeIn.delay(380).duration(500)} style={styles.bodyLabel}>longest streak</Animated.Text>
        <Animated.Text entering={FadeIn.delay(900).duration(600)} style={styles.bodyCopy}>Consistency is the real glow-up 🌸</Animated.Text>
      </View>
    </View>
  );
}

function SlideGlowUp({ stats }: { stats: WrappedStats }) {
  const delta = stats.endAvgScore - stats.startAvgScore;
  const startCount = useCounter(stats.startAvgScore, 300, 800);
  const endCount = useCounter(stats.endAvgScore, 1000, 900);
  const lineW = useSharedValue(0);
  const deltaSc = useSharedValue(0.7);

  useEffect(() => {
    lineW.value = withDelay(700, withTiming(W * 0.32, { duration: 900, easing: Easing.out(Easing.exp) }));
    deltaSc.value = withDelay(200, withSpring(1, { damping: 9, stiffness: 100 }));
  }, []);

  const lineStyle = useAnimatedStyle(() => ({ width: lineW.value }));
  const deltaStyle = useAnimatedStyle(() => ({ transform: [{ scale: deltaSc.value }] }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#16060A', '#2A0C14', '#16060A']} style={StyleSheet.absoluteFill} />
      <Sparkles count={9} />
      <View style={styles.slideBody}>
        <Animated.Text entering={FadeInUp.delay(80).duration(400)} style={styles.eyebrow}>YOUR GLOW-UP</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(400)} style={styles.bodyLabel}>You grew</Animated.Text>
        <Animated.View style={deltaStyle}>
          <Text style={styles.deltaText}>+{delta} points</Text>
        </Animated.View>
        <View style={styles.glowRow}>
          <View style={styles.glowScoreCol}>
            <Text style={styles.glowScore}>{startCount}</Text>
            <Text style={styles.glowScoreLabel}>JAN</Text>
          </View>
          <Animated.View style={[styles.glowLine, lineStyle]} />
          <Text style={styles.glowArrow}>→</Text>
          <View style={styles.glowScoreCol}>
            <Text style={[styles.glowScore, { color: tokens.colors.pink }]}>{endCount}</Text>
            <Text style={styles.glowScoreLabel}>DEC</Text>
          </View>
        </View>
        <Animated.Text entering={FadeIn.delay(1400).duration(600)} style={styles.bodyCopy}>That's not luck — that's you showing up 💗</Animated.Text>
      </View>
    </View>
  );
}

function SlideMostImproved({ stats }: { stats: WrappedStats }) {
  const catTY = useSharedValue(28);
  const catO = useSharedValue(0);

  useEffect(() => {
    catTY.value = withDelay(280, withSpring(0, { damping: 12, stiffness: 120 }));
    catO.value = withDelay(280, withTiming(1, { duration: 380 }));
  }, []);

  const catStyle = useAnimatedStyle(() => ({ transform: [{ translateY: catTY.value }], opacity: catO.value }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#0A0C1A', '#141828', '#0A0C1A']} style={StyleSheet.absoluteFill} />
      <Sparkles count={9} />
      <View style={styles.slideBody}>
        <Animated.Text entering={FadeInUp.delay(80).duration(400)} style={styles.eyebrow}>MOST IMPROVED</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(400)} style={styles.bodyLabel}>You levelled up</Animated.Text>
        <Animated.View style={catStyle}>
          <Text style={styles.catHero}>{stats.mostImproved.name}</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(480).duration(400)} style={{ alignItems: 'center', gap: 8 }}>
          <StatBar score={75} color="#D63384" delay={680} />
          <Text style={styles.scoreChip}>+{stats.mostImproved.delta} pts improvement</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(1100).duration(600)} style={styles.bodyCopy}>From struggling to slaying 🦋</Animated.Text>
      </View>
    </View>
  );
}

function SlideOutro({ onShare }: { onShare: () => void }) {
  const heartSc = useSharedValue(0);
  const headSc = useSharedValue(0.8);
  const btnSc = useSharedValue(0.75);
  const heartRot = useSharedValue(0);

  useEffect(() => {
    heartSc.value = withDelay(150, withSpring(1, { damping: 7, stiffness: 110 }));
    headSc.value = withDelay(450, withSpring(1, { damping: 12 }));
    btnSc.value = withDelay(950, withSpring(1, { damping: 11 }));
    heartRot.value = withDelay(200, withRepeat(
      withSequence(
        withTiming(-10, { duration: 350 }),
        withTiming(10, { duration: 350 }),
      ),
      3, true,
    ));
  }, []);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartSc.value }, { rotate: `${heartRot.value}deg` }] }));
  const headStyle = useAnimatedStyle(() => ({ transform: [{ scale: headSc.value }] }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnSc.value }] }));

  return (
    <View style={styles.slide}>
      <LinearGradient colors={['#1A0414', '#3A0E28', '#E8399A']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <Sparkles count={16} />
      <View style={styles.slideBody}>
        <Animated.Text style={[styles.heartEmoji, heartStyle]}>💗</Animated.Text>
        <Animated.View style={headStyle}>
          <Text style={styles.outroHead}>Here's to your{'\n'}glow-up</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(700).duration(500)} style={styles.outroBrand}>REMAKE  ✦  2026</Animated.Text>
        <Animated.View style={[{ width: '100%' }, btnStyle]}>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
            onPress={onShare}
          >
            <Text style={styles.shareBtnText}>Share your Wrapped  ↗</Text>
          </Pressable>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(1300).duration(700)} style={styles.outroNote}>See you next year  💕</Animated.Text>
      </View>
    </View>
  );
}

const TOTAL = 8;
const SLIDE_DURATION = 6000;
const SEG_GAP = 4;
const SEG_H_PAD = 14;
const SEG_W = (W - SEG_H_PAD * 2 - SEG_GAP * (TOTAL - 1)) / TOTAL;
const TRANSITION_MS = 360;

export default function WrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [transDir, setTransDir] = useState<1 | -1>(1);
  const [stats, setStats] = useState<WrappedStats>({
    totalScans: 0, bestScore: 0, bestScoreMonth: 'this month',
    topCategory: { name: 'Blending', avgScore: 0 },
    mostImproved: { name: 'Colour Harmony', delta: 0 },
    longestStreak: 0, startAvgScore: 0, endAvgScore: 0,
  });

  useEffect(() => {
    const uid = user?.id ?? 'guest';
    Promise.all([getScanHistory(uid, 100), getScanStats(uid)])
      .then(([scans, scanStats]) => setStats(deriveStats(scans, scanStats.currentStreak)))
      .catch(() => null);
  }, [user?.id]);

  const currentRef = useRef(0);
  const isAnimating = useRef(false);
  useEffect(() => { currentRef.current = current; }, [current]);

  const containerX = useSharedValue(0);
  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: containerX.value }] }));
  const progress = useSharedValue(0);
  const activeBarStyle = useAnimatedStyle(() => ({ width: progress.value * SEG_W }));

  const endTransition = useCallback(() => {
    setPrevSlide(null);
    containerX.value = 0;
    isAnimating.current = false;
  }, []);

  const goTo = useCallback((to: number, dir: 1 | -1) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    cancelAnimation(progress);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrevSlide(currentRef.current);
    setTransDir(dir);
    setCurrent(to);
    containerX.value = 0;
    containerX.value = withTiming(
      -dir * W,
      { duration: TRANSITION_MS, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(endTransition)(); },
    );
  }, [endTransition]);

  const advance = useCallback(() => {
    const next = currentRef.current + 1;
    if (next >= TOTAL) { router.back(); return; }
    goTo(next, 1);
  }, [goTo, router]);

  const retreat = useCallback(() => {
    const prev = currentRef.current - 1;
    if (prev < 0) return;
    goTo(prev, -1);
  }, [goTo]);

  useEffect(() => {
    if (isAnimating.current) return;
    progress.value = 0;
    const tid = setTimeout(() => {
      progress.value = withTiming(1, { duration: SLIDE_DURATION, easing: Easing.linear }, (done) => {
        if (done) runOnJS(advance)();
      });
    }, TRANSITION_MS + 50);
    return () => {
      clearTimeout(tid);
      cancelAnimation(progress);
    };
  }, [current]);

  const handleShare = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const slides = [
    <SlideOpening />,
    <SlideScans stats={stats} />,
    <SlideBestScore stats={stats} />,
    <SlideTopCategory stats={stats} />,
    <SlideStreak stats={stats} />,
    <SlideGlowUp stats={stats} />,
    <SlideMostImproved stats={stats} />,
    <SlideOutro onShare={handleShare} />,
  ];

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
        {prevSlide !== null && (
          <View key={prevSlide} style={StyleSheet.absoluteFill}>
            {slides[prevSlide]}
          </View>
        )}
        <View
          key={current}
          style={[
            StyleSheet.absoluteFill,
            prevSlide !== null && { left: transDir * W },
          ]}
        >
          {slides[current]}
        </View>
      </Animated.View>

      <View style={styles.tapZones} pointerEvents="box-none">
        <Pressable style={styles.tapLeft} onPress={retreat} />
        <Pressable style={styles.tapRight} onPress={advance} />
      </View>

      <View style={[styles.progressRow, { paddingTop: insets.top + 10 }]} pointerEvents="none">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={styles.seg}>
            {i < current ? (
              <View style={[styles.segFill, styles.segDone]} />
            ) : i === current ? (
              <Animated.View style={[styles.segFill, styles.segActive, activeBarStyle]} />
            ) : null}
          </View>
        ))}
      </View>

      <Pressable
        hitSlop={14}
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.closeTxt}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A0414' },
  sparkle: { position: 'absolute', bottom: H * 0.12 },
  slide: { flex: 1 },
  slideBody: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 72, paddingBottom: 110, gap: 14,
  },
  glowOrb: {
    position: 'absolute', width: W * 1.4, height: W * 1.4,
    borderRadius: W * 0.7, top: '10%', left: -(W * 0.2),
    backgroundColor: '#E8399A', opacity: 0.07,
    shadowColor: '#E8399A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 90,
  },
  eyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 3.5, color: 'rgba(255,170,217,0.65)',
    textTransform: 'uppercase', marginBottom: -4,
  },
  bodyLabel: {
    fontFamily: tokens.fonts.serif, fontSize: 24,
    color: '#FFF0F7', textAlign: 'center', fontStyle: 'italic',
  },
  bodyCopy: {
    fontFamily: tokens.fonts.regular, fontSize: 14,
    color: 'rgba(255,214,239,0.65)', textAlign: 'center',
    lineHeight: 22, maxWidth: W * 0.76, marginTop: 4,
  },
  goldTag: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600',
    color: tokens.colors.gold, letterSpacing: 0.6,
  },
  openEye: { fontSize: 22, color: tokens.colors.pink, marginBottom: -6 },
  openSub: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700',
    letterSpacing: 7, color: 'rgba(255,170,217,0.75)', marginBottom: -10,
  },
  openHero: {
    fontFamily: tokens.fonts.serif, fontSize: 64, color: '#FFF0F7',
    textAlign: 'center', lineHeight: 70, letterSpacing: 0.5,
  },
  openYear: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500',
    letterSpacing: 11, color: tokens.colors.gold, marginTop: 2,
  },
  openHint: {
    fontFamily: tokens.fonts.regular, fontSize: 12,
    color: 'rgba(255,170,217,0.38)', letterSpacing: 1.2, marginTop: 18,
  },
  bigNumRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bigNum: {
    fontFamily: tokens.fonts.serif, fontSize: 100, color: '#FFF0F7',
    lineHeight: 110, letterSpacing: -3,
  },
  bigNumDeco: { fontSize: 30, color: tokens.colors.pinkDeep, marginTop: -16 },
  streakLabel: {
    fontFamily: tokens.fonts.serif, fontSize: 28,
    color: 'rgba(255,240,247,0.65)', alignSelf: 'flex-end', marginBottom: 16,
  },
  bestScoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bestScore: {
    fontFamily: tokens.fonts.serif, fontSize: 112, color: '#FFF0F7',
    lineHeight: 118, letterSpacing: -4,
  },
  bestScoreUnit: {
    fontFamily: tokens.fonts.regular, fontSize: 22,
    color: 'rgba(255,214,239,0.45)', marginBottom: 20,
  },
  catHero: {
    fontFamily: tokens.fonts.serif, fontSize: 44, color: tokens.colors.pink,
    textAlign: 'center', fontStyle: 'italic', lineHeight: 52,
  },
  scoreChip: {
    fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600',
    color: tokens.colors.pinkMid, letterSpacing: 0.3,
  },
  barTrack: { height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2.5 },
  fireEmoji: { fontSize: 76 },
  deltaText: {
    fontFamily: tokens.fonts.serif, fontSize: 56, color: tokens.colors.pink,
    fontStyle: 'italic', letterSpacing: -1, lineHeight: 62,
  },
  glowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  glowScoreCol: { alignItems: 'center', gap: 3 },
  glowScore: { fontFamily: tokens.fonts.serif, fontSize: 38, color: '#FFF0F7', lineHeight: 44 },
  glowScoreLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '600',
    color: 'rgba(255,214,239,0.4)', letterSpacing: 1.5,
  },
  glowLine: { height: 2.5, borderRadius: 1.5, backgroundColor: tokens.colors.pinkDeep },
  glowArrow: { fontSize: 18, color: tokens.colors.pinkDeep, fontFamily: tokens.fonts.regular, marginLeft: -6 },
  heartEmoji: { fontSize: 82 },
  outroHead: {
    fontFamily: tokens.fonts.serif, fontSize: 50, color: '#FFF0F7',
    textAlign: 'center', lineHeight: 58, letterSpacing: 0.2,
  },
  outroBrand: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 4.5, color: 'rgba(255,240,247,0.38)',
  },
  outroNote: { fontFamily: tokens.fonts.regular, fontSize: 14, color: 'rgba(255,214,239,0.5)', marginTop: 6 },
  shareBtn: {
    paddingVertical: 17, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
  },
  shareBtnText: {
    fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '700',
    color: '#FFF0F7', letterSpacing: 0.3,
  },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 10 },
  tapLeft: { width: W * 0.28, height: '100%' },
  tapRight: { flex: 1, height: '100%' },
  progressRow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 4,
    paddingHorizontal: 14, paddingBottom: 10, zIndex: 20,
  },
  seg: {
    flex: 1, height: 2.5, borderRadius: 1.5, overflow: 'hidden',
    backgroundColor: 'rgba(255,240,247,0.15)',
  },
  segFill: { height: '100%', borderRadius: 1.5 },
  segDone: { backgroundColor: 'rgba(255,240,247,0.65)', width: '100%' },
  segActive: { backgroundColor: '#FFF0F7', width: '100%' },
  closeBtn: {
    position: 'absolute', right: 16, zIndex: 30,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeTxt: { color: 'rgba(255,240,247,0.65)', fontSize: 13 },
});
