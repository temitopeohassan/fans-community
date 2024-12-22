import { Creator } from "../../types/creator";

export async function getFeaturedCreators(): Promise<Creator[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creators`);
    if (!response.ok) {
      throw new Error('Failed to fetch creators');
    }
    const creators = await response.json();
    return creators.filter((creator: Creator) => creator.featured === "yes");
  } catch (error) {
    console.error('Error fetching creators:', error);
    return [];
  }
}

export async function getCreatorByAddress(address: string): Promise<Creator | null> {
  try {
    console.log('Fetching creator profile:', address);
    const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creator/profile/${address}`);
    
    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        console.log('Creator profile not found');
        return null;
      }
      throw new Error(`Failed to fetch creator: ${profileResponse.statusText}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('Profile data received:', profileData);

    // Fetch tiers only if we have a valid profile
    const tiersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creator/tiers/${address}`);
    let tiers = [];
    
    if (tiersResponse.ok) {
      tiers = await tiersResponse.json();
      console.log('Tiers data received:', tiers);
    } else {
      console.warn('Failed to fetch tiers:', tiersResponse.statusText);
    }

    return {
      ...profileData,
      tiers: tiers
    };
  } catch (error) {
    console.error('Error in getCreatorByAddress:', error);
    throw error;
  }
}

export async function createCreatorProfile(profileData: Partial<Creator>) {
  try {
    const token = localStorage.getItem('token'); // Get token from localStorage
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creator/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Properly format the Authorization header
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error('Failed to create profile');
    }
    return response.json();
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

export async function updateCreatorProfile(address: string, profileData: Partial<Creator>) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creator/profile/${address}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}
