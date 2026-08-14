import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Share } from 'react-native';

/** Profili önce Instagram uygulamasında, olmazsa tarayıcıda açar. */
export async function openProfile(username: string): Promise<void> {
  const name = encodeURIComponent(username);
  try {
    await Linking.openURL(`instagram://user?username=${name}`);
  } catch {
    try {
      await Linking.openURL(`https://www.instagram.com/${name}/`);
    } catch {
      // açılamadıysa sessizce geç
    }
  }
}

export async function openUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    // yoksay
  }
}

export async function copyUsernames(usernames: string[]): Promise<void> {
  await Clipboard.setStringAsync(usernames.join('\n'));
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'liste';

/** Listeyi .txt olarak paylaşır; olmazsa düz metin paylaşımına düşer. */
export async function shareUsernames(title: string, usernames: string[]): Promise<void> {
  const content = `${title} (${usernames.length})\n\n${usernames.map((u) => `@${u}`).join('\n')}\n`;
  try {
    if (await Sharing.isAvailableAsync()) {
      const file = new File(Paths.cache, `${slug(title)}.txt`);
      if (file.exists) file.delete();
      file.create({ overwrite: true });
      await file.write(content);
      await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: title });
      return;
    }
  } catch {
    // dosya paylaşımı olmadıysa metin paylaşımına düş
  }
  await Share.share({ message: content }).catch(() => undefined);
}
