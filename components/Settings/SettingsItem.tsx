import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '/components/Themed';

export type ISettingsItemProps = {
  children?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
};

export default function SettingsItem({ children, isFirst, isLast }: ISettingsItemProps) {
  return (
    <>
      <View style={{ paddingTop: isFirst ? 0 : 7, paddingBottom: isLast ? 0 : 7 }}>{children}</View>
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
