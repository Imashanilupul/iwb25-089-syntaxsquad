# Humanode Biometric Authentication Integration

This Sri Lankan Transparent Governance Platform integrates with [Humanode.io](https://humanode.io/) to ensure **one person, one account** through biometric facial recognition.

## 🔐 How It Works

### Unique Identity Verification
- **Facial Biometrics**: Uses advanced liveness detection and facial recognition
- **Anti-Spoofing**: Prevents photos, videos, and deepfakes
- **One Person, One Account**: Cryptographically ensures no duplicate registrations
- **Privacy-First**: Biometric data is not stored, only cryptographic hashes

### Registration Process
1. **User Input**: Citizen enters personal details (name, NIC, email, mobile)
2. **NIC Validation**: Sri Lankan NIC number is validated for format and authenticity
3. **Biometric Scan**: Optional facial biometric verification via Humanode
4. **Uniqueness Check**: System verifies the person hasn't registered before
5. **Secure Storage**: Only verified, unique users are registered

## 🛠️ Technical Implementation

### Components
- **`HumanodeBiometricService`**: Core service for Humanode API integration
- **`useBiometricAuth`**: React hook for biometric authentication state
- **`BiometricVerification`**: UI component for facial scanning
- **`RegistrationDialog`**: Enhanced registration with biometric integration

### API Integration
```typescript
// Initialize service
const service = createHumanodeService()
await service.initialize()

// Verify uniqueness
const result = await service.verifyUniqueness(livenessData)
if (result.isUnique) {
  // Proceed with registration
}
```

## 🔧 Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_HUMANODE_ENDPOINT=https://mainnet-rpc.humanode.io
NEXT_PUBLIC_HUMANODE_API_KEY=your-api-key
```

### Humanode Setup
1. Visit [Humanode.io](https://humanode.io/)
2. Sign up for developer access
3. Get API credentials
4. Configure endpoints in environment

## 📱 User Experience

### Registration Flow
1. **Standard Form**: Name, email, NIC, mobile number
2. **Enable Biometric**: Toggle biometric verification
3. **Initialize System**: Connect to Humanode network
4. **Face Scan**: Live facial recognition scan
5. **Verification**: Real-time uniqueness validation
6. **Complete**: Secure registration with verified identity

### Security Features
- ✅ **Liveness Detection**: Prevents photo/video spoofing
- ✅ **Uniqueness Guarantee**: Cryptographic identity verification
- ✅ **Privacy Protection**: No biometric storage, only hashes
- ✅ **Government Grade**: Suitable for national identity systems

## 🏛️ Sri Lankan Context

### Compliance
- **National ID Integration**: Works with Sri Lankan NIC validation
- **Government Standards**: Meets digital identity requirements
- **Democratic Participation**: Ensures fair, one-person voting
- **Transparency**: Audit trail for all identity verifications

### Use Cases
- **Voter Registration**: Prevent duplicate voter registrations
- **Citizen Services**: Secure access to government services
- **Public Consultations**: Verified participation in policy discussions
- **Budget Tracking**: Authenticated citizen oversight

## 🚀 Development

### Testing
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Production Deployment
1. Configure production Humanode endpoints
2. Set secure API keys
3. Enable HTTPS for biometric data transmission
4. Configure proper CORS policies

## 📊 Benefits

### For Citizens
- **One Registration**: Never need to register multiple times
- **Secure Identity**: Protection against identity fraud
- **Equal Access**: Fair participation in democratic processes
- **Privacy Protected**: Biometric data never stored permanently

### For Government
- **Fraud Prevention**: Eliminate duplicate registrations
- **Cost Effective**: Reduce administrative overhead
- **Audit Trail**: Complete verification history
- **Scalable**: Handle millions of citizens efficiently

## 🛡️ Security & Privacy

### Data Protection
- **No Storage**: Biometric templates never stored
- **Hash-Only**: Only cryptographic hashes retained
- **Encrypted Transit**: All data encrypted in transmission
- **Local Processing**: Facial recognition done locally when possible

### Compliance
- **GDPR Ready**: Privacy-by-design architecture
- **Government Standards**: Meets national security requirements
- **International Standards**: ISO 27001 compatible
- **Audit Ready**: Complete verification audit trails

## 📞 Support

For technical support or integration questions:
- **Documentation**: [Humanode.io Documentation](https://docs.humanode.io/)
- **Community**: [Humanode Discord](https://discord.gg/humanode)
- **Issues**: Open GitHub issues for integration problems

---

**Built for the Democratic Socialist Republic of Sri Lanka** 🇱🇰  
*Ensuring transparent, secure, and unique democratic participation*
