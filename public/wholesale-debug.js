(function() {
  console.log('=== WHOLESALE DEBUG SCRIPT ===');
  console.log('Shop:', window.Shopify?.shop);
  console.log('Cart API available:', typeof fetch);
  
  // Crear banner de debug
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff0000;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 999999;
    font-family: monospace;
    font-size: 12px;
    max-width: 300px;
  `;
  banner.textContent = 'Script cargado! Ver consola (F12)';
  document.body.appendChild(banner);
  
  setTimeout(() => banner.remove(), 5000);
  
  // Verificar carrito
  fetch('/cart.js')
    .then(r => r.json())
    .then(cart => {
      console.log('Cart:', cart);
      console.log('Items:', cart.items);
    })
    .catch(e => console.error('Error fetching cart:', e));
})();


