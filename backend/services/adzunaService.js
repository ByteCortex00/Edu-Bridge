// backend/services/adzunaService.js
import axios from 'axios';

class AdzunaService {
  constructor() {
    this.baseUrl = 'https://api.adzuna.com/v1/api/jobs';
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
  }

  /**
   * Search jobs by keyword and location
   */
  async searchJobs(params = {}) {
    try {
      const {
        keyword = '',
        location = 'nairobi',
        country = 'ke',
        page = 1,
        resultsPerPage = 50,
        category = null
      } = params;

      const url = `${this.baseUrl}/${country}/search/${page}`;
      
      const response = await axios.get(url, {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          what: keyword,
          where: location,
          results_per_page: resultsPerPage,
          category: category
        }
      });

      return {
        success: true,
        data: response.data.results,
        totalResults: response.data.count
      };
    } catch (error) {
      console.error('Adzuna API Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get job categories
   */
  async getCategories(country = 'ke') {
    try {
      const url = `${this.baseUrl}/${country}/categories`;
      
      const response = await axios.get(url, {
        params: {
          app_id: this.appId,
          app_key: this.appKey
        }
      });

      return {
        success: true,
        data: response.data.results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get salary statistics
   */
  async getSalaryStats(params = {}) {
    try {
      const {
        keyword,
        location = 'nairobi',
        country = 'ke'
      } = params;

      const url = `${this.baseUrl}/${country}/history`;
      
      const response = await axios.get(url, {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          what: keyword,
          location1: location
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new AdzunaService();