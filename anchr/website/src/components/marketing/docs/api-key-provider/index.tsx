"use client";

import * as React from "react";
import { ApiKeyContext } from "../api-key-context";

export { useApiKey } from "../api-key-context";

export type ApiKeyProviderProps = React.PropsWithChildren;

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = (props) => {
  const { children } = props;

  //* State
  const [apiKey, setApiKey] = React.useState("");

  //* Variables
  const value = React.useMemo(
    () => ({
      apiKey,
      setApiKey,
      clearApiKey: () => setApiKey(""),
    }),
    [apiKey],
  );

  return <ApiKeyContext value={value}>{children}</ApiKeyContext>;
};
