import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/lib/theme';

interface WakeButtonProps {
  onStop: () => void;
  disabled?: boolean;
}

const HOLD_DURATION = 2000;

export function WakeButton({ onStop, disabled }: WakeButtonProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleComplete = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStop();
  };

  const gesture = Gesture.Tap()
    .maxDuration(HOLD_DURATION + 1000)
    .onBegin(() => {
      if (disabled) {
        return;
      }

      scale.value = withTiming(0.9, { duration: 200 });
      progress.value = withTiming(
        1,
        {
          duration: HOLD_DURATION,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            runOnJS(handleComplete)();
          }
        },
      );
    })
    .onFinalize(() => {
      scale.value = withTiming(1, { duration: 200 });

      if (progress.value < 1) {
        cancelAnimation(progress);
        progress.value = withTiming(0, { duration: 300 });
      }
    });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.button, animatedButtonStyle, disabled && styles.disabled]}>
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
          </View>
          <Text style={styles.text}>HOLD TO STOP</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    height: 120,
    width: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#000',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    zIndex: 10,
  },
  progressContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 0,
  },
});
