import { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle } from 'react-native';

interface Props {
  value: string;
  style?: TextStyle;
  duration?: number;
}

export default function AnimatedNumber({ value, style, duration = 600 }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -8, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setDisplay(value);
      translateY.setValue(8);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [value]);

  return (
    <Animated.Text style={[style, { opacity, transform: [{ translateY }] }]}>
      {display}
    </Animated.Text>
  );
}
