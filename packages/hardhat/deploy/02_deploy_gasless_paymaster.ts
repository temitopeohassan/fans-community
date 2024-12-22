import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployGaslessPaymaster: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy Gasless Paymaster
  const gaslessPaymasterDeployment = await deploy("GaslessPaymaster", {
    from: deployer,
    args: [],
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      viaAdminContract: "DefaultProxyAdmin",
    },
  });

  // Get deployed contract
  const gaslessPaymaster = await hre.ethers.getContract<Contract>("GaslessPaymaster", deployer);

  // Initial contract setup
  try {
    await gaslessPaymaster.initialize(deployer);

    console.log("Gasless Paymaster deployed:");
    console.log("Address:", gaslessPaymasterDeployment.address);
  } catch (error) {
    console.error("Initialization error:", error);
  }
};

export default deployGaslessPaymaster;

deployGaslessPaymaster.tags = ["GaslessPaymaster"];