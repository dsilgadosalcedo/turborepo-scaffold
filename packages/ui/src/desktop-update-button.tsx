"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";

type UpdateState = {
  percent?: number;
  status:
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";
  version?: string;
};

type DesktopApi = {
  checkForUpdates: () => Promise<void>;
  getUpdateState: () => Promise<UpdateState>;
  installUpdate: () => Promise<void>;
  onUpdateState: (callback: (state: UpdateState) => void) => () => void;
};

function getDesktopApi(): DesktopApi | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { desktop?: DesktopApi }).desktop;
}

function getLabel(state: UpdateState) {
  switch (state.status) {
    case "checking":
      return "Buscando actualizacion";
    case "available":
    case "downloading":
      return state.percent
        ? `Descargando ${Math.round(state.percent)}%`
        : "Descargando actualizacion";
    case "downloaded":
      return "Actualizar";
    case "error":
      return "Error de actualizacion";
    default:
      return "";
  }
}

export function DesktopUpdateButton() {
  const [state, setState] = useState<UpdateState>({ status: "idle" });
  const api = getDesktopApi();

  useEffect(() => {
    if (!api) {
      return;
    }

    let mounted = true;

    void api.getUpdateState().then((nextState) => {
      if (mounted) {
        setState(nextState);
      }
    });

    const unsubscribe = api.onUpdateState((nextState) => {
      if (mounted) {
        setState(nextState);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [api]);

  if (!api) {
    return null;
  }

  if (state.status === "idle" || state.status === "not-available") {
    return (
      <Button
        onClick={() => {
          void api.checkForUpdates();
        }}
        size="sm"
        variant="secondary"
      >
        Buscar actualizaciones
      </Button>
    );
  }

  return (
    <Button
      disabled={state.status !== "downloaded"}
      onClick={() => {
        if (state.status === "downloaded") {
          void api.installUpdate();
        }
      }}
      size="sm"
      variant={state.status === "downloaded" ? "default" : "secondary"}
    >
      {getLabel(state)}
    </Button>
  );
}
