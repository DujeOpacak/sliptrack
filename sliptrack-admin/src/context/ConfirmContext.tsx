import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "../components/Modal";

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
}

interface ConfirmContextValue {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ message, ...options });
    });
  }, []);

  function settle(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <Modal title={state.title ?? "Potvrda"} onClose={() => settle(false)}>
          <p style={{ marginBottom: 20, fontSize: 13, color: "var(--text-primary)" }}>{state.message}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="btn" onClick={() => settle(false)}>
              Odustani
            </button>
            <button
              type="button"
              className={state.danger ? "btn btn-danger" : "btn btn-primary"}
              onClick={() => settle(true)}
            >
              {state.confirmLabel ?? "Potvrdi"}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue["confirm"] {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context.confirm;
}
