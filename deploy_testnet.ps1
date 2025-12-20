$ErrorActionPreference = "Stop"

$files = @("testnet_wallet.json", "testnet.db")
foreach ($f in $files) {
    if (Test-Path $f) { Remove-Item $f -Recurse -Force }
}

$WALLET = "$PWD/testnet_wallet.json"
$STORAGE = "rocksdb:$PWD/testnet.db"
$FAUCET_URL = "https://faucet.testnet-conway.linera.net"

# Get Absolute Paths for WASM
$CONTRACT_WASM = Resolve-Path "contracts/mines/target/wasm32-unknown-unknown/release/mines_contract.wasm"
$SERVICE_WASM = Resolve-Path "contracts/mines/target/wasm32-unknown-unknown/release/mines_service.wasm"

Write-Host "Contract: $CONTRACT_WASM"
Write-Host "Service: $SERVICE_WASM"

Write-Host "Initializing Testnet Wallet..."
linera --wallet $WALLET --storage $STORAGE wallet init --faucet $FAUCET_URL

Write-Host "Requesting Chain..."
$CHAIN_ID = linera --wallet $WALLET --storage $STORAGE wallet request-chain --faucet $FAUCET_URL
Write-Host "Chain ID: $CHAIN_ID"

Write-Host "Deploying Contract..."
$APP_ID = linera --wallet $WALLET --storage $STORAGE publish-and-create $CONTRACT_WASM $SERVICE_WASM --json-argument "null"

Write-Host "App ID: $APP_ID"

if ($APP_ID) {
    Write-Host "Updating frontend/.env..."
    # Note: Using the public node URL for the frontend
    $envContent = "VITE_LINERA_APP_ID=$APP_ID`nVITE_LINERA_CHAIN_ID=$CHAIN_ID`nVITE_LINERA_NODE_URL=https://testnet-conway.linera.net`n"
    Set-Content -Path "frontend/.env" -Value $envContent
    Write-Host "Deployment Successful!"
} else {
    Write-Error "Failed to deploy application."
}
