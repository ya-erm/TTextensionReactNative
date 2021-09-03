import { Position } from '/models/position';
import * as React from 'react';
import { useEffect } from 'react';
import { SectionList, StyleSheet, TouchableHighlight } from 'react-native';
import { InstrumentType, PortfolioPosition, PortfolioResponse } from '/api/client';
import { portfolioClient } from '/api/httpClient';
import useApi from '/api/useApi';
import SettingsGroup from '/components/Settings/SettingsGroup';
import { Text, View } from '/components/Themed';
import { useSettings } from '/hooks/useSettings';

export default function PortfolioScreen() {
  const { settings } = useSettings();

  const { loading, data, fetch } = useApi({
    initial: {} as PortfolioResponse,
    fetchData: portfolioClient.portfolio,
  });

  useEffect(() => {
    if (settings) {
      fetch(settings.account?.brokerAccountId);
    }
  }, [fetch, settings]);

  const positionsByType = data?.payload?.positions.reduce((result, item) => {
    (result[item.instrumentType] = result[item.instrumentType] || []).push(item);
    return result;
  }, {} as { [key in InstrumentType]: PortfolioPosition[] });

  const groups = Object.entries(positionsByType ?? {}).map(([type, positions]) => ({
    title: type,
    data: positions.map((position) => new Position('TODO_portfolioID', position)),
  }));

  return (
    <SectionList
      sections={groups}
      keyExtractor={(item: Position) => item.figi}
      renderItem={({ item, separators }) => {
        return (
          <TouchableHighlight
            key={item.figi}
            onPress={() => {}}
            onShowUnderlay={separators.highlight}
            onHideUnderlay={separators.unhighlight}
          >
            <View style={styles.listItem}>
              <View style={styles.itemImage}>
                <Text style={styles.itemImageLetter}>{item.ticker?.slice(0, 1)}</Text>
              </View>
              <View style={styles.itemInfo}>
                <View>
                  <Text>{item.printTitle()}</Text>
                  <Text>{`${item.printQuantity()} • ${item.printAveragePrice(
                    false,
                  )} → ${item.printPrice()}`}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text>{item.printCost()}</Text>
                  <Text>{item.printExpected()}</Text>
                </View>
              </View>
            </View>
          </TouchableHighlight>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderSectionHeader={({ section: { title } }) => <SettingsGroup title={title} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {},
  listItem: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'blue',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImageLetter: {
    color: 'white',
    fontSize: 18,
  },
  itemInfo: {
    marginLeft: 10,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemRight: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  separator: {
    backgroundColor: '#d3d3d3',
    height: 1,
  },
});
