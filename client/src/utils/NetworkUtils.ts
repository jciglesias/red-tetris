export class NetworkUtils {

  static async testConnection(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn(`Impossible de se connecter à ${url}:`, error);
      return false;
    }
  }

  static async findWorkingServerUrl(): Promise<string> {
    const candidateUrls: string[] = [];

    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      candidateUrls.push(`${protocol}//${hostname}:3001`);
    }

    candidateUrls.push(
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    );

    //console.log('Test des URLs candidates:', candidateUrls);

    for (const url of candidateUrls) {
      if (await this.testConnection(url)) {
        //console.log('URL fonctionnelle trouvée:', url);
        return url;
      }
    }

    return 'http://localhost:3001';
  }
}
