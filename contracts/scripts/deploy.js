// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy a mock USDFC token for testing
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  console.log("Deployment completed!");
  
  // Write deployment info to a file for the frontend to use
  const fs = require("fs");
  const deploymentInfo = {
    mockUSDC: mockUSDCAddress,
  };
  
  // Create the directory if it doesn't exist
  const deploymentDir = "../app/src/deployments";
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const networkName = network.name === "hardhat" ? "localhost" : network.name;
  fs.writeFileSync(
    `${deploymentDir}/${networkName}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info written to ${deploymentDir}/${networkName}.json`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
