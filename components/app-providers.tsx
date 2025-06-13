"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

declare global {
  interface Window {
    ZOHO: {
      embeddedApp: any;
      CRM: {
        API: any;
        UI: any;
        META: any;
      };
    };
  }
}

type ZohoData = {
  Entity: string;
  EntityId: string;
  IsButton: boolean;
};

type ZohoContextType = {
  zoho: ZohoData | null;
};

export const ZohoContext = createContext<ZohoContextType | null>(null);

export default function ZohoContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [zoho, setZoho] = useState<ZohoData | null>(null);

  useEffect(() => {
    if (window.ZOHO) {
      window.ZOHO.embeddedApp.on("PageLoad", (data: ZohoData) => {
        setZoho({
          Entity: data.Entity,
          EntityId: Array.isArray(data.EntityId)
            ? data.EntityId?.[0]
            : data.EntityId,
          IsButton: Array.isArray(data.EntityId),
        });
        const width = window.screen.width / 1.75;
        const height = window.screen.height;
        window.ZOHO.CRM.UI.Resize({ height: height, width: width });
      });
      window.ZOHO.embeddedApp.init();
    }
  }, []);

  return (
    <ZohoContext.Provider value={{ zoho }}>{children}</ZohoContext.Provider>
  );
}

export const useZohoContext = () => {
  const context = useContext(ZohoContext);
  if (!context) throw new Error("Zoho Context must be initialized.");
  return context;
};
