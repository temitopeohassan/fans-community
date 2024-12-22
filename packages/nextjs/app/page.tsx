"use client";

import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";
import { ArrowRight, Heart, Users, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Creator } from "../types/creator";
import { getFeaturedCreators } from "../services/api/creators";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCreators() {
      const creators = await getFeaturedCreators();
      setFeaturedCreators(creators);
      setLoading(false);
    }
    loadCreators();
  }, []);

  const handleCreatorClick = () => {
    if (!isConnected) {
      document.querySelector<HTMLButtonElement>('[aria-label="Connect Wallet"]')?.click();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Change the way you support creators
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join millions of others in supporting creators and getting exclusive access to their work
          </p>
          <div className="flex justify-center gap-4">
            {isConnected ? (
              <>
                <Link href="/explore">
                  <Button size="lg" className="gap-2">
                    Explore Creators <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/create-account">
                  <Button size="lg" variant="outline">
                    Become a Creator
                  </Button>
                </Link>
              </>
            ) : (
              <Button size="lg" onClick={handleCreatorClick}>
                Connect Wallet to Start
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why CreatorSpace?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Users className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Supportive Community</h3>
              <p className="text-muted-foreground">
                Join a thriving community of creators and supporters who share your passions.
              </p>
            </Card>
            <Card className="p-6">
              <Zap className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Powerful Tools</h3>
              <p className="text-muted-foreground">
                Get everything you need to run your creative business and connect with fans.
              </p>
            </Card>
            <Card className="p-6">
              <Heart className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Direct Support</h3>
              <p className="text-muted-foreground">
                Support creators directly and get exclusive content and benefits in return.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Creators Section */}
      {featuredCreators.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Featured Creators
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredCreators.map((creator) => (
                <Card key={creator.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <Image
                      src={creator.image}
                      alt={creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{creator.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {creator.category}
                    </p>
                    <p className="mb-4">{creator.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {creator.patrons.toLocaleString()} patrons
                      </span>
                      <Link 
                        href={`/creator/${creator.address}`}
                        onClick={(e) => {
                          console.log('Navigating to creator:', creator.address);
                        }}
                      >
                        <Button variant="secondary">View Page</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}