import { useEffect, useState } from "react";
import * as Updates from "expo-updates";

export type OTAStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date";

export interface OTAState {
  status: OTAStatus;
  message: string | null;
  isUpdateAvailable: boolean;
}

const INITIAL: OTAState = {
  status: "idle",
  message: null,
  isUpdateAvailable: false,
};

/**
 * Checks for OTA updates on mount.
 * In development (Expo Go / dev-client) updates are skipped.
 * Call `applyUpdate()` to reload the app with the new bundle.
 */
export function useOTAUpdate() {
  const [state, setState] = useState<OTAState>(INITIAL);

  const applyUpdate = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      setState((prev) => ({
        ...prev,
        status: "error",
        message: "Falha ao aplicar atualização.",
      }));
    }
  };

  useEffect(() => {
    // Skip in development mode
    if (__DEV__) {
      return;
    }

    (async () => {
      setState({ status: "checking", message: null, isUpdateAvailable: false });

      try {
        const check = await Updates.checkForUpdateAsync();

        if (!check.isAvailable) {
          setState({
            status: "up-to-date",
            message: null,
            isUpdateAvailable: false,
          });
          return;
        }

        setState((prev) => ({
          ...prev,
          status: "downloading",
          isUpdateAvailable: false,
        }));
        await Updates.fetchUpdateAsync();
        setState({
          status: "ready",
          message: "Nova versão disponível.",
          isUpdateAvailable: true,
        });
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Erro desconhecido ao verificar atualizações.";
        setState({ status: "error", message, isUpdateAvailable: false });
      }
    })();
  }, []);

  return { otaState: state, applyUpdate };
}
