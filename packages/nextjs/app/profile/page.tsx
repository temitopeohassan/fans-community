"use client";

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function checkProfile() {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/creators/${address}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/create-account');
          }
          return;
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    checkProfile();
  }, [address, isConnected, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">My Profile</h1>
        <p>Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">My Profile</h1>
      <h3 className="text-xl font-semibold mb-2">My Wallet Address</h3>
      <p className="font-mono bg-muted p-2 rounded">{address}</p>
    </div>
  );
}

