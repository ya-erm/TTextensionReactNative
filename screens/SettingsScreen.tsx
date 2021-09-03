import { Link, useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import SettingsGroup from '/components/Settings/SettingsGroup';
import SettingsItem from '/components/Settings/SettingsItem';
import { Text } from '/components/Themed';
import { useSettings } from '/hooks/useSettings';

export default function SettingsScreen() {
  const { settings, setSettings } = useSettings();

  return (
    <ScrollView>
      <SettingsGroup title="Security">
        <SettingsItem>
          <TextInput
            placeholder="Token"
            style={styles.textInput}
            value={settings.token ?? ''}
            onChangeText={(value) => setSettings({ token: value })}
          />
        </SettingsItem>
      </SettingsGroup>
      <SettingsGroup title="Portfolio">
        <SettingsItem>
          <Link to={{ screen: 'SelectAccountScreen' }}>
            {settings.account
              ? `${settings.account.brokerAccountType} ${settings.account.brokerAccountId}`
              : 'Select account'}
          </Link>
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
  textInput: {
    borderRadius: 10,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
});
