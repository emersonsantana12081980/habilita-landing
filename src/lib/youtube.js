// Aceita somente URLs de vídeo do YouTube. Nunca incorpora HTML ou URL arbitrária.
export function youtubeId(value) {
  try {
    const url=new URL(String(value).trim());
    if(url.protocol!=='https:' || url.username || url.password || url.port)return null;
    const host=url.hostname.toLowerCase();
    let id;
    if(host==='youtu.be')id=url.pathname.slice(1);
    else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)) {
      if(url.pathname==='/watch')id=url.searchParams.get('v');
      else id=url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
