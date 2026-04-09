const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// BigInt serialization fix
BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const networkName = hre.network.name;
  console.log("Deploying to network:", networkName);

  const deploymentInfo = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  // Deploy TrustVerifier
  console.log("Deploying TrustVerifier...");
  const TrustVerifier = await ethers.getContractFactory("TrustVerifier");
  const trustVerifier = await TrustVerifier.deploy(deployer.address);
  await trustVerifier.waitForDeployment();
  const trustVerifierAddress = await trustVerifier.getAddress();
  deploymentInfo.contracts.TrustVerifier = trustVerifierAddress;
  console.log("TrustVerifier deployed to:", trustVerifierAddress);

  // Deploy TrustPolicy
  console.log("Deploying TrustPolicy...");
  const TrustPolicy = await ethers.getContractFactory("TrustPolicy");
  const trustPolicy = await TrustPolicy.deploy(deployer.address);
  await trustPolicy.waitForDeployment();
  const trustPolicyAddress = await trustPolicy.getAddress();
  deploymentInfo.contracts.TrustPolicy = trustPolicyAddress;
  console.log("TrustPolicy deployed to:", trustPolicyAddress);

  // Deploy TrustGateway
  console.log("Deploying TrustGateway...");
  const TrustGateway = await ethers.getContractFactory("TrustGateway");
  const trustGateway = await TrustGateway.deploy();
  await trustGateway.waitForDeployment();
  const trustGatewayAddress = await trustGateway.getAddress();
  deploymentInfo.contracts.TrustGateway = trustGatewayAddress;
  console.log("TrustGateway deployed to:", trustGatewayAddress);

  // Deploy TrustVault
  console.log("Deploying TrustVault...");
  const TrustVault = await ethers.getContractFactory("TrustVault");
  const trustVault = await TrustVault.deploy(deployer.address);
  await trustVault.waitForDeployment();
  const trustVaultAddress = await trustVault.getAddress();
  deploymentInfo.contracts.TrustVault = trustVaultAddress;
  console.log("TrustVault deployed to:", trustVaultAddress);

  // Deploy TrustPool
  console.log("Deploying TrustPool...");
  const TrustPool = await ethers.getContractFactory("TrustPool");
  const trustPool = await TrustPool.deploy(deployer.address);
  await trustPool.waitForDeployment();
  const trustPoolAddress = await trustPool.getAddress();
  deploymentInfo.contracts.TrustPool = trustPoolAddress;
  console.log("TrustPool deployed to:", trustPoolAddress);

  // Deploy TrustAirdrop
  console.log("Deploying TrustAirdrop...");
  const TrustAirdrop = await ethers.getContractFactory("TrustAirdrop");
  const trustAirdrop = await TrustAirdrop.deploy(deployer.address);
  await trustAirdrop.waitForDeployment();
  const trustAirdropAddress = await trustAirdrop.getAddress();
  deploymentInfo.contracts.TrustAirdrop = trustAirdropAddress;
  console.log("TrustAirdrop deployed to:", trustAirdropAddress);

  // Deploy MockUSDC (if needed)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  deploymentInfo.contracts.MockUSDC = mockUSDCAddress;
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  // Configure TrustVault with verifier and policy
  console.log("Configuring TrustVault...");
  await trustVault.setVerifier(trustVerifierAddress);
  await trustVault.setPolicy(trustPolicyAddress);
  console.log("TrustVault configured with TrustVerifier and TrustPolicy");

  // Configure TrustPool
  console.log("Configuring TrustPool...");
  await trustPool.setVerifier(trustVerifierAddress);
  await trustPool.setPolicy(trustPolicyAddress);
  console.log("TrustPool configured with TrustVerifier and TrustPolicy");

  // Configure TrustAirdrop
  console.log("Configuring TrustAirdrop...");
  await trustAirdrop.setVerifier(trustVerifierAddress);
  await trustAirdrop.setPolicy(trustPolicyAddress);
  console.log("TrustAirdrop configured with TrustVerifier and TrustPolicy");

  console.log("Publishing initial gateway policy version...");
  await trustGateway.publishPolicy("nebula-trust-v1");
  console.log("TrustGateway initialized with nebula-trust-v1");

  // Create default policies
  console.log("Creating default policies...");
  const lendingPoolPolicyId = keccak256("lending-pool-v1");
  await trustPolicy.createPolicy(
    lendingPoolPolicyId,
    "Lending Pool Access",
    50,   // minTrustScore
    2,     // minBand
    false,  // requireHuman
    false   // requireCredential
  );
  console.log("Created policy: Lending Pool Access");

  const premiumPoolPolicyId = keccak256("premium-pool-v1");
  await trustPolicy.createPolicy(
    premiumPoolPolicyId,
    "Premium Pool Access",
    75,
    3,
    false,
    false
  );
  console.log("Created policy: Premium Pool Access");

  const airdropPolicyId = keccak256("airdrop-2026");
  await trustPolicy.createPolicy(
    airdropPolicyId,
    "Airdrop Access",
    25,
    1,
    false,
    false
  );
  console.log("Created policy: Airdrop Access");

  console.log("\nDeployment completed!");

  // Save deployment info
  const deploymentDir = path.resolve(__dirname, "../../web-app/src/deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentJson = JSON.stringify(deploymentInfo, null, 2);
  fs.writeFileSync(
    `${deploymentDir}/${networkName}.json`,
    deploymentJson
  );
  console.log(`Deployment info written to ${deploymentDir}/${networkName}.json`);
  fs.writeFileSync(`${deploymentDir}/latest.json`, deploymentJson);
  console.log(`Deployment info also written to ${deploymentDir}/latest.json`);

  // Helper function
  function keccak256(text) {
    return ethers.keccak256(ethers.toUtf8Bytes(text));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
