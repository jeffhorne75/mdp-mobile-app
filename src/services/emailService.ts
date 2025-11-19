import { Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export type EmailAppPreference = 'default' | 'gmail' | 'outlook' | 'copy';

export class EmailService {
  static async handleEmailPress(
    email: string, 
    preference: EmailAppPreference,
    onError?: (message: string) => void
  ): Promise<void> {
    try {
      switch (preference) {
        case 'default':
          await this.openDefaultMailApp(email);
          break;
        case 'gmail':
          await this.openGmailApp(email);
          break;
        case 'outlook':
          await this.openOutlookApp(email);
          break;
        case 'copy':
          await this.copyEmailToClipboard(email);
          break;
        default:
          await this.openDefaultMailApp(email);
      }
    } catch (_error) {
      // Fallback to copy email if opening app fails
      await this.copyEmailToClipboard(email, true);
      if (onError) {
        onError(`Couldn't open the email app. The email address "${email}" has been copied to your clipboard.`);
      }
    }
  }

  private static async openDefaultMailApp(email: string): Promise<void> {
    const canOpen = await Linking.canOpenURL(`mailto:${email}`);
    if (canOpen) {
      await Linking.openURL(`mailto:${email}`);
    } else {
      throw new Error('No email app available');
    }
  }

  private static async openGmailApp(email: string): Promise<void> {
    // Try multiple Gmail URL schemes for better compatibility
    const gmailUrls = Platform.select({
      ios: [
        // Primary scheme for iOS Gmail app (correct format)
        `googlegmail://co?to=${encodeURIComponent(email)}`,
        // Alternative scheme with triple slash
        `googlegmail:///co?to=${encodeURIComponent(email)}`,
        // Fallback to basic gmail scheme
        `gmail://co?to=${encodeURIComponent(email)}`,
      ],
      android: [
        // Primary Android intent using googlegmail scheme
        `intent://co?to=${encodeURIComponent(email)}#Intent;scheme=googlegmail;package=com.google.android.gm;end`,
        // Alternative using mailto scheme with Gmail package
        `intent://send?to=${encodeURIComponent(email)}#Intent;scheme=mailto;package=com.google.android.gm;end`,
        // Fallback intent
        `intent://compose?to=${encodeURIComponent(email)}#Intent;package=com.google.android.gm;end`,
      ],
    }) || [];

    console.log(`Attempting to open Gmail with ${gmailUrls.length} URL schemes...`);

    // Try each URL scheme until one works
    for (const [index, gmailUrl] of gmailUrls.entries()) {
      try {
        console.log(`Trying Gmail URL ${index + 1}/${gmailUrls.length}: ${gmailUrl}`);
        const canOpen = await Linking.canOpenURL(gmailUrl);
        console.log(`Can open Gmail URL ${index + 1}: ${canOpen}`);
        
        if (canOpen) {
          console.log(`Opening Gmail with URL: ${gmailUrl}`);
          await Linking.openURL(gmailUrl);
          return;
        }
      } catch (_error) {
        console.log(`Failed to open Gmail with URL ${index + 1}: ${gmailUrl}`, _error);
        continue;
      }
    }

    // If no app URL works, throw error to trigger fallback
    throw new Error('Gmail app not available or installed');
  }

  private static async openOutlookApp(email: string): Promise<void> {
    const outlookUrl = Platform.select({
      ios: `ms-outlook://compose?to=${email}`,
      android: `intent://send?to=${email}#Intent;scheme=mailto;package=com.microsoft.office.outlook;end`,
    });

    if (outlookUrl) {
      const canOpen = await Linking.canOpenURL(outlookUrl);
      if (canOpen) {
        await Linking.openURL(outlookUrl);
        return;
      }
    }

    // Fallback to web Outlook
    const webOutlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${email}`;
    const canOpenWeb = await Linking.canOpenURL(webOutlookUrl);
    if (canOpenWeb) {
      await Linking.openURL(webOutlookUrl);
    } else {
      throw new Error('Outlook not available');
    }
  }

  private static async copyEmailToClipboard(email: string, _isFallback: boolean = false): Promise<void> {
    await Clipboard.setStringAsync(email);
    // Note: Success notification will be handled by the caller when not a fallback
  }
}