interface Tier {
  id: number;
  name: string;
  price: number;
  benefits: string[];
}

export type Creator = {
  name: string;
  image: string;
  cover?: string;
  bio: string;
  followers: number;
  id: number;
  address: string;
  category: string;
  patrons: number;
  description: string;
  featured: string;
  tiers: Tier[];
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}; 