import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Place, RouteOption, SearchType } from '@routecard/shared';

interface RouteSearchState {
  origin: Place | null;
  destination: Place | null;
  time: Date;
  searchType: SearchType;
  options: RouteOption[];
  selected: RouteOption | null;
}

interface RouteSearchContextValue extends RouteSearchState {
  setOrigin: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  setTime: (time: Date) => void;
  setSearchType: (type: SearchType) => void;
  setOptions: (options: RouteOption[]) => void;
  setSelected: (option: RouteOption | null) => void;
  swapOriginDestination: () => void;
}

const RouteSearchContext = createContext<RouteSearchContextValue | null>(null);

export function RouteSearchProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [time, setTime] = useState(() => new Date(Date.now() + 10 * 60 * 1000));
  const [searchType, setSearchType] = useState<SearchType>('departure');
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selected, setSelected] = useState<RouteOption | null>(null);

  const value = useMemo<RouteSearchContextValue>(
    () => ({
      origin,
      destination,
      time,
      searchType,
      options,
      selected,
      setOrigin,
      setDestination,
      setTime,
      setSearchType,
      setOptions,
      setSelected,
      swapOriginDestination: () => {
        setOrigin(destination);
        setDestination(origin);
      },
    }),
    [origin, destination, time, searchType, options, selected]
  );

  return <RouteSearchContext.Provider value={value}>{children}</RouteSearchContext.Provider>;
}

export function useRouteSearch(): RouteSearchContextValue {
  const ctx = useContext(RouteSearchContext);
  if (!ctx) throw new Error('useRouteSearch must be used within RouteSearchProvider');
  return ctx;
}
