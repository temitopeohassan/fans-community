import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployCreatorSubscriptionManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy Creator Subscription Manager
  const creatorSubscriptionManagerDeployment = await deploy("CreatorSubscriptionManager", {
    from: deployer,
    args: [],
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      viaAdminContract: "DefaultProxyAdmin",
    },
  });

  // Get deployed contract
  const creatorSubscriptionManager = await hre.ethers.getContract<Contract>("CreatorSubscriptionManager", deployer);

  // Initial contract setup
  try {
    await creatorSubscriptionManager.initialize(deployer);

    console.log("Creator Subscription Manager deployed:");
    console.log("Address:", creatorSubscriptionManagerDeployment.address);
  } catch (error) {
    console.error("Initialization error:", error);
  }
};

export default deployCreatorSubscriptionManager;

deployCreatorSubscriptionManager.tags = ["CreatorSubscriptionManager"];