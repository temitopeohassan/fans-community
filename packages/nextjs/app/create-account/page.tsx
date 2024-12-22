"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createCreatorProfile } from "~~/services/api/creators";
import { getCreatorByAddress } from "~~/services/api/creators";

export default function CreateAccount() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    
    // Check if user already has a profile
    async function checkExistingProfile() {
      try {
        await getCreatorByAddress(address as string);
        router.push(`/creator/${address}`);
      } catch (error) {
        // No profile exists, stay on create page
      }
    }
    checkExistingProfile();
  }, [isConnected, address, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createCreatorProfile({
        ...formData,
        address,
      });
      router.push('/profile');
    } catch (error) {
      console.error('Error creating profile:', error);
      // Optionally add error notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Create Account</h1>
      
      <Card className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input id="wallet" value={address} disabled />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
