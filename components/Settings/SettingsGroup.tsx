import React from 'react';
import { StyleSheet } from 'react-native';
import { ISettingsItemProps } from './SettingsItem';
import { Text, View } from '/components/Themed';

type ISettingsGroupProps = {
  title: string;
  children?: React.ReactNode;
};

export default function SettingsGroup({ title, children }: ISettingsGroupProps) {
  const items = React.Children.map(children, (child, index) =>
    React.cloneElement(
      child as React.ReactElement,
      {
        isFirst: index == 0,
        isLast: !Array.isArray(children) || index == children.length - 1,
      } as ISettingsItemProps,
    ),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.group}>{items}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    opacity: 0.4,
    marginBottom: 10,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  group: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
