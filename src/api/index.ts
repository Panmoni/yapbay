// src/api/index.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../config';

export class YapBayAPI {
  private client: AxiosInstance;
  
  constructor(baseURL: string = config.apiUrl) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add JWT token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
  
  // Public endpoints
  async getPrices() {
    return this.client.get('/prices');
  }
  
  async getOffers(params?: { type?: string; token?: string; owner?: string }) {
    return this.client.get('/offers', { params });
  }
  
  async getOfferById(id: string) {
    return this.client.get(`/offers/${id}`);
  }
  
  // Authentication endpoints
  async createAccount(data: { wallet_address: string; username: string; email: string }) {
    return this.client.post('/accounts', data);
  }
  
  async getMyAccount() {
    return this.client.get('/accounts/me');
  }
  
  async getAccountById(id: string) {
    return this.client.get(`/accounts/${id}`);
  }
  
  async updateAccount(id: string, data: any) {
    return this.client.put(`/accounts/${id}`, data);
  }
  
  // Offer management
  async createOffer(data: any) {
    return this.client.post('/offers', data);
  }
  
  async updateOffer(id: string, data: any) {
    return this.client.put(`/offers/${id}`, data);
  }
  
  async deleteOffer(id: string) {
    return this.client.delete(`/offers/${id}`);
  }
  
  // Trade endpoints
  async createTrade(data: any) {
    return this.client.post('/trades', data);
  }
  
  async getTrades() {
    return this.client.get('/trades');
  }
  
  async getMyTrades() {
    return this.client.get('/my/trades');
  }
  
  async getTradeById(id: string) {
    return this.client.get(`/trades/${id}`);
  }
  
  async updateTrade(id: string, data: any) {
    return this.client.put(`/trades/${id}`, data);
  }
  
  // Escrow endpoints
  async createEscrow(data: any) {
    return this.client.post('/escrows/create', data);
  }
}

// Create a singleton instance
export const api = new YapBayAPI();
