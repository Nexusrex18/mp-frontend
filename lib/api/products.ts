import { apiClient } from './client';
import { ProductDto } from './types';

export const productsApi = {
  /**
   * GET /products
   * Retrieves all products in the pharmaceutical catalog.
   */
  getProducts: async (): Promise<ProductDto[]> => {
    return apiClient.get<ProductDto[]>('/products');
  },

  /**
   * GET /products/:id
   * Retrieves a specific product by ID.
   */
  getProductById: async (id: string): Promise<ProductDto> => {
    return apiClient.get<ProductDto>(`/products/${encodeURIComponent(id)}`);
  },
};
