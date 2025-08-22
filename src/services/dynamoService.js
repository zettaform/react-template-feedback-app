// DynamoDB Service for React App
// This service connects to AWS DynamoDB and fetches customer data

class DynamoDBService {
  constructor() {
    this.baseUrl = 'http://localhost:8080/api'; // Local DynamoDB viewer API
    this.customers = [];
    this.isConnected = false;
  }

  // Fetch customers from DynamoDB via local API
  async fetchCustomers() {
    try {
      console.log('Fetching from:', `${this.baseUrl}/customers`);
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('DynamoDB Response:', data);
      
      if (data.success) {
        this.customers = this.transformCustomers(data.customers);
        this.isConnected = true;
        console.log('Transformed customers:', this.customers);
        return this.customers;
      } else {
        console.error('DynamoDB Error:', data.error);
        this.isConnected = false;
        return [];
      }
    } catch (error) {
      console.error('Connection Error:', error);
      this.isConnected = false;
      return [];
    }
  }

  // Transform DynamoDB data to match React table format
  transformCustomers(dynamoCustomers) {
    return dynamoCustomers.map((customer, index) => ({
      id: customer.customer_id || index.toString(),
      image: this.getRandomAvatar(index),
      name: `${customer.first_name || 'Unknown'} ${customer.last_name || 'User'}`,
      email: customer.email || 'no-email@example.com',
      location: this.formatLocation(customer.address),
      orders: '0', // DynamoDB doesn't have orders field yet
      lastOrder: '#000000', // DynamoDB doesn't have last_order field yet  
      spent: '$0.00', // DynamoDB doesn't have total_spent field yet
      refunds: '0', // DynamoDB doesn't have refunds field yet
      fav: false, // DynamoDB doesn't have favorite field yet
      status: customer.status || 'active',
      subscription_tier: customer.subscription_tier || 'basic',
      created_at: customer.created_at,
      phone: customer.phone,
      onboardingCompleted: true // Default for now
    }));
  }

  // Format address for location display
  formatLocation(address) {
    if (!address) return '🌍 Unknown';
    
    const countryFlags = {
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'CA': '🇨🇦',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'AU': '🇦🇺'
    };

    const flag = countryFlags[address.country] || '🌍';
    const city = address.city || 'Unknown City';
    const state = address.state || address.country || 'Unknown';
    
    return `${flag} ${city}, ${state}`;
  }

  // Get S3 avatar for customer
  getRandomAvatar(index) {
    const s3AvatarUrls = [
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-01.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-02.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-03.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-04.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-05.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-06.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-07.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-08.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-09.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-10.jpg"
    ];
    return s3AvatarUrls[index % s3AvatarUrls.length];
  }

  // Add new customer to DynamoDB
  async addCustomer(customerData) {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });
      
      const result = await response.json();
      if (result.success) {
        return await this.fetchCustomers(); // Refresh data
      }
      return false;
    } catch (error) {
      console.error('Error adding customer:', error);
      return false;
    }
  }

  // Update customer in DynamoDB
  async updateCustomer(customerId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      if (result.success) {
        return await this.fetchCustomers(); // Refresh data
      }
      return false;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  }

  // Delete customer from DynamoDB
  async deleteCustomer(customerId) {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        return await this.fetchCustomers(); // Refresh data
      }
      return false;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      customerCount: this.customers.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export default new DynamoDBService();
