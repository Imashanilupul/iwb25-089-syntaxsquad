# Biometric Verification Troubleshooting

## Error: "Mock: User already registered"

This error occurs in development mode when the mock biometric service simulates a scenario where the user has already been registered.

### Quick Fix

The easiest way to stop getting this error is to update your `.env.local` file:

```env
# Set this to false to disable mock failures
NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=false
```

After updating, restart your development server:
```bash
npm run dev
```

### Understanding the Mock System

In development mode, the biometric verification uses a mock service that:

1. **95% Success Rate**: Normally succeeds 95% of the time
2. **Deterministic Results**: Same session will give same result
3. **Configurable Failures**: Can be forced to fail for testing

### Configuration Options

| Environment Variable | Effect |
|---------------------|--------|
| `NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=false` | Normal 95% success rate |
| `NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=true` | Forces all verifications to fail |
| `NEXT_PUBLIC_USE_REAL_HUMANODE=true` | Attempts to use real Humanode service |

### Testing Different Scenarios

#### 1. Always Succeed (Recommended for Development)
```env
NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=false
```

#### 2. Test Failure Handling
```env
NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=true
```

#### 3. Test Real Service (Requires API Key)
```env
NEXT_PUBLIC_HUMANODE_API_KEY=your_real_api_key
NEXT_PUBLIC_USE_REAL_HUMANODE=true
```

### Why This Happens

The mock service simulates real-world scenarios where:
- Users might try to register multiple times
- Biometric matching detects existing registrations
- System prevents duplicate accounts

In production with real Humanode service, this would only happen if someone actually tried to register twice.

### Development Tips

1. **For most development**: Set `NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=false`
2. **For testing error handling**: Temporarily set `NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=true`
3. **For production testing**: Get real Humanode API access

### Next Steps

1. Update your `.env.local` file with the recommended settings
2. Restart your development server
3. Try the biometric verification again
4. If you want to test with real Humanode, follow the [HUMANODE-INTEGRATION.md](./HUMANODE-INTEGRATION.md) guide
