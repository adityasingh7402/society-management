# PowerShell script to test Society API authentication

# STEP 1: Login to get a token
# Replace these with your actual society credentials
$societyId = "YOUR_ACTUAL_SOCIETY_ID"  # Replace with real society ID
$managerPhone = "YOUR_MANAGER_PHONE"      # Replace with real manager phone

Write-Host "Step 1: Logging in to get JWT token..."
try {
    $loginBody = @{
        societyId = $societyId
        phoneNumber = $managerPhone
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/society/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    $token = $loginResponse.token
    Write-Host "✅ Login successful! Token obtained."
    Write-Host "Token preview: $($token.Substring(0, 50))..."
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)"
    Write-Host "Please check your societyId and managerPhone values."
    exit
}

# Test the API with proper authorization header
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    securityId = "SEC123"
    guardName = "Test Guard"
    guardPhone = "9876543210"
} | ConvertTo-Json

# Make the API call
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/Society-Api/update-security-profile" -Method PUT -Headers $headers -Body $body
    Write-Host "Success: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response | ConvertTo-Json -Depth 3)"
}

# Alternative: Test with curl if available
Write-Host "`n--- Alternative curl command ---"
Write-Host "curl -X PUT `"http://localhost:3000/api/Society-Api/update-security-profile`" \"
Write-Host "  -H `"Content-Type: application/json`" \"
Write-Host "  -H `"Authorization: Bearer $token`" \"
Write-Host "  -d '{`"securityId`":`"SEC123`",`"guardName`":`"Test Guard`",`"guardPhone`":`"9876543210`"}'"
