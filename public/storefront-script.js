(function() {
  'use strict';

  const API_ENDPOINT = '/apps/wholesale-pricing/api';
  
  let rulesCache = new Map();
  let currentProductId = null;
  let currentVariantId = null;

  async function fetchPricingRules(productId) {
    if (rulesCache.has(productId)) {
      return rulesCache.get(productId);
    }

    try {
      const response = await fetch(`${API_ENDPOINT}/rules/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_type: 'product',
          target_id: productId,
          quantity: 1
        })
      });

      const data = await response.json();
      const rules = data.success ? data.data : null;
      rulesCache.set(productId, rules);
      return rules;
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      return null;
    }
  }

  function calculatePriceForQuantity(tiers, quantity) {
    if (!tiers || tiers.length === 0) return null;

    const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);

    for (const tier of sortedTiers) {
      if (quantity >= tier.min_quantity) {
        return tier;
      }
    }

    return null;
  }

  function updatePriceDisplay(tier, quantity) {
    const priceElements = document.querySelectorAll('.price__regular .price-item--regular');
    
    if (tier && priceElements.length > 0) {
      const newPrice = tier.price;
      const total = (newPrice * quantity).toFixed(2);
      
      priceElements.forEach(el => {
        const formattedPrice = `$${newPrice.toFixed(2)}`;
        el.textContent = formattedPrice;
      });

      displayTierNotification(tier, quantity, total);
    } else {
      removeTierNotification();
    }
  }

  function displayTierNotification(tier, quantity, total) {
    let notification = document.getElementById('wholesale-tier-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'wholesale-tier-notification';
      notification.style.cssText = `
        background: #e8f5e9;
        border: 1px solid #4caf50;
        border-radius: 4px;
        padding: 12px;
        margin: 12px 0;
        color: #2e7d32;
        font-size: 14px;
      `;
      
      const productForm = document.querySelector('form[action*="/cart/add"]');
      if (productForm) {
        productForm.insertAdjacentElement('afterend', notification);
      }
    }

    notification.innerHTML = `
      <strong>Wholesale Pricing Applied!</strong><br>
      ${quantity} units × $${tier.price.toFixed(2)} = $${total}
      ${tier.rule_name ? `<br><em>${tier.rule_name}</em>` : ''}
    `;
  }

  function removeTierNotification() {
    const notification = document.getElementById('wholesale-tier-notification');
    if (notification) {
      notification.remove();
    }
  }

  function displayTierTable(tiers) {
    if (!tiers || tiers.length === 0) return;

    let table = document.getElementById('wholesale-tiers-table');
    
    if (!table) {
      table = document.createElement('div');
      table.id = 'wholesale-tiers-table';
      table.style.cssText = `
        margin: 16px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      `;
      
      const priceContainer = document.querySelector('.price');
      if (priceContainer) {
        priceContainer.insertAdjacentElement('afterend', table);
      }
    }

    const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);
    
    let html = `
      <div style="background: #f5f5f5; padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #ddd;">
        Wholesale Pricing Tiers
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #fafafa;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Quantity</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Price per Unit</th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedTiers.forEach((tier, index) => {
      const bgColor = index % 2 === 0 ? '#fff' : '#fafafa';
      html += `
        <tr style="background: ${bgColor};">
          <td style="padding: 8px;">${tier.min_quantity}+</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">$${tier.price.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    table.innerHTML = html;
  }

  async function handleQuantityChange() {
    const quantityInput = document.querySelector('input[name="quantity"]');
    if (!quantityInput) return;

    const quantity = parseInt(quantityInput.value) || 1;
    
    if (currentProductId) {
      const rules = await fetchPricingRules(currentProductId);
      
      if (rules && rules.tiers) {
        const tier = calculatePriceForQuantity(rules.tiers, quantity);
        updatePriceDisplay(tier, quantity);
      }
    }
  }

  async function modifyAddToCartForm() {
    const form = document.querySelector('form[action*="/cart/add"]');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      const quantityInput = form.querySelector('input[name="quantity"]');
      const quantity = parseInt(quantityInput?.value) || 1;

      if (currentProductId) {
        const rules = await fetchPricingRules(currentProductId);
        
        if (rules && rules.tiers) {
          const tier = calculatePriceForQuantity(rules.tiers, quantity);
          
          if (tier) {
            let propertiesInput = form.querySelector('input[name="properties[_wholesale_tier]"]');
            
            if (!propertiesInput) {
              propertiesInput = document.createElement('input');
              propertiesInput.type = 'hidden';
              propertiesInput.name = 'properties[_wholesale_tier]';
              form.appendChild(propertiesInput);
            }

            propertiesInput.value = JSON.stringify({
              rule_name: rules.rule_name,
              min_quantity: tier.min_quantity,
              price: tier.price,
              applied_at: new Date().toISOString()
            });
          }
        }
      }
    });
  }

  async function init() {
    const productMeta = document.querySelector('[data-product-id]');
    if (productMeta) {
      currentProductId = productMeta.dataset.productId;
    } else {
      const match = window.location.pathname.match(/\/products\/[^\/]+/);
      if (match) {
        const productHandle = match[0].split('/').pop();
        currentProductId = `gid://shopify/Product/${productHandle}`;
      }
    }

    if (!currentProductId) return;

    const rules = await fetchPricingRules(currentProductId);
    
    if (rules && rules.tiers) {
      displayTierTable(rules.tiers);
      
      const quantityInput = document.querySelector('input[name="quantity"]');
      if (quantityInput) {
        quantityInput.addEventListener('change', handleQuantityChange);
        quantityInput.addEventListener('input', handleQuantityChange);
        
        handleQuantityChange();
      }

      modifyAddToCartForm();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

