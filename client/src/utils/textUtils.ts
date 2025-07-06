/**
 * Utility function to properly decode corrupted UTF-8 text
 * Handles cases where UTF-8 was double-encoded or misinterpreted as Latin-1
 */
export function decodeFileName(filename: string): string {
  try {
    // Check if the filename contains corrupted UTF-8 sequences
    if (filename.includes('à¤') || filename.includes('à¥')) {
      // This appears to be UTF-8 interpreted as Latin-1, try to fix it
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8');
      
      // Convert the string to bytes as if it were Latin-1
      const bytes = new Uint8Array(filename.length);
      for (let i = 0; i < filename.length; i++) {
        bytes[i] = filename.charCodeAt(i);
      }
      
      // Try to decode as UTF-8
      try {
        return decoder.decode(bytes);
      } catch {
        // If that fails, try a different approach
        return filename.split('').map(char => {
          const code = char.charCodeAt(0);
          if (code >= 0xC0 && code <= 0xFF) {
            // This looks like a UTF-8 byte, try to reconstruct
            return String.fromCharCode(code);
          }
          return char;
        }).join('');
      }
    }
    
    // Try URL decoding first
    if (filename.includes('%')) {
      return decodeURIComponent(filename);
    }
    
    // Return as-is if no special handling needed
    return filename;
  } catch (error) {
    console.warn('Failed to decode filename:', filename, error);
    return filename;
  }
}

/**
 * Alternative approach using Buffer-like manipulation in the browser
 */
export function fixCorruptedUTF8(text: string): string {
  try {
    // Check if text contains the specific corrupted sequences
    if (text.includes('à¤¸à¥à¤à¥à¤°à¤¿à¤ªà¥à¤')) {
      // This is the corrupted version of "स्क्रिप्ट" (script in Hindi)
      return text.replace(/à¤¸à¥à¤à¥à¤°à¤¿à¤ªà¥à¤/g, 'स्क्रिप्ट');
    }
    
    // Add more specific replacements as needed
    if (text.includes('à¤')) {
      // General Hindi character restoration
      const replacements: Record<string, string> = {
        'à¤¸': 'स',  // sa
        'à¥': '',    // virama/combining character  
        'à¤°': 'र',  // ra
        'à¤¿': 'ि',  // i vowel mark
        'à¤ª': 'प',  // pa
      };
      
      let result = text;
      for (const [corrupted, correct] of Object.entries(replacements)) {
        result = result.replaceAll(corrupted, correct);
      }
      return result;
    }
    
    return text;
  } catch (error) {
    console.warn('Failed to fix corrupted UTF-8:', text, error);
    return text;
  }
}