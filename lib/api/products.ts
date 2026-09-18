import { apiClient } from './client';
import { ProductDto, UpdateProductDto } from './types';

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

  /**
   * PATCH /products/:id
   * Admin updates product classification rules or details.
   */
  updateProduct: async (id: string, dto: UpdateProductDto): Promise<ProductDto> => {
    return apiClient.patch<ProductDto>(`/products/${encodeURIComponent(id)}`, dto);
  },
};
