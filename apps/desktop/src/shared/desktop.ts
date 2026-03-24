export type UpdateState = {
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

export type DesktopRuntimeInfo = {
  currentVersion: string;
  isDesktop: true;
  isPackaged: boolean;
  supportsAutoUpdates: boolean;
  updateState: UpdateState;
};
