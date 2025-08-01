import { goGentAPI } from './client';
import { goGentGRPCAPI } from './grpcClient';

// Configuration for API client selection
export type APIClientType = 'rest' | 'grpc-gateway';

// API factory that returns the appropriate client
export class APIFactory {
  private static currentClientType: APIClientType = 'rest'; // Default to REST for mobile compatibility

  static setClientType(type: APIClientType) {
    this.currentClientType = type;
    console.log(`🔄 Switched to ${type} API client`);
  }

  static getClient() {
    switch (this.currentClientType) {
      case 'grpc-gateway':
        // Update base URL to the gRPC gateway
        goGentGRPCAPI.updateBaseURL('http://localhost:8081');
        return goGentGRPCAPI;
      case 'rest':
      default:
        // Use the REST API client
        goGentAPI.updateBaseURL('http://localhost:8080');
        return goGentAPI;
    }
  }

  static getCurrentClientType(): APIClientType {
    return this.currentClientType;
  }
}

// Export the factory as the default way to access the API
export const api = APIFactory.getClient();

// Export individual clients for specific use cases
export { goGentAPI as restAPI, goGentGRPCAPI as grpcAPI };

// Helper function to switch API client type
export const switchAPIClient = (type: APIClientType) => {
  APIFactory.setClientType(type);
  return APIFactory.getClient();
}; 