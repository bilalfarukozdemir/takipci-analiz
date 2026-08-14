import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export type PickedFile = { name: string; bytes: Uint8Array; size: number };

/** 120 MB üzerindeki dosyalarda kullanıcıyı uyarırız (tüm arşiv seçilmiş olabilir). */
export const BUYUK_DOSYA = 120 * 1024 * 1024;

/** Kullanıcıya dosya seçtirir ve içeriklerini bellek içine okur. */
export async function pickFiles(): Promise<PickedFile[] | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    multiple: true,
    copyToCacheDirectory: true,
    base64: false,
  });
  if (res.canceled || !res.assets?.length) return null;

  const out: PickedFile[] = [];
  for (const asset of res.assets) {
    const bytes = await new File(asset.uri).bytes();
    out.push({
      name: asset.name || 'dosya',
      bytes,
      size: asset.size ?? bytes.byteLength,
    });
  }
  return out;
}
