import { useState, useCallback, Dispatch, SetStateAction, useRef } from 'react';

type IUseApiProps<TResponse, TParams extends any[]> = {
  initialLoading?: boolean;
  initial: TResponse;
  fetchData: (...params: TParams) => Promise<TResponse>;
};

export default function useApi<TResponse, TParams extends any[]>({
  initial,
  fetchData,
  initialLoading = true,
}: IUseApiProps<TResponse, TParams>) {
  const initialRef = useRef(initial);
  const [state, setState] = useState(initial);
  const firstFetch = useRef(false);
  const [loading, setLoading] = useState(0);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(
    (...params: Parameters<typeof fetchData>) => {
      firstFetch.current = true;
      setLoading((l) => l + 1);
      setError(null);

      return fetchData(...params)
        .then(
          (resp) => {
            setState(resp);
            return resp;
          },
          (e) => {
            setError(e);
            throw e;
          },
        )
        .finally(() => {
          setLoading((l) => l - 1);
        });
    },
    [fetchData],
  );

  const fetchMore = useCallback(
    (
        handlePromise: (
          promise: Promise<TResponse>,
          setState: Dispatch<SetStateAction<TResponse>>,
          setError: Dispatch<SetStateAction<null>>,
        ) => Promise<TResponse>,
      ) =>
      (...params: Parameters<typeof fetchData>) => {
        setLoading((l) => l + 1);
        setError(null);
        handlePromise(fetchData(...params), setState, setError).finally(() =>
          setLoading((l) => l - 1),
        );
      },
    [fetchData],
  );

  const resetData = useCallback(() => {
    setState(initialRef.current);
    setError(null);
  }, []);

  return {
    data: state,
    loading: firstFetch.current ? loading > 0 : initialLoading,
    firstFetchDone: firstFetch.current,
    error,
    fetch,
    fetchMore,
    resetData,
    setData: setState,
  };
}
