import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '/components/Themed';

export type ISettingsItemProps = {
  children?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
};

export default function SettingsItem({ children, isFirst, isLast }: ISettingsItemProps) {
  const clone = React.cloneElement(children as React.ReactElement, {
    style: [
      {
        paddingHorizontal: 15,
        paddingVertical: 10,
      },
      (children as React.ReactElement)?.props?.style,
    ],
  });
  return (
    <>
      {clone}
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.15,
    backgroundColor: 'gray',
  },
});
