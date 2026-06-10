import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions, Share } from 'react-native';
import Animated, {
  FadeIn, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, SharedValue,
  withTiming, withSpring, withDelay, withRepeat, withSequence, Easing,
  cancelAnimation, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getScanHistory, getScanStats } from '@/lib/api/scan-storage';
import type { ScanRecord } from '@/lib/api/scan-storage';
import { BlurView } from 'expo-blur';
import { useUser } from '@/contexts/user-context';
import { useSubscription } from '@/contexts/subscription-context';
import { createClient } from '@/lib/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: W, height: H } = Dimensions.get('window');

interface SlideColors {
  gradientTop: string;
  gradientBot: string;
  text: string;
  muted: string;
  eyebrow: string;
  accent: string;
}

const SLIDE_COLORS: SlideColors[] = [
  // 0 — Welcome: Deep midnight space violet with glowing neon pink
  { gradientTop: '#0C0214', gradientBot: '#150526', text: '#FFFFFF', muted: 'rgba(255,255,255,0.7)', eyebrow: '#FF007F', accent: '#FF007F' },
  // 1 — Opening: STARK VIBRANT NEON HOT PINK (stark black text contrast)
  { gradientTop: '#FF007F', gradientBot: '#E8006F', text: '#0F0311', muted: 'rgba(15,3,17,0.75)', eyebrow: '#0F0311', accent: '#0F0311' },
  // 2 — Scans: STARK DEEP INDIGO (glowing neon green contrast)
  { gradientTop: '#1E1B4B', gradientBot: '#0F0E36', text: '#FFFFFF', muted: 'rgba(255,255,255,0.7)', eyebrow: '#00FF87', accent: '#00FF87' },
  // 3 — Best Score: ELECTRIC ROYAL BLUE (glowing neon yellow contrast)
  { gradientTop: '#1A0DAB', gradientBot: '#0A056B', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', eyebrow: '#E8D22C', accent: '#E8D22C' },
  // 4 — Top Category: VIBRANT NEON ORANGE (deep dark purple text contrast)
  { gradientTop: '#FF5722', gradientBot: '#E64A19', text: '#1E0500', muted: 'rgba(30,5,0,0.78)', eyebrow: '#1E0500', accent: '#1E0500' },
  // 5 — Streak: Deepest midnight space violet with glowing neon pink
  { gradientTop: '#0C0214', gradientBot: '#150526', text: '#FFFFFF', muted: 'rgba(255,255,255,0.7)', eyebrow: '#FF007F', accent: '#FF007F' },
  // 6 — Glow-Up: VIBRANT ACID LIME YELLOW (deep dark forest text contrast)
  { gradientTop: '#CCFF00', gradientBot: '#B2EB00', text: '#0C1A00', muted: 'rgba(12,26,0,0.75)', eyebrow: '#0C1A00', accent: '#0C1A00' },
  // 7 — Most Improved: STARK VIBRANT MAGENTA (black text contrast)
  { gradientTop: '#D81B60', gradientBot: '#C2187B', text: '#0F0107', muted: 'rgba(15,1,7,0.75)', eyebrow: '#0F0107', accent: '#0F0107' },
  // 8 — Outro: DEEP COSMIC NIGHT (pure gold and white contrast)
  { gradientTop: '#0A0314', gradientBot: '#1C0838', text: '#FFEEDD', muted: 'rgba(255,238,221,0.7)', eyebrow: '#D4AF37', accent: '#D4AF37' },
];

const SLIDE_GRADS: Array<[string, string]> = SLIDE_COLORS.map(c => [c.gradientTop, c.gradientBot]);

// ─── Morphing background ──────────────────────────────────────────────────────
// Three layers:
//  1. Static "from" gradient (base)
//  2. Animated "to" gradient that crossfades in during transitions
//  3. A second offset gradient layer that slow-pulses — makes the BG feel alive
function MorphingBg({ fromIdx, toIdx, morph }: {
  fromIdx: number; toIdx: number; morph: SharedValue<number>;
}) {
  const [from, to] = [SLIDE_GRADS[fromIdx] ?? SLIDE_GRADS[0], SLIDE_GRADS[toIdx] ?? SLIDE_GRADS[0]];

  const toStyle = useAnimatedStyle(() => ({ opacity: morph.value }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={from} start={{x:0.2,y:0}} end={{x:0.8,y:1}} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, toStyle]}>
        <LinearGradient colors={to} start={{x:0.2,y:0}} end={{x:0.8,y:1}} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

// ─── Music ────────────────────────────────────────────────────────────────────
const MUSIC_MAIN  = require('../../assets/sounds/tc.mp3');
const MUSIC_OUTRO = require('../../assets/sounds/tf.mp3');
const MUSIC_VOL   = 0.72;
const CROSSFADE_STEPS  = 20;
const CROSSFADE_STEP_MS = 55;
const OUTRO_SLIDE = 7;
const PRELOAD_SLIDE = 5;

// ─── Timing ───────────────────────────────────────────────────────────────────
const TOTAL           = 9;
const SLIDE_DURATION  = 5500;  // long enough for counter + copy to land fully
const TAP_LOCK_MS     = 1600;  // can't skip for 1.6s — the reveal animation plays first
const SEG_GAP         = 4;
const SEG_H_PAD       = 14;
const SEG_W           = (W - SEG_H_PAD * 2 - SEG_GAP * (TOTAL - 1)) / TOTAL;
const TRANSITION_MS   = 280;

// ─── Stats ────────────────────────────────────────────────────────────────────
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
  const best   = scores.length ? Math.max(...scores) : 0;
  const bestScan  = sorted.find(s => s.overall_score === best);
  const bestMonth = bestScan ? new Date(bestScan.created_at).toLocaleString('default', { month: 'long' }) : 'this month';
  const half      = Math.max(1, Math.floor(scores.length / 2));
  const startAvg  = scores.length >= 2 ? Math.round(scores.slice(0, half).reduce((a,b)=>a+b,0)/half) : 60;
  const endAvg    = scores.length >= 2 ? Math.round(scores.slice(half).reduce((a,b)=>a+b,0)/(scores.length-half)) : startAvg+10;
  return {
    totalScans: scans.length, bestScore: best, bestScoreMonth: bestMonth,
    topCategory: { name: 'Blending', avgScore: endAvg },
    mostImproved: { name: 'Colour Harmony', delta: Math.max(0, endAvg-startAvg) },
    longestStreak: streak, startAvgScore: startAvg, endAvgScore: endAvg,
  };
}

// ─── Counter hook ─────────────────────────────────────────────────────────────
// Counter eases out — starts fast then slows down near the final number.
// This creates the Spotify Wrapped "suspense" feeling right before the reveal.
function useCounter(target: number, delay = 180, duration = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | null = null;
    const t = setTimeout(() => {
      const steps   = 25;
      const totalMs = duration;
      let step      = 0;
      iv = setInterval(() => {
        step++;
        // Ease-out curve: progress decelerates toward 1
        const eased = 1 - Math.pow(1 - step / steps, 2.8);
        const val   = Math.min(Math.round(eased * target), target);
        setN(val);
        if (step >= steps && iv) {
          clearInterval(iv);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      }, totalMs / steps);
    }, delay);
    return () => { clearTimeout(t); if (iv) clearInterval(iv); };
  }, []);
  return n;
}

// ─── Sparkles ─────────────────────────────────────────────────────────────────
const SCHARS  = ['✦','✧','♡','◉','✿','★'];
const SCOLORS = ['#FFD6EF','#FFAAD9','#E6C88A','#FF9ED5','rgba(232,57,154,0.7)','#FFF0F7'];

function Spark({ x, delay, color, char, size }: {
  x: number; delay: number; color: string; char: string; size: number;
}) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  const dur = 1800 + (delay % 9) * 160;
  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0,{duration:0}), withTiming(-H*0.65,{duration:dur,easing:Easing.linear})),
      -1, false,
    ));
    op.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1,{duration:220}), withTiming(0.7,{duration:dur-500}), withTiming(0,{duration:280})),
      -1, false,
    ));
  }, []);
  const s = useAnimatedStyle(() => ({ transform:[{translateY:ty.value}], opacity:op.value }));
  return <Animated.Text style={[{position:'absolute',left:x,bottom:H*0.1,fontSize:size,color},s]}>{char}</Animated.Text>;
}

function Sparkles({ count=10 }: { count?: number }) {
  const items = useMemo(() =>
    Array.from({length:count},(_,i)=>({
      id:i, x:W*0.03+W*0.94*(i/Math.max(count-1,1)),
      delay:i*175, color:SCOLORS[i%SCOLORS.length],
      char:SCHARS[i%SCHARS.length],
      // More dramatic size range: tiny dust (7) to prominent stars (20)
      size: i % 4 === 0 ? 18 + (i % 3) : 7 + (i % 5) * 2,
    })), [count]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {items.map(p=><Spark key={p.id} {...p}/>)}
    </View>
  );
}

// ─── Persistent pulse orb ────────────────────────────────────────────────────
// A large glowing circle that lives behind all slides and pulses continuously.
// This is immediately visible and confirms the new code is running.
function PulseOrb() {
  const sc = useSharedValue(1);
  const al = useSharedValue(0.12);
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(1.14,{duration:1800}),withTiming(0.88,{duration:1600})),-1,true);
    al.value = withRepeat(withSequence(withTiming(0.28,{duration:1400}),withTiming(0.08,{duration:1800})),-1,true);
  }, []);
  const sty = useAnimatedStyle(() => ({ transform:[{scale:sc.value}], opacity:al.value }));
  return <Animated.View style={[s.orb, sty]} pointerEvents="none" />;
}

// ─── Slide base — content only, no background ────────────────────────────────
function SlideBase({ children }: { children: React.ReactNode }) {
  return <View style={s.slide}>{children}</View>;
}

// ─── Slides ───────────────────────────────────────────────────────────────────

// ─── Slide 0: Personal welcome ───────────────────────────────────────────────
function SlideWelcome({ name, colors }: { name?: string; colors: SlideColors }) {
  const greeting = name ? `Hi ${name} 👋` : 'Hi there 👋';
  const ready    = useSharedValue(0);
  const readySc  = useSharedValue(0.88);

  useEffect(() => {
    ready.value  = withDelay(600, withTiming(1,   { duration: 600, easing: Easing.out(Easing.cubic) }));
    readySc.value = withDelay(600, withSpring(1, { damping: 12, stiffness: 100 }));
  }, []);

  const readyStyle = useAnimatedStyle(() => ({
    opacity: ready.value,
    transform: [{ scale: readySc.value }],
  }));

  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={[s.welcomeGreeting, { color: colors.text }]}>
          {greeting}
        </Animated.Text>
        <Animated.View style={readyStyle}>
          <Text style={[s.welcomeReady, { color: colors.text, textShadowColor: colors.accent + '80' }]}>
            {'Your Beauty\nWrapped is ready.'}
          </Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(1400).duration(600)} style={[s.openHint, { color: colors.muted }]}>
          tap to start  →
        </Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideOpening({ name, colors }: { name?: string; colors: SlideColors }) {
  const sc = useSharedValue(0.78);
  useEffect(() => { sc.value = withDelay(200, withSpring(1,{damping:9,stiffness:80})); }, []);
  const heroStyle = useAnimatedStyle(() => ({ transform:[{scale:sc.value}] }));
  const greeting  = name ? `Hi ${name},` : 'Hi there,';
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeIn.delay(60).duration(400)} style={[s.openGreeting, { color: colors.muted }]}>
          {greeting}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(160).duration(350)} style={[s.openSub, { color: colors.accent }]}>YOUR</Animated.Text>
        <Animated.View style={heroStyle}>
          <Text style={[s.openHero, { color: colors.text, textShadowColor: colors.accent + '80' }]}>BEAUTY{'\n'}WRAPPED</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(500).duration(400)} style={[s.openYear, { color: colors.accent }]}>2  0  2  6</Animated.Text>
        <Animated.Text entering={FadeIn.delay(1100).duration(500)} style={[s.openHint, { color: colors.muted }]}>tap to begin  →</Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideScans({ stats, colors }: { stats: WrappedStats; colors: SlideColors }) {
  const n = useCounter(stats.totalScans, 200, 900);
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeInUp.delay(60).duration(300)} style={[s.eyebrow, { color: colors.eyebrow }]}>YOUR YEAR</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150).duration(300)} style={[s.label, { color: colors.muted }]}>You showed up</Animated.Text>
        <Animated.View entering={ZoomIn.delay(220).duration(400)}>
          <Text style={[s.heroNum, { color: colors.text, textShadowColor: colors.accent + '80' }]}>{n}</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(320).duration(350)} style={[s.label, { color: colors.muted }]}>times this year</Animated.Text>
        <Animated.Text entering={FadeIn.delay(800).duration(400)} style={[s.copy, { color: colors.muted }]}>Every scan is a step toward your best self 💕</Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideBestScore({ stats, colors }: { stats: WrappedStats; colors: SlideColors }) {
  const n = useCounter(stats.bestScore, 150, 900);
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeInUp.delay(60).duration(300)} style={[s.eyebrow, { color: colors.eyebrow }]}>PERSONAL BEST</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150).duration(300)} style={[s.label, { color: colors.muted }]}>You hit</Animated.Text>
        <Animated.View entering={ZoomIn.delay(200).duration(380)}>
          <View style={{flexDirection:'row',alignItems:'flex-end',gap:4}}>
            <Text style={[s.heroNum, { color: colors.text, textShadowColor: colors.accent + '80' }]}>{n}</Text>
            <Text style={[s.heroUnit, { color: colors.muted }]}>/100</Text>
          </View>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(460).duration(400)} style={[s.goldTag, { color: colors.accent }]}>in {stats.bestScoreMonth}  ✦</Animated.Text>
        <Animated.Text entering={FadeIn.delay(900).duration(400)} style={[s.copy, { color: colors.muted }]}>That look was absolutely iconic 💅</Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideTopCategory({ stats, colors }: { stats: WrappedStats; colors: SlideColors }) {
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeInUp.delay(60).duration(300)} style={[s.eyebrow, { color: colors.eyebrow }]}>STRONGEST LOOK</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(300)} style={[s.label, { color: colors.muted }]}>You owned</Animated.Text>
        <Animated.View entering={ZoomIn.delay(200).duration(400)}>
          <Text style={[s.heroCat, { color: colors.text, textShadowColor: colors.accent + '80' }]}>{stats.topCategory.name}</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(900).duration(400)} style={[s.copy, { color: colors.muted }]}>This is your natural superpower 👑</Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideStreak({ stats, colors }: { stats: WrappedStats; colors: SlideColors }) {
  const n   = useCounter(stats.longestStreak, 200, 900);
  const rot = useSharedValue(0);
  const sc  = useSharedValue(1);
  useEffect(() => {
    rot.value = withRepeat(withSequence(withTiming(-8,{duration:260}),withTiming(8,{duration:260})),-1,true);
    sc.value  = withRepeat(withSequence(withTiming(1.18,{duration:400}),withTiming(1,{duration:400})),-1,true);
  }, []);
  const fireStyle = useAnimatedStyle(() => ({
    transform:[{rotate:`${rot.value}deg`},{scale:sc.value}],
  }));
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeInUp.delay(60).duration(300)} style={[s.eyebrow, { color: colors.eyebrow }]}>STREAK QUEEN</Animated.Text>
        <Animated.View style={fireStyle}><Text style={{fontSize:72}}>🔥</Text></Animated.View>
        <Animated.View entering={ZoomIn.delay(220).duration(380)}>
          <View style={{flexDirection:'row',alignItems:'flex-end',gap:6}}>
            <Text style={[s.heroNum, { color: colors.text, textShadowColor: colors.accent + '80' }]}>{n}</Text>
            <Text style={[s.heroUnit, { color: colors.muted }]}>days</Text>
          </View>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(900).duration(400)} style={[s.copy, { color: colors.muted }]}>Consistency is the real glow-up 🌸</Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideGlowUp({ stats, colors }: { stats: WrappedStats; colors: SlideColors }) {
  const delta = stats.endAvgScore - stats.startAvgScore;
  const d     = useCounter(Math.abs(delta), 180, 900);
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeInUp.delay(60).duration(300)} style={[s.eyebrow, { color: colors.eyebrow }]}>YOUR GLOW-UP</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(300)} style={[s.label, { color: colors.muted }]}>You grew</Animated.Text>
        <Animated.View entering={ZoomIn.delay(200).duration(380)}>
          <Text style={[s.heroNum, { color: colors.text, textShadowColor: colors.accent + '80' }]}>{delta >= 0 ? '+' : '-'}{d}</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(420).duration(350)} style={[s.sublabel, { color: colors.muted }]}>
          {stats.startAvgScore} → {stats.endAvgScore}  avg score
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(900).duration(400)} style={[s.copy, { color: colors.muted }]}>That's not luck — that's you showing up 💗</Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideMostImproved({ stats, colors }: { stats: WrappedStats; colors: SlideColors }) {
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text entering={FadeInUp.delay(60).duration(300)} style={[s.eyebrow, { color: colors.eyebrow }]}>MOST IMPROVED</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(300)} style={[s.label, { color: colors.muted }]}>You levelled up</Animated.Text>
        <Animated.View entering={ZoomIn.delay(200).duration(400)}>
          <Text style={[s.heroCat, { color: colors.text, textShadowColor: colors.accent + '80' }]}>{stats.mostImproved.name}</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(900).duration(400)} style={[s.copy, { color: colors.muted }]}>From struggling to slaying 🦋</Animated.Text>
      </View>
    </SlideBase>
  );
}

function SlideOutro({ onShare, colors }: { onShare: () => void; colors: SlideColors }) {
  const heartSc = useSharedValue(0);
  const btnSc   = useSharedValue(0.8);
  const heartR  = useSharedValue(0);
  useEffect(() => {
    heartSc.value = withDelay(100, withSpring(1,{damping:7,stiffness:100}));
    btnSc.value   = withDelay(700, withSpring(1,{damping:11}));
    heartR.value  = withDelay(150, withRepeat(withSequence(withTiming(-10,{duration:320}),withTiming(10,{duration:320})),3,true));
  }, []);
  const heartStyle = useAnimatedStyle(() => ({ transform:[{scale:heartSc.value},{rotate:`${heartR.value}deg`}] }));
  const btnStyle   = useAnimatedStyle(() => ({ transform:[{scale:btnSc.value}] }));
  return (
    <SlideBase>
      <View style={s.slideBody}>
        <Animated.Text style={[{fontSize:86},heartStyle]}>💗</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(350).duration(400)} style={[s.outroHead, { color: colors.text }]}>
          {"Here's to your\nglow-up"}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(650).duration(400)} style={[s.outroBrand, { color: colors.muted }]}>
          REMAKE  ✦  2026
        </Animated.Text>
        <Animated.View style={[{width:'100%'},btnStyle]}>
          <Pressable
            style={({pressed})=>[s.shareBtn, { backgroundColor: colors.accent === '#FF007F' ? '#FF007F' : 'rgba(255,255,255,0.14)', borderColor: colors.accent === '#FF007F' ? '#FF007F' : 'rgba(255,255,255,0.28)' }, pressed&&{opacity:0.85}]}
            onPress={onShare}
          >
            <Text style={[s.shareBtnText, { color: colors.accent === '#FF007F' ? '#FFF' : '#FFF5F9' }]}>Share your Wrapped  ↗</Text>
          </Pressable>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(1100).duration(500)} style={[s.outroNote, { color: colors.muted }]}>
          See you next year  💕
        </Animated.Text>
      </View>
    </SlideBase>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WrappedScreen() {
  const router   = useRouter();
  const params   = useLocalSearchParams<{ bypass?: string }>();
  const insets   = useSafeAreaInsets();
  const { user } = useAuth();
  
  const { user: profileUser, refreshProfile } = useUser();
  const { subscription } = useSubscription();

  const [isLocked, setIsLocked] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  // Extract first name from email (e.g. "kyle@..." → "Kyle")
  const firstName = user?.email
    ? user.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim().split(' ')[0]
    : undefined;
  const displayName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : undefined;
  const [current, setCurrent]   = useState(0);
  const colors = SLIDE_COLORS[current] ?? SLIDE_COLORS[0];
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [transDir, setTransDir] = useState<1|-1>(1);
  const [bgFrom,   setBgFrom]   = useState(0);
  const [bgTo,     setBgTo]     = useState(0);
  const morph = useSharedValue(0);
  const [stats, setStats]       = useState<WrappedStats>({
    totalScans:0, bestScore:0, bestScoreMonth:'this month',
    topCategory:{name:'Blending',avgScore:0},
    mostImproved:{name:'Colour Harmony',delta:0},
    longestStreak:0, startAvgScore:0, endAvgScore:0,
  });

  const soundRef   = useRef<Audio.Sound|null>(null);
  const preloadRef = useRef<Audio.Sound|null>(null);

  useEffect(() => {
    const uid = user?.id ?? 'guest';
    Promise.all([getScanHistory(uid,100), getScanStats(uid)])
      .then(([scans,ss])=>setStats(deriveStats(scans,ss.currentStreak)))
      .catch(()=>null);
  }, [user?.id]);

  useEffect(() => {
    const checkGating = async () => {
      try {
        if (user) {
          const supabase = createClient();
          const { count, error } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', user.id);
          
          if (!error && count !== null) {
            setReferralCount(count);
          }
        }

        const isPro = subscription?.plan === 'pro' || (__DEV__ && params.bypass === '1');
        const isUnlockedByReferral = profileUser?.shelf_audit_unlocked === true || referralCount >= 3;

        if (isPro || isUnlockedByReferral) {
          setIsLocked(false);
        } else {
          setIsLocked(true);
        }
      } catch (err) {
        console.warn('[Wrapped Gating] error checking status:', err);
      }
    };

    checkGating();
  }, [subscription, profileUser, referralCount, user]);

  const handleShareReferral = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const refCode = profileUser?.referral_code || 'BESTIE';
    const shareLink = `https://remake.app/join?ref=${refCode}`;
    const shareMessage = `wait bestie scan your makeup on Remake immediately 😭 literally half my routine was NOT ACNE SAFE and clogging my pores. Scan your makeup here to see your Clean Girl Index!!: ${shareLink}`;

    try {
      const result = await Share.share({
        message: shareMessage,
      });
      if (result.action === Share.sharedAction) {
        await refreshProfile();
      }
    } catch (err) {
      console.warn('[Referral] Share error:', err);
    }
  };

  // Start music immediately if not locked
  useEffect(() => {
    if (isLocked) return;
    
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS:true, staysActiveInBackground:false });
        const { sound } = await Audio.Sound.createAsync(MUSIC_MAIN,{ isLooping:true, volume:MUSIC_VOL });
        if (!mounted) { sound.unloadAsync(); return; }
        soundRef.current = sound;
        await sound.playAsync();
      } catch {}
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(()=>{});
      soundRef.current = null;
      preloadRef.current?.unloadAsync().catch(()=>{});
      preloadRef.current = null;
    };
  }, [isLocked]);

  // Preload outro track, crossfade at slide 7
  useEffect(() => {
    if (current === PRELOAD_SLIDE && !preloadRef.current) {
      (async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(MUSIC_OUTRO,{ isLooping:true, volume:0 });
          preloadRef.current = sound;
          await sound.playAsync();
        } catch {}
      })();
    }
    if (current === OUTRO_SLIDE) {
      const prev = soundRef.current;
      const next = preloadRef.current;
      if (!prev || !next) return;
      preloadRef.current = null;
      soundRef.current = next;
      (async () => {
        for (let i=1; i<=CROSSFADE_STEPS; i++) {
          const pct = i/CROSSFADE_STEPS;
          await Promise.allSettled([next.setVolumeAsync(MUSIC_VOL*pct), prev.setVolumeAsync(MUSIC_VOL*(1-pct))]);
          await new Promise<void>(r=>setTimeout(r,CROSSFADE_STEP_MS));
        }
        try { await prev.unloadAsync(); } catch {}
      })();
    }
  }, [current]);

  const currentRef  = useRef(0);
  const isAnimating = useRef(false);
  const tapLocked   = useRef(false);  // prevents skipping during the reveal animation
  useEffect(() => { currentRef.current = current; }, [current]);

  const containerX     = useSharedValue(0);
  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: containerX.value }] }));
  const progress       = useSharedValue(0);
  const activeBarStyle = useAnimatedStyle(() => ({ width: progress.value * SEG_W }));

  const endTransition = useCallback((toIdx: number) => {
    setPrevSlide(null);
    containerX.value = 0;
    morph.value = 0;
    setBgFrom(toIdx);
    setBgTo(toIdx);
    isAnimating.current = false;
    tapLocked.current = true;
    setTimeout(() => { tapLocked.current = false; }, TAP_LOCK_MS);
  }, []);

  const goTo = useCallback((to: number, dir: 1|-1) => {
    if (isAnimating.current || tapLocked.current) return;
    isAnimating.current = true;
    cancelAnimation(progress);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBgFrom(currentRef.current);
    setBgTo(to);
    morph.value = 0;
    morph.value = withTiming(1, { duration: TRANSITION_MS + 160, easing: Easing.out(Easing.quad) });
    setPrevSlide(currentRef.current);
    setTransDir(dir);
    setCurrent(to);
    containerX.value = 0;
    containerX.value = withTiming(-dir * W, { duration: TRANSITION_MS, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(endTransition)(to); });
  }, [endTransition]);

  const advance = useCallback(() => {
    const next = currentRef.current+1;
    if (next >= TOTAL) { router.back(); return; }
    goTo(next,1);
  }, [goTo,router]);

  const retreat = useCallback(() => {
    const prev = currentRef.current-1;
    if (prev < 0) return;
    goTo(prev,-1);
  }, [goTo]);

  useEffect(() => {
    if (isAnimating.current) return;
    progress.value = 0;
    const tid = setTimeout(() => {
      progress.value = withTiming(1,{duration:SLIDE_DURATION,easing:Easing.linear},
        (done)=>{ if(done) runOnJS(advance)(); });
    }, TRANSITION_MS+50);
    return () => { clearTimeout(tid); cancelAnimation(progress); };
  }, [current]);

  const slides = [
    <SlideWelcome name={displayName} colors={SLIDE_COLORS[0]} />,
    <SlideOpening name={displayName} colors={SLIDE_COLORS[1]} />,
    <SlideScans stats={stats} colors={SLIDE_COLORS[2]} />,
    <SlideBestScore stats={stats} colors={SLIDE_COLORS[3]} />,
    <SlideTopCategory stats={stats} colors={SLIDE_COLORS[4]} />,
    <SlideStreak stats={stats} colors={SLIDE_COLORS[5]} />,
    <SlideGlowUp stats={stats} colors={SLIDE_COLORS[6]} />,
    <SlideMostImproved stats={stats} colors={SLIDE_COLORS[7]} />,
    <SlideOutro onShare={()=>Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)} colors={SLIDE_COLORS[8]} />,
  ];

  return (
    <View style={s.root}>
      {/* Persistent morphing background — never slides or unmounts */}
      <MorphingBg fromIdx={bgFrom} toIdx={bgTo} morph={morph} />

      {/* Persistent glow orb — clearly visible pulsing circle */}
      <PulseOrb />

      {/* Persistent sparkles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Sparkles count={10} />
      </View>

      {/* Slides slide horizontally */}
      <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
        {prevSlide !== null && (
          <View key={prevSlide} style={StyleSheet.absoluteFill}>{slides[prevSlide]}</View>
        )}
        <View key={current} style={[StyleSheet.absoluteFill, prevSlide !== null && { left: transDir * W }]}>
          {slides[current]}
        </View>
      </Animated.View>

      {/* Tap zones */}
      <View style={s.tapZones} pointerEvents="box-none">
        <Pressable style={s.tapLeft} onPress={retreat} />
        <Pressable style={s.tapRight} onPress={advance} />
      </View>

      {/* Progress + close */}
      <View style={[s.topRow, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <View style={s.progressSegs} pointerEvents="none">
          {Array.from({length:TOTAL}).map((_,i)=>(
            <View key={i} style={[s.seg, { backgroundColor: colors.text === '#FFFFFF' || colors.text === '#FFEEDD' ? 'rgba(255,240,247,0.15)' : 'rgba(0,0,0,0.1)' }]}>
              {i < current ? (
                <View style={[s.segFill, s.segDone, { backgroundColor: colors.text }]} />
              ) : i===current ? (
                <Animated.View style={[s.segFill, s.segActive, { backgroundColor: colors.text }, activeBarStyle]} />
              ) : null}
            </View>
          ))}
        </View>
        <Pressable hitSlop={12} style={[s.closeBtn, { backgroundColor: colors.text === '#FFFFFF' || colors.text === '#FFEEDD' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]} onPress={()=>router.back()}>
          <Text style={[s.closeTxt, { color: colors.text }]}>✕</Text>
        </Pressable>
      </View>

      {isLocked && (
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFillObject}>
          <View style={s.lockContainer}>
            <View style={s.lockCard}>
              <View style={s.lockIconBg}>
                <MaterialIcons name="lock-outline" size={40} color={tokens.colors.pinkDeep} />
              </View>
              <Text style={s.lockTitle}>Unlock Beauty Wrapped 🎀</Text>
              <Text style={s.lockSubtitle}>
                See your customized Clean Girl Index and pore-clogging routine analysis. Unlock now!
              </Text>

              <Pressable onPress={() => router.push('/(main)/paywall')} style={s.lockPrimaryBtn}>
                <Text style={s.lockPrimaryBtnTxt}>Go Unlimited Premium ($29.99/yr) 👑</Text>
              </Pressable>

              <Pressable onPress={handleShareReferral} style={s.lockSecondaryBtn}>
                <Text style={s.lockSecondaryBtnTxt}>Invite 3 Besties to Unlock Free 💖</Text>
              </Pressable>

              <View style={s.progressRow}>
                <Text style={s.progressLbl}>Invite Progress: [{referralCount} / 3] Joined! 🎀</Text>
                <View style={s.dotsGrid}>
                  {[1, 2, 3].map(i => (
                    <View 
                      key={i} 
                      style={[
                        s.dot, 
                        referralCount >= i ? s.dotActive : s.dotInactive
                      ]} 
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:'#1A0414' },
  orb: {
    position:'absolute', width:W*0.9, height:W*0.9, borderRadius:W*0.45,
    top:H*0.12, left:W*0.05,
    backgroundColor:tokens.colors.pinkDeep,
    shadowColor:tokens.colors.pinkDeep, shadowOffset:{width:0,height:0},
    shadowOpacity:0.6, shadowRadius:80, elevation:0,
  },

  slide: { flex:1 },
  slideBody: {
    flex:1, alignItems:'center', justifyContent:'center',
    paddingHorizontal:28, paddingTop:64, paddingBottom:60, gap:12,
  },

  // Eyebrow
  eyebrow: {
    fontFamily:tokens.fonts.regular, fontSize:11, fontWeight:'700',
    letterSpacing:4, textTransform:'uppercase', color:'rgba(255,255,255,0.45)',
  },

  // Label
  label: {
    fontFamily:tokens.fonts.serif, fontSize:22, fontStyle:'italic',
    color:'rgba(255,240,247,0.75)', textAlign:'center',
  },
  sublabel: {
    fontFamily:tokens.fonts.regular, fontSize:13, color:'rgba(255,240,247,0.5)',
    letterSpacing:0.3, textAlign:'center',
  },

  // Hero number — THE stat
  heroNum: {
    fontFamily:tokens.fonts.serif, fontSize:116, fontWeight:'400',
    color:'#FFF5F9', letterSpacing:-4, lineHeight:122,
    // Deep glow — makes the number "pop" off the background like Spotify Wrapped
    textShadowColor:'rgba(232,57,154,0.65)', textShadowOffset:{width:0,height:0}, textShadowRadius:52,
  },
  heroUnit: {
    fontFamily:tokens.fonts.regular, fontSize:24, color:'rgba(255,240,247,0.45)',
    marginBottom:18,
  },

  // Hero category name
  heroCat: {
    fontFamily:tokens.fonts.serif, fontSize:56, fontStyle:'italic',
    color:'#FFF5F9', textAlign:'center', lineHeight:64,
    textShadowColor:'rgba(232,57,154,0.6)', textShadowOffset:{width:0,height:0}, textShadowRadius:44,
  },

  // Body copy
  copy: {
    fontFamily:tokens.fonts.regular, fontSize:14, color:'rgba(255,214,239,0.6)',
    textAlign:'center', lineHeight:22, maxWidth:W*0.76, marginTop:6,
  },

  // Gold accent tag
  goldTag: {
    fontFamily:tokens.fonts.regular, fontSize:14, fontWeight:'600',
    color:tokens.colors.gold, letterSpacing:0.6,
  },

  // Opening slide
  // Welcome slide
  welcomeGreeting: {
    fontFamily:tokens.fonts.serif, fontSize:34, fontWeight:'400',
    color:'rgba(255,240,247,0.85)', textAlign:'center', lineHeight:42,
  },
  welcomeReady: {
    fontFamily:tokens.fonts.serif, fontSize:54, fontWeight:'400',
    color:'#FFF5F9', textAlign:'center', lineHeight:62, letterSpacing:0.2,
    textShadowColor:'rgba(232,57,154,0.5)',
    textShadowOffset:{width:0,height:0}, textShadowRadius:40,
  },

  openGreeting: {
    fontFamily:tokens.fonts.serif, fontSize:22, fontStyle:'italic',
    color:'rgba(255,214,239,0.75)', textAlign:'center', letterSpacing:0.3,
    marginBottom:-4,
  },
  openSub: {
    fontFamily:tokens.fonts.regular, fontSize:13, fontWeight:'700',
    letterSpacing:8, color:'rgba(255,170,217,0.65)', marginBottom:-8,
  },
  openHero: {
    fontFamily:tokens.fonts.serif, fontSize:68, color:'#FFF5F9',
    textAlign:'center', lineHeight:74, letterSpacing:0.5,
  },
  openYear: {
    fontFamily:tokens.fonts.regular, fontSize:12, fontWeight:'500',
    letterSpacing:10, color:tokens.colors.gold, marginTop:4,
  },
  openHint: {
    fontFamily:tokens.fonts.regular, fontSize:13,
    color:'rgba(255,170,217,0.35)', letterSpacing:1, marginTop:20,
  },

  // Outro
  outroHead: {
    fontFamily:tokens.fonts.serif, fontSize:46, color:'#FFF5F9',
    textAlign:'center', lineHeight:54, letterSpacing:0.2,
  },
  outroBrand: {
    fontFamily:tokens.fonts.regular, fontSize:10, fontWeight:'700',
    letterSpacing:4.5, color:'rgba(255,240,247,0.35)',
  },
  outroNote: {
    fontFamily:tokens.fonts.regular, fontSize:14,
    color:'rgba(255,214,239,0.5)', marginTop:6,
  },
  shareBtn: {
    paddingVertical:17, borderRadius:50,
    backgroundColor:'rgba(255,255,255,0.14)',
    borderWidth:1.5, borderColor:'rgba(255,255,255,0.28)',
    alignItems:'center',
  },
  shareBtnText: {
    fontFamily:tokens.fonts.regular, fontSize:15, fontWeight:'700',
    color:'#FFF5F9', letterSpacing:0.3,
  },

  // Progress / close
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection:'row', zIndex:10 },
  tapLeft:  { width:W*0.28, height:'100%' },
  tapRight: { flex:1, height:'100%' },
  topRow: {
    position:'absolute', top:0, left:0, right:0,
    flexDirection:'row', alignItems:'center',
    paddingHorizontal:14, paddingBottom:10, gap:10, zIndex:30,
  },
  progressSegs: { flex:1, flexDirection:'row', gap:4 },
  seg: {
    flex:1, height:2.5, borderRadius:1.5, overflow:'hidden',
    backgroundColor:'rgba(255,240,247,0.15)',
  },
  segFill:   { height:'100%', borderRadius:1.5 },
  segDone:   { backgroundColor:'rgba(255,240,247,0.65)', width:'100%' },
  segActive: { backgroundColor:'#FFF5F9', width:'100%' },
  closeBtn: {
    width:28, height:28, borderRadius:14,
    backgroundColor:'rgba(255,255,255,0.12)',
    justifyContent:'center', alignItems:'center',
  },
  closeTxt:  { color:'rgba(255,240,247,0.65)', fontSize:13 },

  // Shared bars
  barTrack: { height:5, borderRadius:2.5, backgroundColor:'rgba(255,255,255,0.1)', overflow:'hidden' },
  barFill:  { height:'100%', borderRadius:2.5 },

  // Gated Lock Styles
  lockContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(26, 4, 20, 0.65)',
    zIndex: 999,
  },
  lockCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.pinkMid,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  lockIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFF0EB',
  },
  lockTitle: {
    fontFamily: tokens.fonts.serif,
    fontStyle: 'italic',
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  lockPrimaryBtn: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  lockPrimaryBtnTxt: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  lockSecondaryBtn: {
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.pinkMid,
    marginBottom: 16,
  },
  lockSecondaryBtnTxt: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.pinkDeep,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: 14,
  },
  progressLbl: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: tokens.colors.pinkDeep,
  },
  dotInactive: {
    backgroundColor: '#E8DDD8',
  },
});
