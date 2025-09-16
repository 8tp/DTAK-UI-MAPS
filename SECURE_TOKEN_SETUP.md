# 🔐 Secure Ditto Token Implementation Guide

## Best Practices for Token Security

### ❌ Never Do This (Hardcoded Tokens)
```typescript
// DON'T - Hardcoded in source code
const DITTO_TOKEN = "abc123-your-actual-token-here";
```

### ✅ Recommended Approaches

## 1. React Native Config (Development & Production)

### Setup Steps:

```bash
# Install react-native-config
yarn add react-native-config

# For iOS
cd ios && pod install
```

### Configuration:

**Create `.env` file (never commit this):**
```bash
DITTO_APP_ID=your-actual-app-id-from-ditto-portal
DITTO_TOKEN=your-actual-token-from-ditto-portal
DITTO_ENVIRONMENT=production
```

**Add to `.gitignore`:**
```
.env
.env.local
.env.production
```

**Usage in code:**
```typescript
import Config from 'react-native-config';

const dittoConfig = {
  appId: Config.DITTO_APP_ID,
  token: Config.DITTO_TOKEN,
  environment: Config.DITTO_ENVIRONMENT
};
```

## 2. Expo Constants (For Expo Projects)

### Setup in `app.json`:
```json
{
  "expo": {
    "extra": {
      "DITTO_APP_ID": "your-app-id",
      "DITTO_TOKEN": "your-token"
    }
  }
}
```

### Usage:
```typescript
import Constants from 'expo-constants';

const config = Constants.expoConfig?.extra;
const dittoAppId = config?.DITTO_APP_ID;
const dittoToken = config?.DITTO_TOKEN;
```

## 3. Secure Storage (Production Recommended)

### Install Dependencies:
```bash
yarn add react-native-keychain
cd ios && pod install
```

### Implementation:
```typescript
import * as Keychain from 'react-native-keychain';

// Store credentials securely
const storeCredentials = async (appId: string, token: string) => {
  await Keychain.setInternetCredentials(
    'DittoCredentials',
    appId,
    token
  );
};

// Retrieve credentials
const getCredentials = async () => {
  const credentials = await Keychain.getInternetCredentials('DittoCredentials');
  if (credentials) {
    return {
      appId: credentials.username,
      token: credentials.password
    };
  }
  return null;
};
```

## 4. Environment-Specific Configuration

### Development Setup:
```bash
# .env.development
DITTO_APP_ID=dev-app-id-from-playground
DITTO_TOKEN=dev-token-from-playground
DITTO_ENVIRONMENT=development
```

### Production Setup:
```bash
# .env.production (or use secure storage)
DITTO_APP_ID=prod-app-id
DITTO_TOKEN=prod-token
DITTO_ENVIRONMENT=production
```

## 5. CI/CD Integration

### GitHub Actions Example:
```yaml
- name: Create .env file
  run: |
    echo "DITTO_APP_ID=${{ secrets.DITTO_APP_ID }}" >> .env
    echo "DITTO_TOKEN=${{ secrets.DITTO_TOKEN }}" >> .env
    echo "DITTO_ENVIRONMENT=production" >> .env
```

### Store secrets in:
- GitHub: Repository Settings → Secrets
- GitLab: Project Settings → CI/CD → Variables
- Bitbucket: Repository Settings → Pipelines → Repository variables

## 6. Team Development Workflow

### For Team Members:

1. **Get credentials from team lead**
2. **Create local `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with actual values
   ```
3. **Never commit `.env` files**
4. **Use development playground credentials for local testing**

### For Production Deployment:

1. **Use secure storage or CI/CD secrets**
2. **Rotate tokens regularly**
3. **Use different tokens for different environments**
4. **Monitor token usage in Ditto portal**

## 7. Security Checklist

- [ ] ✅ Tokens stored in environment variables or secure storage
- [ ] ✅ `.env` files added to `.gitignore`
- [ ] ✅ Different tokens for dev/staging/production
- [ ] ✅ CI/CD secrets configured properly
- [ ] ✅ Team members have development credentials
- [ ] ✅ Production tokens are rotated regularly
- [ ] ❌ No hardcoded tokens in source code
- [ ] ❌ No tokens in version control
- [ ] ❌ No tokens in logs or error messages

## 8. Getting Ditto Credentials

1. **Sign up at [portal.ditto.live](https://portal.ditto.live)**
2. **Create a new app**
3. **Copy App ID and Token**
4. **For development: Use "Online Playground" mode**
5. **For production: Set up "Online with Authentication"**

## 9. Troubleshooting

### Common Issues:

**"Ditto not initialized" error:**
- Check if environment variables are loaded correctly
- Verify token format and validity
- Ensure network connectivity for initial auth

**"Invalid credentials" error:**
- Verify App ID and Token are correct
- Check if token has expired
- Ensure environment matches token type (dev/prod)

**Environment variables not loading:**
- Restart Metro bundler after changing `.env`
- Check react-native-config installation
- Verify `.env` file is in project root

## 10. Your Current Implementation

Your Ditto configuration automatically handles secure token loading:

```typescript
// This is already implemented in your DittoConfig.ts
const config = await getSecureConfig();
// Tries environment variables first, falls back to secure storage
```

### To use it:
1. Create `.env` file with your credentials
2. Or implement secure storage for production
3. The system handles the rest automatically

This approach ensures your tokens are never hardcoded while providing flexibility for different deployment scenarios.
