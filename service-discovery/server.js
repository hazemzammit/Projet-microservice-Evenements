const express = require('express');
const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());

// Store for registered services
let services = [];

// Add service
app.post('/register', (req, res) => {
  const { name, url, port, metadata = {} } = req.body;
  
  if (!name || !url || !port) {
    return res.status(400).json({
      success: false,
      message: 'Les champs name, url et port sont obligatoires'
    });
  }
  
  // Check if service already exists
  const existingIndex = services.findIndex(s => s.name === name && s.url === url);
  
  if (existingIndex >= 0) {
    // Update existing service
    services[existingIndex] = {
      ...services[existingIndex],
      port,
      metadata,
      lastHeartbeat: new Date(),
      status: 'active'
    };
    
    console.log(`✓ Service mis à jour: ${name} (${url}:${port})`);
    
    return res.json({
      success: true,
      message: 'Service mis à jour',
      serviceId: services[existingIndex].id,  // ← Add this
      service: services[existingIndex]
    });
  }
  
  // Add new service
  const newService = {
    id: `${name}-${Date.now()}`,
    name,
    url,
    port,
    status: 'active',
    registeredAt: new Date(),
    lastHeartbeat: new Date(),
    metadata
  };
  
  services.push(newService);
  
  console.log(`✅ Nouveau service enregistré: ${name} (${url}:${port})`);
  
  res.status(201).json({
    success: true,
    message: 'Service enregistré avec succès',
    serviceId: newService.id,  // ← Add this line
    service: newService
  });
});

// Get all services
app.get('/services', (req, res) => {
  res.json({
    success: true,
    count: services.length,
    services: services
  });
});

// Get service by name
app.get('/services/by-name/:name', (req, res) => {
  const { name } = req.params;
  
  const service = services.find(s => s.name === name && s.status === 'active');
  
  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service non trouvé ou inactif'
    });
  }
  
  res.json({
    success: true,
    service
  });
});

// Heartbeat endpoint
app.post('/heartbeat/:serviceId', (req, res) => {
  const { serviceId } = req.params;
  
  const service = services.find(s => s.id === serviceId);
  
  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service non trouvé'
    });
  }
  
  service.lastHeartbeat = new Date();
  service.status = 'active';
  
  res.json({
    success: true,
    message: 'Heartbeat reçu'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: services.length,
    timestamp: new Date().toISOString()
  });
});

// Remove inactive services (cleanup)
setInterval(() => {
  const now = new Date();
  const timeout = 60000; // 60 seconds
  
  services = services.filter(service => {
    const timeDiff = now - new Date(service.lastHeartbeat);
    
    if (timeDiff > timeout) {
      console.log(`🗑️ Suppression du service inactif: ${service.name}`);
      return false;
    }
    
    return true;
  });
}, 30000); // Check every 30 seconds

// Start server
app.listen(PORT, () => {
  console.log('\n══════════════════════════════════════════');
  console.log('🔍 Service Discovery (similaire à classe)');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('══════════════════════════════════════════\n');
});