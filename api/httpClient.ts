import {
  MarketClient,
  OperationsClient,
  OrdersClient,
  PortfolioClient,
  UserClient,
} from './client';
import { binder, fetchWithTimeout, getApiEndpoint } from './utils';
import { ISettings, settingsStorageKey } from '/hooks/useSettings';
import { useStorage } from '/hooks/useStorage';

const client = {
  fetch: async (url: RequestInfo, init?: RequestInit) => {
    const { getData } = useStorage();
    if (init !== undefined) {
      const settings = (await getData(settingsStorageKey)) as ISettings;
      const authToken = settings?.token;
      if (authToken) {
        init.headers = {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${authToken}`,
        };
      }
    }

    return fetchWithTimeout(url, init) as Promise<Response>;
  },
};

const apiEndpoint = 'https://api-invest.tinkoff.ru/openapi';

export const ordersClient = binder(new OrdersClient(apiEndpoint, client), OrdersClient);
export const marketClient = binder(new MarketClient(apiEndpoint, client), MarketClient);
export const portfolioClient = binder(new PortfolioClient(apiEndpoint, client), PortfolioClient);
export const operationsClient = binder(new OperationsClient(apiEndpoint, client), OperationsClient);
export const userClient = binder(new UserClient(apiEndpoint, client), UserClient);
