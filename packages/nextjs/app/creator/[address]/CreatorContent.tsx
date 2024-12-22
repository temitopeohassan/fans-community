import Image from "next/image";
import { Creator } from "~~/types/creator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Heart, Share2, Users } from "lucide-react";

interface CreatorContentProps {
  creator: Creator;
}

export function CreatorContent({ creator }: CreatorContentProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Cover Image */}
      <div className="h-64 relative">
        <Image
          src={creator.cover || creator.image}
          alt="Cover"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Profile Section */}
      <div className="container mx-auto px-4 -mt-20 pt-20">
        <div className="flex flex-col gap-8">
          {/* Profile Header */}
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-32 h-32 relative rounded-full border-4 border-white overflow-hidden">
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{creator.name}</h1>
                <p className="text-muted-foreground">{creator.bio}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Follow
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <div>
                  <p className="text-2xl font-bold">{creator.followers}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
              </div>
            </Card>
            {/* Add more stat cards as needed */}
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
              {/* Posts content */}
              <div className="grid gap-4 mt-4">
                {/* Add posts components here */}
              </div>
            </TabsContent>
            <TabsContent value="about">
              {/* About content */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">About {creator.name}</h2>
                <p>{creator.bio}</p>
              </Card>
            </TabsContent>
            <TabsContent value="gallery">
              {/* Gallery content */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                {/* Add gallery items here */}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 