import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "@/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@/styles/globals.css";
import { WalletHandler } from "~~/components/WalletHandler";
import { getMetadata } from "@/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({ 
  title: "FansCommunity:A Scaffold-ETH 2 App", 
  description: "Built with 🏗 Scaffold-ETH 2" 
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            <WalletHandler />
            {children}
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
