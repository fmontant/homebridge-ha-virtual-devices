export interface HomeAssistantConfig {
  /**
   * URL de Home Assistant
   * Exemple : http://192.168.190.50:8123
   */
  haUrl: string;

  /**
   * Jeton d'accès longue durée Home Assistant
   */
  token: string;

  /**
   * Activer les logs de débogage
   */
  debug?: boolean;
}