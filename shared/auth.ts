/**
 * OATDA Authentication Management
 *
 * Handles API key storage, retrieval, and validation for skills.
 * Supports multiple configuration methods with security priority.
 *
 * @module oatda-auth
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * OATDA Authentication Configuration
 */
export interface OatdaAuthConfig {
  /** API key (direct parameter, highest priority) */
  apiKey?: string;
  /** Custom config file path */
  configPath?: string;
  /** Profile name to use */
  profile?: string;
}

/**
 * API Key Profile
 */
interface ApiKeyProfile {
  name: string;
  apiKey: string;
  baseUrl?: string;
  createdAt: number;
  lastUsed: number;
}

/**
 * Credentials File Structure
 */
interface CredentialsFile {
  version: 1;
  defaultProfile: string;
  profiles: Record<string, ApiKeyProfile>;
}

/**
 * Default config directory path
 */
const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.oatda');
const DEFAULT_CREDENTIALS_FILE = path.join(DEFAULT_CONFIG_DIR, 'credentials.json');

/**
 * Required file permissions for secure credential storage
 * Owner: read/write (0600)
 */
const SECURE_FILE_PERMISSIONS = 0o600;

/**
 * Custom error class for auth failures.
 * Never includes API key material in messages or stack traces.
 */
export class OatdaAuthError extends Error {
  constructor(message: string) {
    // Sanitize any accidental key material before storing
    super(OatdaAuthError.sanitize(message));
    this.name = 'OatdaAuthError';
  }

  /** Redact anything that looks like an API key */
  static sanitize(text: string): string {
    return text.replace(
      /\b(oatda_|sk_|oatda-)[A-Za-z0-9_-]{16,}\b/g,
      '[REDACTED]'
    );
  }
}

/**
 * OATDA Authentication Manager
 */
export class OatdaAuth {
  private configPath: string;

  constructor(config?: OatdaAuthConfig) {
    this.configPath = config?.configPath || DEFAULT_CREDENTIALS_FILE;
  }

  /**
   * Get API key from multiple sources with security priority
   *
   * Priority (most secure to least secure):
   * 1. Direct parameter (runtime-only)
   * 2. Config file (~/.oatda/credentials.json, mode 0600)
   * 3. Environment variable (OATDA_API_KEY)
   *
   * @param config - Optional auth configuration
   * @returns API key string
   * @throws Error if no API key found
   */
  getApiKey(config?: OatdaAuthConfig): string {
    // 1. Direct parameter (highest priority, runtime-only)
    if (config?.apiKey) {
      return config.apiKey;
    }

    // 2. Config file (permissions-restricted)
    try {
      const fileKey = this.getFromConfigFile(config?.profile);
      if (fileKey) {
        this.validateConfigFilePermissions();
        return fileKey;
      }
    } catch (error) {
      // Config file not found or invalid, continue to next method
    }

    // 3. Environment variable (development/convenience)
    const envKey = process.env.OATDA_API_KEY;
    if (envKey) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Using OATDA_API_KEY env var in production is not recommended');
      }
      return envKey;
    }

    throw new OatdaAuthError(
      'No API key found. Configure one of:\n' +
      '  1. Config file: ~/.oatda/credentials.json\n' +
      '  2. Environment: OATDA_API_KEY=your_key\n' +
      '  3. Direct parameter: apiKey option\n\n' +
      'Get your API key at: https://oatda.com/dashboard/api-keys'
    );
  }

  /**
   * Get API key from config file
   */
  private getFromConfigFile(profile?: string): string | null {
    const configDir = path.dirname(this.configPath);

    // Check if config directory exists
    if (!fs.existsSync(configDir)) {
      return null;
    }

    // Check if credentials file exists
    if (!fs.existsSync(this.configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      const credentials: CredentialsFile = JSON.parse(content);

      // Determine which profile to use
      const profileName = profile || credentials.defaultProfile || 'default';
      const profileData = credentials.profiles[profileName];

      if (!profileData) {
        throw new Error(`Profile "${profileName}" not found in credentials file`);
      }

      return profileData.apiKey;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in credentials file: ${this.configPath}`);
      }
      throw error;
    }
  }

  /**
   * Validate config file has restrictive permissions
   * Warns if file is readable by others
   */
  private validateConfigFilePermissions(): void {
    try {
      const stats = fs.statSync(this.configPath);
      const mode = stats.mode & 0o777;

      // File should be 0600 (owner read/write only)
      if (mode !== SECURE_FILE_PERMISSIONS) {
        console.warn(
          `⚠️  Config file has insecure permissions: ${mode.toString(8)}\n` +
          `   Recommended: chmod 600 ${this.configPath}\n` +
          `   Run: chmod 600 ${this.configPath}`
        );
      }
    } catch (error) {
      // File doesn't exist yet, will be created with secure permissions
    }
  }

  /**
   * Validate API key format
   *
   * OATDA API keys should start with "oatda_" or "sk_"
   * and be at least 20 characters long
   */
  static validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Check minimum length
    if (apiKey.length < 20) {
      return false;
    }

    // Check key prefix
    const validPrefixes = ['oatda_', 'sk_', 'oatda-'];
    const hasValidPrefix = validPrefixes.some((prefix) => apiKey.startsWith(prefix));

    return hasValidPrefix;
  }

  /**
   * Store API key in config file
   *
   * Creates the config directory and file with secure permissions
   */
  static async storeApiKey(apiKey: string, options?: { profile?: string; baseUrl?: string; makeDefault?: boolean }): Promise<void> {
    if (!OatdaAuth.validateApiKey(apiKey)) {
      throw new Error('Invalid API key format. API keys should start with "oatda_" or "sk_" and be at least 20 characters.');
    }

    const configDir = path.dirname(DEFAULT_CREDENTIALS_FILE);
    const credentialsPath = DEFAULT_CREDENTIALS_FILE;

    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }

    // Load existing credentials or create new
    let credentials: CredentialsFile;
    if (fs.existsSync(credentialsPath)) {
      const content = fs.readFileSync(credentialsPath, 'utf-8');
      credentials = JSON.parse(content);
    } else {
      credentials = {
        version: 1,
        defaultProfile: 'default',
        profiles: {},
      };
    }

    // Determine profile name
    const profileName = options?.profile || 'default';

    // Create or update profile
    credentials.profiles[profileName] = {
      name: profileName,
      apiKey,
      baseUrl: options?.baseUrl,
      createdAt: credentials.profiles[profileName]?.createdAt || Date.now(),
      lastUsed: Date.now(),
    };

    // Set as default if requested or if it's the only profile
    if (options?.makeDefault || !credentials.defaultProfile || profileName === 'default') {
      credentials.defaultProfile = profileName;
    }

    // Write credentials file with secure permissions
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), {
      mode: SECURE_FILE_PERMISSIONS,
    });

    console.log(`✅ API key stored for profile "${profileName}"`);
    console.log(`   Config file: ${credentialsPath}`);
    console.log(`   Permissions: 600 (owner read/write only)`);
  }

  /**
   * List all configured profiles
   */
  static listProfiles(): Array<{ name: string; baseUrl?: string; lastUsed: number }> {
    const credentialsPath = DEFAULT_CREDENTIALS_FILE;

    if (!fs.existsSync(credentialsPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(credentialsPath, 'utf-8');
      const credentials: CredentialsFile = JSON.parse(content);

      return Object.values(credentials.profiles).map((profile) => ({
        name: profile.name,
        baseUrl: profile.baseUrl,
        lastUsed: profile.lastUsed,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get active profile from environment
   *
   * Checks OATDA_PROFILE env var, falls back to "default"
   */
  static getActiveProfile(): string {
    return process.env.OATDA_PROFILE || 'default';
  }

  /**
   * Get config directory path
   */
  static getConfigDir(): string {
    return DEFAULT_CONFIG_DIR;
  }

  /**
   * Get credentials file path
   */
  static getCredentialsPath(): string {
    return DEFAULT_CREDENTIALS_FILE;
  }
}

/**
 * Convenience function to get API key
 *
 * Usage:
 * ```typescript
 * import { getApiKey } from './shared/auth.js';
 *
 * const apiKey = getApiKey();
 * const client = new OatdaClient({ apiKey });
 * ```
 */
export function getApiKey(config?: OatdaAuthConfig): string {
  const auth = new OatdaAuth(config);
  return auth.getApiKey(config);
}

/**
 * Convenience function to store API key
 *
 * Usage:
 * ```bash
 * node -e "import('./shared/auth.js').then(m => m.OatdaAuth.storeApiKey('your_api_key'))"
 * ```
 */
export async function storeApiKey(apiKey: string, options?: { profile?: string; baseUrl?: string; makeDefault?: boolean }): Promise<void> {
  return OatdaAuth.storeApiKey(apiKey, options);
}

/**
 * Convenience function to list profiles
 *
 * Usage:
 * ```bash
 * node -e "import('./shared/auth.js').then(m => console.table(m.OatdaAuth.listProfiles()))"
 * ```
 */
export function listProfiles(): Array<{ name: string; baseUrl?: string; lastUsed: number }> {
  return OatdaAuth.listProfiles();
}
