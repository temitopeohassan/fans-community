"use client";

import { useState, useEffect } from "react";
import { ModeToggle } from "~~/components/mode-toggle";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Input } from "~~/components/ui/input";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useAccount } from 'wagmi';
import { getCreatorByAddress } from "~~/services/api/creators";

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      if (!address) return;
      try {
        await getCreatorByAddress(address);
        setHasProfile(true);
      } catch (error) {
        setHasProfile(false);
      }
    }
    checkProfile();
  }, [address]);

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex relative w-10 h-10">
          <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
        </div>
        <Link href="/" className="font-semibold text-xl mr-6">
          Fans Community
        </Link>
        
        {isConnected && (
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search creators..." className="pl-8" />
            </div>
            <nav className="flex items-center space-x-4 mx-6">
              <Link href="/explore" className="text-sm font-medium">
                Explore
              </Link>
              <Link 
                href={hasProfile ? `/creator/${address}` : "/create-account"} 
                className="text-sm font-medium"
              >
                My Page
              </Link>
            </nav>
          </div>
        )}

        <div className="flex items-center space-x-4 ml-auto">
          <RainbowKitCustomConnectButton />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}