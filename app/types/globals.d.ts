declare global {
    interface Window {
      Telegram?: {
        WebApp: {
          initDataUnsafe: {
            user?: {
              id: number;
            };
          };
          ready: () => void;
        };
      };
    }
  }
  
  export {};