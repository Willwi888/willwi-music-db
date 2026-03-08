export const cleanAudioUrl = (url?: string) => {
    if (!url) return '';
    let cleanUrl = url.trim();
    
    // Dropbox
    if (cleanUrl.includes('dropbox.com')) {
        cleanUrl = cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        cleanUrl = cleanUrl.replace('?dl=0', '');
        if (!cleanUrl.includes('?raw=1') && !cleanUrl.includes('dl.dropboxusercontent.com')) {
            cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'raw=1';
        }
    }
    
    // Google Drive
    if (cleanUrl.includes('drive.google.com/file/d/')) {
        const match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            cleanUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }
    
    return cleanUrl;
};
