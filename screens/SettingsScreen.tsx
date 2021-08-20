import * as React from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import SettingsGroup from '/components/Settings/SettingsGroup';
import SettingsItem from '/components/Settings/SettingsItem';
import { Text } from '/components/Themed';

export default function SettingsScreen() {
  return (
    <ScrollView>
      <SettingsGroup title="Security">
        <TextInput placeholder="Token" />
      </SettingsGroup>
      <SettingsGroup title="Portfolios">
        <SettingsItem>
          <Text>Select account</Text>
        </SettingsItem>
      </SettingsGroup>
      <SettingsGroup title="Positions">
        <SettingsItem>
          <Text>TODO</Text>
        </SettingsItem>
        <SettingsItem>
          <Text>TODO</Text>
        </SettingsItem>
        <SettingsItem>
          <Text>TODO</Text>
        </SettingsItem>
      </SettingsGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
