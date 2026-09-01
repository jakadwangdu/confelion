const { initDatabase } = require('./backend/db');
initDatabase();
const db = require('./backend/db').getDb();

// Test getting all products
const products = db.prepare('SELECT * FROM products').all();
console.log('Products:', products.length);

// Test getting product by handle
const product = db.prepare('SELECT * FROM products WHERE handle = ?').get('veltora-aurex-formal');
console.log('Product:', product ? product.title : 'Not found');

// Test getting variants
const variants = db.prepare('SELECT * FROM variants WHERE product_id = ?').all(product.id);
console.log('Variants:', variants.length);

// Test getting options
const options = db.prepare('SELECT * FROM options WHERE product_id = ?').all(product.id);
console.log('Options:', options.length);

// Test product images
const productImages = db.prepare('SELECT * FROM product_images WHERE product_id = ?').all(product.id);
console.log('Product Images:', productImages.length);

// Test variant images
const variantImages = db.prepare("SELECT * FROM variant_images WHERE variant_id IN (SELECT id FROM variants WHERE product_id = ?)").all(product.id);
console.log('Variant Images:', variantImages.length);

console.log('\nAll database tests passed!');