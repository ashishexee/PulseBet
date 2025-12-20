$ErrorActionPreference = "Stop"

# Configuration
$WALLET = "testnet_wallet.json"
$STORAGE = "rocksdb:testnet.db"
$FAUCET_URL = "https://faucet.testnet-conway.linera.net"

# Paths
$CONTRACT_DIR = "contracts/pulse_token"
$TARGET_DIR = "$CONTRACT_DIR/target/wasm32-unknown-unknown/release"
$CONTRACT_WASM = "$TARGET_DIR/pulse_token_contract.wasm"
$SERVICE_WASM = "$TARGET_DIR/pulse_token_service.wasm"

# 1. Build Contract
Write-Host "Building PulseToken Contract..."
Push-Location $CONTRACT_DIR
try {
    cargo build --release --target wasm32-unknown-unknown
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
} catch {
    Write-Warning "Build failed or cargo not found. Please ensure you can build 'pulse_token' manually."
    Pop-Location
    exit 1
}
Pop-Location

# 2. Check Paths
if (-not (Test-Path $CONTRACT_WASM)) {
    Write-Error "Contract WASM not found at $CONTRACT_WASM"
    exit 1
}

# 3. Initialize Wallet (if needed)
if (-not (Test-Path $WALLET)) {
    Write-Host "Initializing Wallet..."
    linera --wallet $WALLET --storage $STORAGE wallet init --faucet $FAUCET_URL
    linera --wallet $WALLET --storage $STORAGE wallet request-chain --faucet $FAUCET_URL
}

# 4. Deploy
Write-Host "Deploying PulseToken..."
$APP_ID = linera --wallet $WALLET --storage $STORAGE publish-and-create $CONTRACT_WASM $SERVICE_WASM --json-argument "null"

if ($APP_ID) {
    Write-Host "Success! App ID: $APP_ID"
    
    # 5. Update Frontend Config
    $envPath = "frontend/.env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath
        # Remove existing PULSE_TOKEN entry if any
        $content = $content | Where-Object { $_ -notmatch "VITE_PULSE_TOKEN_APP_ID" }
        $content += "VITE_PULSE_TOKEN_APP_ID=$APP_ID"
        $content | Set-Content $envPath
        Write-Host "Updated .env with VITE_PULSE_TOKEN_APP_ID"
    }
} else {
    Write-Error "Deployment failed to return App ID."
}
