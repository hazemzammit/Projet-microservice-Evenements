const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 5000;

const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://service-discovery:4000/services';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let servicesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000;

// Function to get services from Service Discovery
async function getServices() {
  const now = Date.now();
  
  if (servicesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return servicesCache;
  }
  
  try {
    console.log('Fetching services from Service Discovery...');
    const response = await axios.get(DISCOVERY_URL);
    
    if (response.data.success && response.data.services) {
      servicesCache = response.data.services;
      cacheTimestamp = now;
      console.log(`Found ${servicesCache.length} services`);
      return servicesCache;
    }
  } catch (error) {
    console.error('Error fetching services:', error.message);
  }
  
  return null;
}


// Base route - HANDLED DIRECTLY
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway',
    version: '1.0.0',
    endpoints: {
      evenements: '/api/evenements/*',
      utilisateurs: '/api/utilisateurs/*',
      experiences: '/api/experiences/*',
      promotions: '/api/promotions/*',
      coupons: '/api/coupons/*',
      categories: '/api/categories/*',
      products: '/api/products/*',
      reservations: '/api/reservations/*' 
    },
    timestamp: new Date().toISOString()
  });
});

// Health check - HANDLED DIRECTLY
app.get('/health', async (req, res) => {
  try {
    const services = await getServices();
    res.json({
      status: 'healthy',
      services: services ? services.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Cannot reach Service Discovery'
    });
  }
});


// Middleware to find target service based on path
app.use(async (req, res, next) => {
  // Skip if not an API route
  if (!req.path.startsWith('/api/')) {
    return next(); // Let Express continue to other routes
  }
  
  console.log(`\n[GATEWAY] API Request: ${req.method} ${req.path}`);
  console.log('[GATEWAY] Request body:', req.body);
  console.log('[GATEWAY] Content-Type:', req.headers['content-type']);
  
  try {
    const services = await getServices();
    
    if (!services || services.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'Aucun service disponible'
      });
    }
    
    let targetService = null;
    let pathMapping = null;
    
    if (req.path.startsWith('/api/evenements')) {
      targetService = services.find(s => s.name === 'service-evenements');
      pathMapping = (path) => path;
    }  else if (req.path.startsWith('/api/reviews')) {
      targetService = services.find(s => s.name === 'service-evenements');
      pathMapping = (path) => path;
    }
    else if (req.path.startsWith('/api/utilisateurs')) {
      targetService = services.find(s => s.name === 'service-utilisateurs');
      pathMapping = (path) => path.replace('/api/utilisateurs', '/users');
    } else if (req.path.startsWith('/api/experiences')) {
      targetService = services.find(s => s.name === 'service-experiences');
      pathMapping = (path) => path.replace('/api/experiences', '/experience');
    } else if (req.path.startsWith('/api/promotions')) {
  targetService = services.find(s => s.name === 'service-promotions');
  pathMapping = (path) => path;
} else if (req.path.startsWith('/api/coupons')) {
  targetService = services.find(s => s.name === 'service-promotions');
  pathMapping = (path) => path;
} 
else if (req.path.startsWith('/api/stats')) {
  targetService = services.find(s => s.name === 'service-promotions');
  pathMapping = (path) => path; 
}
else if (req.path.startsWith('/api/categories')) {
      targetService = services.find(s => s.name === 'service-shop');
      pathMapping = (path) => path.replace('/api/categories', '/api/categories');
    } else if (req.path.startsWith('/api/products')) {
      targetService = services.find(s => s.name === 'service-shop');
      pathMapping = (path) => path.replace('/api/products', '/api/products');
    }else if (req.path.startsWith('/api/reservations')) {
  targetService = services.find(s => s.name === 'service-reservation');
  pathMapping = (path) => path;
}

    
    
    if (!targetService) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé pour cette route'
      });
    }
    
    if (targetService.status !== 'active') {
      return res.status(503).json({
        success: false,
        message: `Le service ${targetService.name} est inactif`
      });
    }
    
    req.targetService = targetService;
    req.pathMapping = pathMapping;
    next();
    
  } catch (error) {
    console.error('Erreur gateway:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur de communication avec le Service Discovery'
    });
  }
});

app.use(async (req, res, next) => {
  // This will only run for routes that have targetService set
  if (!req.targetService) {
    return next(); // ✅ Now 'next' is properly available as a parameter
  }
  
  try {
    const { targetService, pathMapping } = req;
    
    const targetPath = pathMapping(req.path);
    const targetUrl = `${targetService.url}${targetPath}`;
    
    console.log(`[GATEWAY] Forwarding ${req.method} to: ${targetUrl}`);
    console.log('[GATEWAY] Request body being sent:', req.body);
    
    
    // Prepare headers for forwarding
    const headers = {
      ...req.headers,
      'X-Gateway': 'true',
      'X-Original-IP': req.ip || req.connection.remoteAddress
    };
    
    // Remove content-length header as axios will set it correctly
    delete headers['content-length'];
    
    // If no content-type is set for POST/PUT/PATCH, set it to application/json
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }
    
    console.log('[GATEWAY] Headers being sent:', headers);
    
    // Configure axios request with longer timeout
    const config = {
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: headers,
      timeout: 60000, // 60 seconds timeout
      validateStatus: function (status) {
        return status >= 200 && status < 600; // Accept all status codes
      }
    };
    
    console.log('[GATEWAY] Sending request with config:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      dataLength: req.body ? JSON.stringify(req.body).length : 0
    });
    
    const response = await axios(config);
    
    console.log(`[GATEWAY] Received response: ${response.status} ${response.statusText}`);
    
    // Forward the response
    res.status(response.status)
       .set(response.headers)
       .json(response.data);
    
  } catch (error) {
    console.error(`[GATEWAY] Error proxying request:`, error.message);
    console.error('[GATEWAY] Error code:', error.code);
    console.error('[GATEWAY] Error response:', error.response?.status, error.response?.data);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Service non disponible'
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Timeout de la requête vers le service'
      });
    }
    
    if (error.response) {
      // Forward the error response from the service
      return res.status(error.response.status)
                .set(error.response.headers || {})
                .json(error.response.data);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la communication avec le service',
      error: error.message,
      code: error.code
    });
  }
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n══════════════════════════════════════════');
  console.log('🚀 Passerelle API (similaire à classe)');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('══════════════════════════════════════════\n');
});

module.exports = app;