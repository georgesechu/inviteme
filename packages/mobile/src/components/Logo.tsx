import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function Logo({ size = 'md', showIcon = true }: LogoProps) {
  const sizeStyles = {
    sm: { fontSize: 18, iconSize: 16 },
    md: { fontSize: 24, iconSize: 20 },
    lg: { fontSize: 32, iconSize: 24 },
  };

  const { fontSize, iconSize } = sizeStyles[size];

  return (
    <View style={styles.container}>
      {showIcon && (
        <Feather
          name="message-circle"
          size={iconSize}
          color="#16a34a" // green-600
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { fontSize }]}>
        <Text style={styles.wa}>WA</Text>
        <Text style={styles.geni}>geni</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: 'bold',
  },
  wa: {
    color: '#16a34a', // green-600
  },
  geni: {
    color: '#000000', // black
  },
});

