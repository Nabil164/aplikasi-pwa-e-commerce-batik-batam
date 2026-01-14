/**
 * Cart calculation utilities
 */

export function calculateCartTotals(cartItems, shippingCost = 0) {
  if (!cartItems || cartItems.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: shippingCost,
      total: shippingCost,
    };
  }

  // Calculate subtotal (sum of all items)
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + itemPrice * quantity;
  }, 0);

  // Calculate discount (if any product has discount)
  const discount = cartItems.reduce((sum, item) => {
    const product = item.product;
    if (product && product.discount) {
      const discountPercent = parseFloat(product.discount) || 0;
      const itemPrice = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (itemPrice * discountPercent / 100) * quantity;
    }
    return sum;
  }, 0);

  // Pajak dijadikan 0
  const tax = 0;

  // Calculate total
  const total = subtotal - discount + tax + shippingCost;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: shippingCost,
    total: Math.round(total * 100) / 100,
  };
}

export function calculateShippingCost(address, weight = 0) {
  // Ongkos kirim dijadikan 0
  return 0;
}

export function filterSelectedItems(cartItems, selectedIds = []) {
  if (!selectedIds || selectedIds.length === 0) {
    return cartItems;
  }
  return cartItems.filter(item => selectedIds.includes(item.id));
}




