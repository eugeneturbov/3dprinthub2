const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  } : undefined,
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: true
});

// Check Elasticsearch connection
const checkConnection = async () => {
  try {
    const response = await client.ping();
    if (response.statusCode === 200) {
      console.log('✅ Elasticsearch connected');
      return true;
    }
  } catch (error) {
    console.error('❌ Elasticsearch connection error:', error.message);
    return false;
  }
};

// Initialize Elasticsearch indices
const initIndices = async () => {
  try {
    // Products index
    const productsIndex = {
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: {
            type: 'text',
            analyzer: 'russian',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          description: {
            type: 'text',
            analyzer: 'russian'
          },
          short_description: {
            type: 'text',
            analyzer: 'russian'
          },
          slug: { type: 'keyword' },
          type: { type: 'keyword' },
          price: { type: 'float' },
          compare_price: { type: 'float' },
          shop_id: { type: 'keyword' },
          shop_name: {
            type: 'text',
            analyzer: 'russian',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          category_id: { type: 'keyword' },
          category_name: {
            type: 'text',
            analyzer: 'russian',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          is_active: { type: 'boolean' },
          is_featured: { type: 'boolean' },
          view_count: { type: 'integer' },
          sold_count: { type: 'integer' },
          rating: { type: 'float' },
          review_count: { type: 'integer' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' },
          tags: { type: 'keyword' },
          materials: { type: 'keyword' },
          colors: { type: 'keyword' }
        }
      }
    };

    // Create products index if it doesn't exist
    const exists = await client.indices.exists({ index: 'products' });
    if (!exists) {
      await client.indices.create({
        index: 'products',
        body: productsIndex
      });
      console.log('✅ Elasticsearch products index created');
    }

    // Shops index
    const shopsIndex = {
      mappings: {
        properties: {
          id: { type: 'keyword' },
          name: {
            type: 'text',
            analyzer: 'russian',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          slug: { type: 'keyword' },
          description: {
            type: 'text',
            analyzer: 'russian'
          },
          status: { type: 'keyword' },
          rating: { type: 'float' },
          review_count: { type: 'integer' },
          total_sales: { type: 'float' },
          is_active: { type: 'boolean' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' }
        }
      }
    };

    // Create shops index if it doesn't exist
    const shopsExists = await client.indices.exists({ index: 'shops' });
    if (!shopsExists) {
      await client.indices.create({
        index: 'shops',
        body: shopsIndex
      });
      console.log('✅ Elasticsearch shops index created');
    }

    console.log('✅ Elasticsearch indices initialized');
  } catch (error) {
    console.error('❌ Error initializing Elasticsearch indices:', error.message);
  }
};

module.exports = {
  client,
  checkConnection,
  initIndices
};
