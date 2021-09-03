import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ListRenderItem, StyleSheet, TouchableHighlight } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { TabSettingsParamList } from 'types';
import { UserAccount } from '/api/client';
import { userClient } from '/api/httpClient';
import { Text, View } from '/components/Themed';
import { useSettings } from '/hooks/useSettings';

type NavigationProp = StackNavigationProp<TabSettingsParamList, 'SettingsScreen'>;

export default function SelectAccountScreen() {
  const { navigate } = useNavigation<NavigationProp>();
  const { settings, setSettings } = useSettings();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);

  useEffect(() => {
    if (settings.token) {
      userClient
        .accounts()
        .then((response) => {
          setAccounts(response.payload.accounts);
        })
        .catch((e) => console.log(e));
    }
  }, [settings.token]);

  const selectAccount = (account: UserAccount) => {
    setSettings({ account: account });
    navigate('SettingsScreen');
  };

  return (
    <FlatList
      data={accounts}
      keyExtractor={(item: UserAccount) => item.brokerAccountId}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={
        (({ item, separators }) => (
          <TouchableHighlight
            key={item.brokerAccountId}
            onPress={() => selectAccount(item)}
            onShowUnderlay={separators.highlight}
            onHideUnderlay={separators.unhighlight}
          >
            <View>
              <Text style={styles.listItem}>
                {item.brokerAccountType} {item.brokerAccountId}
              </Text>
            </View>
          </TouchableHighlight>
        )) as ListRenderItem<UserAccount>
      }
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#d3d3d3',
  },
  listItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});
