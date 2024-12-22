import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import * as jwt from 'jsonwebtoken';
import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES, CustomChainConfig } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { SafeEventEmitterProvider } from '@web3auth/base';
// Contract ABIs and Addresses
import CreatorSubscriptionABI from './contracts/CreatorSubscriptionManager.json';
import GaslessPaymasterABI from './contracts/GaslessPaymaster.json';

// Tier Schema
const tierSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorProfile', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  benefits: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Post Schema
const postSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorProfile', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  // Optional: If the post is only for specific tiers
  visibleToTiers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tier' }],
  attachments: [String], // URLs to images/files
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Creator Profile Schema
const creatorProfileSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  image: String, // profile image
  cover: String, // banner/cover image
  patrons: { type: Number, default: 0 },
  featured: { type: String, enum: ['yes', 'no'], default: 'no' },
  socialLinks: {
    twitter: String,
    instagram: String,
    facebook: String,
    website: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  subscriber: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorProfile', required: true },
  tier: { type: mongoose.Schema.Types.ObjectId, ref: 'Tier', required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' }
});

// Create models
const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);
const Tier = mongoose.model('Tier', tierSchema);
const Post = mongoose.model('Post', postSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Define cleanDatabase function before the class
async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Wait for each deletion operation to complete
    const results = await Promise.all([
      CreatorProfile.deleteMany({}).exec(),
      Tier.deleteMany({}).exec(),
      Post.deleteMany({}).exec(),
      Subscription.deleteMany({}).exec()
    ]);

    // Log the number of deleted documents for each collection
    console.log('Cleanup results:');
    console.log('CreatorProfiles deleted:', results[0].deletedCount);
    console.log('Tiers deleted:', results[1].deletedCount);
    console.log('Posts deleted:', results[2].deletedCount);
    console.log('Subscriptions deleted:', results[3].deletedCount);
    
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  }
}

class BlockchainPatreonBackend {
  private app: express.Application;
  private web3auth!: Web3Auth;
  private provider: ethers.JsonRpcProvider | null = null;
  private subscriptionContract: ethers.Contract | null = null;
  private paymasterContract: ethers.Contract | null = null;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeWeb3Auth();
    this.connectToDatabase();
    this.setupRoutes();
  }

  private initializeMiddleware() {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(express.json());
  }

  private async initializeWeb3Auth() {
    if (!process.env.WEB3AUTH_CLIENT_ID) {
      throw new Error('WEB3AUTH_CLIENT_ID is required in environment variables');
    }

    const chainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: '0x7a69',
      rpcTarget: process.env.RPC_URL || 'http://localhost:8545',
      displayName: 'Hardhat Local',
      blockExplorer: 'http://localhost:8545',
      ticker: 'ETH',
      tickerName: 'Ethereum'
    };

    this.web3auth = new Web3Auth({
      clientId: process.env.WEB3AUTH_CLIENT_ID,
      chainConfig,
      web3AuthNetwork: 'sapphire_devnet',
      uiConfig: {
        appName: "Blockchain Patreon",
        theme: { primary: "light" },
        loginMethodsOrder: ["google", "facebook"]
      }
    });

    const openloginAdapter = new OpenloginAdapter({
      chainConfig,
      adapterSettings: {
        network: 'sapphire_devnet',
        clientId: process.env.WEB3AUTH_CLIENT_ID
      }
    });

    const privateKeyProvider = new EthereumPrivateKeyProvider({
      config: { 
        chainConfig
      }
    });

    this.web3auth.configureAdapter(openloginAdapter);
  }

  private async connectToDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB');
      
      // Clean the database
      await cleanDatabase();
      console.log('Database is now clean');
      
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1); // Exit the process if we can't connect to the database
    }
  }

  private setupRoutes() {
    // Authentication Routes
    this.app.post('/auth/login', this.handleLogin.bind(this));
    this.app.post('/auth/verify', this.verifyToken.bind(this));

    // Creator Routes
    this.app.post('/creator/tier', this.createSubscriptionTier.bind(this));
    this.app.get('/creator/tiers/:address', this.getCreatorTiers.bind(this));

    // Subscription Routes
    this.app.post('/subscribe', this.purchaseSubscription.bind(this));
    this.app.get('/subscriptions', this.getUserSubscriptions.bind(this));

    // Creator Profile Routes
    this.app.post('/creator/profile', this.createCreatorProfile.bind(this));
    this.app.get('/creator/profile/:address', this.getCreatorProfile.bind(this));
    this.app.put('/creator/profile/:address', this.updateCreatorProfile.bind(this));
    this.app.get('/creators', this.getAllCreators.bind(this));
  }

  private async handleLogin(req: express.Request, res: express.Response) {
    try {
      await this.web3auth.initModal();
      const provider = await this.web3auth.connect();
      
      if (!provider) {
        return res.status(400).json({ error: 'Authentication failed' });
      }

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();

      const token = jwt.sign({ address }, process.env.JWT_SECRET || '', {
        expiresIn: '24h'
      });

      res.json({ token, address });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }

  private async createSubscriptionTier(req: express.Request, res: express.Response) {
    const { price, metadata } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    try {
      const decoded = jwt.verify(token || '', process.env.JWT_SECRET || '');
      const creator = (decoded as any).address;

      if (!this.subscriptionContract) {
        return res.status(500).json({ error: 'Contract not initialized' });
      }

      const tx = await this.subscriptionContract.createSubscriptionTier(price, metadata);
      await tx.wait();

      res.json({ success: true, tierId: tx.tierId });
    } catch (error) {
      res.status(500).json({ error: 'Tier creation failed' });
    }
  }

  private async purchaseSubscription(req: express.Request, res: express.Response) {
    const { creator, tierId, amount } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    try {
      const decoded = jwt.verify(token || '', process.env.JWT_SECRET || '');
      const subscriber = (decoded as any).address;

      if (!this.subscriptionContract) {
        return res.status(500).json({ error: 'Contract not initialized' });
      }

      const tx = await this.subscriptionContract.purchaseSubscription(creator, tierId, {
        value: ethers.parseEther(amount.toString())
      });
      await tx.wait();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Subscription purchase failed' });
    }
  }

  private verifyToken(req: express.Request, res: express.Response) {
    const token = req.body.token;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      res.json({ valid: true, address: (decoded as any).address });
    } catch (error) {
      res.status(401).json({ valid: false });
    }
  }

  private async initializeContracts() {
    if (!this.provider) return;

    this.subscriptionContract = new ethers.Contract(
      process.env.SUBSCRIPTION_CONTRACT_ADDRESS || '',
      CreatorSubscriptionABI.abi,
      this.provider
    );

    this.paymasterContract = new ethers.Contract(
      process.env.PAYMASTER_CONTRACT_ADDRESS || '',
      GaslessPaymasterABI.abi,
      this.provider
    );
  }

  private async getCreatorProfile(req: express.Request, res: express.Response) {
    try {
      const { address } = req.params;
      console.log(`[GET] /creator/profile/${address} - Fetching creator profile`);

      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }

      const creator = await CreatorProfile.findOne({ 
        address: address.toLowerCase() // Ensure case-insensitive comparison
      });

      if (!creator) {
        console.log(`[GET] /creator/profile/${address} - Creator not found`);
        return res.status(404).json({ error: 'Creator not found' });
      }

      console.log(`[GET] /creator/profile/${address} - Found creator:`, creator);
      res.json(creator);
    } catch (error) {
      const address = req.params.address; // Get address here if needed for logging
      console.error(`[GET] /creator/profile/${address} - Error:`, error);
      res.status(500).json({ error: 'Failed to fetch creator profile' });
    }
  }

  private async createCreatorProfile(req: express.Request, res: express.Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[POST] /creator/profile - No valid authorization header');
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.split(' ')[1];
      console.log('[POST] /creator/profile - Creating profile with token:', token);
      
      if (!token) {
        console.log('[POST] /creator/profile - No token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      const address = (decoded as any).address;

      console.log('[POST] /creator/profile - Request body:', req.body);
      
      const profileData = {
        address,
        ...req.body
      };

      const profile = new CreatorProfile(profileData);
      await profile.save();

      console.log('[POST] /creator/profile - Success:', profile);
      res.json({ success: true, profile });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        console.error('[POST] /creator/profile - Invalid token:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
      }
      console.error('[POST] /creator/profile - Error:', error);
      res.status(500).json({ error: 'Failed to create profile' });
    }
  }

  private async updateCreatorProfile(req: express.Request, res: express.Response) {
    const { address } = req.params;  // Moved to top of function
    try {
      const token = req.headers.authorization?.split(' ')[1];
      console.log(`[PUT] /creator/profile/${address} - Updating profile`);
      console.log('Request body:', req.body);
      
      const decoded = jwt.verify(token || '', process.env.JWT_SECRET || '');
      const tokenAddress = (decoded as any).address;

      if (tokenAddress.toLowerCase() !== address.toLowerCase()) {
        console.log(`[PUT] /creator/profile/${address} - Unauthorized: Token address ${tokenAddress} doesn't match request address`);
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updatedProfile = await CreatorProfile.findOneAndUpdate(
        { address },
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedProfile) {
        console.log(`[PUT] /creator/profile/${address} - Profile not found`);
        return res.status(404).json({ error: 'Profile not found' });
      }

      console.log(`[PUT] /creator/profile/${address} - Success:`, updatedProfile);
      res.json(updatedProfile);
    } catch (error) {
      console.error(`[PUT] /creator/profile/${address} - Error:`, error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  private async getAllCreators(req: express.Request, res: express.Response) {
    try {
      console.log('[GET] /creators - Fetching all creators');
      const creators = await CreatorProfile.find({});
      console.log('[GET] /creators - Success:', creators.length, 'creators found');
      res.json(creators);
    } catch (error) {
      console.error('[GET] /creators - Error:', error);
      res.status(500).json({ error: 'Failed to fetch creators' });
    }
  }

  private async getCreatorTiers(req: express.Request, res: express.Response) {
    const { address } = req.params;  // Moved to top of function
    try {
      console.log(`[GET] /creator/tiers/${address} - Fetching tiers`);
      
      const tiers = await Tier.find({ creator: address });
      
      console.log(`[GET] /creator/tiers/${address} - Success:`, tiers);
      res.json(tiers);
    } catch (error) {
      console.error(`[GET] /creator/tiers/${address} - Error:`, error);
      res.status(500).json({ error: 'Failed to fetch tiers' });
    }
  }

  private async getUserSubscriptions(req: express.Request, res: express.Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      console.log('[GET] /subscriptions - Fetching subscriptions');
      
      const decoded = jwt.verify(token || '', process.env.JWT_SECRET || '');
      const userAddress = (decoded as any).address;

      // Assuming you have a Subscription model
      const subscriptions = await Subscription.find({ subscriber: userAddress });
      
      console.log('[GET] /subscriptions - Success:', subscriptions);
      res.json(subscriptions);
    } catch (error) {
      console.error('[GET] /subscriptions - Error:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  }

  public start(port: number = 8080) {
    this.initializeContracts();
    this.app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
}

const server = new BlockchainPatreonBackend();
server.start();