"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Heart, Share2, Users } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { notFound } from 'next/navigation';
import { Creator } from "~~/types/creator";
import { getCreatorByAddress } from "~~/services/api/creators";
import { useEffect, useState } from "react";
import { CreatorContent } from "./CreatorContent";

export default function CreatorPage() {
  const params = useParams();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreator() {
      if (!params.address) return;
      
      setLoading(true);
      try {
        console.log('Fetching creator with address:', params.address);
        const data = await getCreatorByAddress(params.address as string);
        console.log('Full Creator data:', data);
        
        if (!data) {
          console.error('No creator data returned');
          setError('Creator not found');
          return;
        }
        
        setCreator(data);
        setError(null);
      } catch (err) {
        console.error('Error loading creator:', err);
        setError('Failed to load creator');
      } finally {
        setLoading(false);
      }
    }
    loadCreator();
  }, [params.address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !creator) {
    console.log('Triggering 404:', { error, creator });
    notFound();
  }

  return <CreatorContent creator={creator} />;
}