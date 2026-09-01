const {auth,admin}=require('../middleware/auth'),{aiUrl,shopifyLight}=require('../../utils/aiImage')
const multer=require('multer'), sharp=require('sharp'), path=require('path'), fs=require('fs')
const UPLOAD_DIR=path.join(__dirname,'../../uploads')
if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR,{recursive:true})

const upload=multer({
  storage: multer.memoryStorage(),
  limits:{fileSize:5*1024*1024},
  fileFilter:(q,file,cb)=>{
    if(file.mimetype && file.mimetype.startsWith('image/')) cb(null,true)
    else cb(new Error('Only images allowed'),false)
  }
})

async function saveCompressedHeroImage(buffer, originalName){
  const base = path.parse(originalName||'hero').name.replace(/[^a-z0-9_-]/gi,'_') || 'hero'
  const filename = `hero_${base}_${Date.now()}.webp`
  const outPath = path.join(UPLOAD_DIR, filename)
  await sharp(buffer)
    .resize(1920, 1080, {fit: 'inside', withoutEnlargement: true})
    .webp({quality: 82, effort: 4})
    .toFile(outPath)
  const stats = fs.statSync(outPath)
  return {url: `/uploads/${filename}`, size: stats.size}
}

async function saveCompressedProductImage(buffer, originalName, index = 0){
  const base = path.parse(originalName||'prod').name.replace(/[^a-z0-9_-]/gi,'_') || 'prod'
  const filename = `prod_${base}_${Date.now()}_${index}.webp`
  const outPath = path.join(UPLOAD_DIR, filename)
  await sharp(buffer)
    .resize(1000, 1250, {fit: 'cover', withoutEnlargement: true})
    .webp({quality: 78, effort: 4})
    .toFile(outPath)
  const stats = fs.statSync(outPath)
  return {url: `/uploads/${filename}`, size: stats.size}
}

async function saveCompressedSizeChartImage(buffer, originalName){
  const base = path.parse(originalName||'size_chart').name.replace(/[^a-z0-9_-]/gi,'_') || 'size_chart'
  const filename = `size_chart_${base}_${Date.now()}.webp`
  const outPath = path.join(UPLOAD_DIR, filename)
  await sharp(buffer)
    .resize(1400, 1800, {fit: 'inside', withoutEnlargement: true})
    .webp({quality: 82, effort: 4})
    .toFile(outPath)
  const stats = fs.statSync(outPath)
  return {url: `/uploads/${filename}`, size: stats.size}
}

async function saveCompressedImage(buffer, originalName){
  const res = await saveCompressedProductImage(buffer, originalName)
  return res.url
}

function normalizeImageUrl(url){
  if(!url) return url
  if(url.startsWith('/uploads/')) return url
  if(url.startsWith('data:')) return url
  return shopifyLight(url) || url
}

module.exports=db=>{
 const r=require('express').Router()
 r.use(auth,admin)
 
 // Upload Hero image with high-efficiency compression
 r.post('/upload-hero', upload.single('image'), async (q,s)=>{
   try{
     if(!q.file) return s.status(400).json({error:'No image file provided (field: image)'})
     const {url, size: compressedSize} = await saveCompressedHeroImage(q.file.buffer, q.file.originalname)
     db.prepare('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)').run('hero_image', url)
     s.json({
       url,
       success: true,
       compressed: true,
       originalSize: q.file.size,
       compressedSize,
       savingsPercent: Math.round((1 - compressedSize / q.file.size) * 100)
     })
   }catch(e){
     s.status(500).json({error:e.message})
   }
 })

 // Upload Size Chart image with auto-compression
 r.post('/upload-size-chart', upload.single('image'), async (q,s)=>{
   try{
     if(!q.file) return s.status(400).json({error:'No image file provided (field: image)'})
     const {url, size: compressedSize} = await saveCompressedSizeChartImage(q.file.buffer, q.file.originalname)
     db.prepare('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)').run('size_chart_image', url)
     s.json({
       url,
       success: true,
       compressed: true,
       originalSize: q.file.size,
       compressedSize,
       savingsPercent: Math.round((1 - compressedSize / q.file.size) * 100)
     })
   }catch(e){
     s.status(500).json({error:e.message})
   }
 })

 // Upload multiple images with auto compression (up to 10 images)
 r.post('/upload-multiple', upload.array('images', 10), async (q,s)=>{
   try{
     if(!q.files || q.files.length === 0) return s.status(400).json({error:'No image files provided (field: images)'})
     const results = await Promise.all(
       q.files.map((file, idx) => saveCompressedProductImage(file.buffer, file.originalname, idx))
     )
     const images = results.map((res, idx) => ({
       url: res.url,
       originalName: q.files[idx].originalname,
       originalSize: q.files[idx].size,
       compressedSize: res.size,
       savingsPercent: Math.round((1 - res.size / q.files[idx].size) * 100)
     }))
     s.json({
       images,
       urls: results.map(r => r.url),
       success: true,
       count: images.length
     })
   }catch(e){
     s.status(500).json({error:e.message})
   }
 })

 // Upload single product image + auto compress
 r.post('/upload', upload.single('image'), async (q,s)=>{
   try{
     if(!q.file) return s.status(400).json({error:'No image file (field: image)'})
     const {url, size: compressedSize} = await saveCompressedProductImage(q.file.buffer, q.file.originalname)
     s.json({
       url,
       compressed: true,
       originalSize: q.file.size,
       compressedSize,
       savingsPercent: Math.round((1 - compressedSize / q.file.size) * 100)
     })
   }catch(e){
     s.status(500).json({error:e.message})
   }
 })

 // PRODUCTS admin CRUD
 r.get('/products',(q,s)=>{
  try{
    const rows=db.prepare(`
      SELECT p.*,
        (SELECT inventory_quantity FROM variants WHERE product_id=p.id LIMIT 1) as qty,
        (SELECT id FROM variants WHERE product_id=p.id LIMIT 1) as variant_id,
        (SELECT price FROM variants WHERE product_id=p.id LIMIT 1) as price,
        (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY position ASC, id ASC LIMIT 1) as image_url
      FROM products p ORDER BY p.id DESC`).all()

    const enriched = rows.map(p => {
      const productImages = db.prepare('SELECT id, image_url, position FROM product_images WHERE product_id=? ORDER BY position ASC, id ASC').all(p.id)
      const primaryImage = productImages[0]?.image_url || p.image_url
      return {
        ...p,
        image_url: primaryImage,
        images: productImages.map(img => img.image_url),
        productImages,
        ai_image: aiUrl(p.handle, p.title, p.tags),
        light_image: primaryImage ? shopifyLight(primaryImage) : null
      }
    })
    s.json(enriched)
  }catch(e){ s.status(500).json({error:e.message}) }
 })

 r.post('/products', upload.array('images', 10), async (q,s)=>{
  try{
   const {handle,title,vendor,type,tags,price,compare_at_price,qty,size}=q.body
   let image_url=q.body.image_url
   let imagesList = []

   // Parse images if passed as array or JSON string or comma-separated
   if (q.body.images) {
     if (Array.isArray(q.body.images)) {
       imagesList = q.body.images.map(normalizeImageUrl).filter(Boolean)
     } else if (typeof q.body.images === 'string') {
       try {
         const parsed = JSON.parse(q.body.images)
         if (Array.isArray(parsed)) imagesList = parsed.map(normalizeImageUrl).filter(Boolean)
         else imagesList = q.body.images.split(',').map(s=>normalizeImageUrl(s.trim())).filter(Boolean)
       } catch {
         imagesList = q.body.images.split(',').map(s=>normalizeImageUrl(s.trim())).filter(Boolean)
       }
     }
   }

   // Process uploaded files if any
   if (q.files && q.files.length > 0) {
     const uploaded = await Promise.all(
       q.files.map((file, idx) => saveCompressedProductImage(file.buffer, file.originalname, idx))
     )
     const uploadedUrls = uploaded.map(u => u.url)
     imagesList = [...imagesList, ...uploadedUrls]
   }

   // If single image_url provided and not already in list
   if (image_url) {
     const norm = normalizeImageUrl(image_url)
     if (norm && !imagesList.includes(norm)) imagesList.unshift(norm)
   }

   if(!handle||!title) return s.status(400).json({error:'handle+title required'})

   const tx=db.transaction(()=>{
     const p=db.prepare('INSERT INTO products(handle,title,vendor,type,tags,published) VALUES(?,?,?,?,?,1)').run(handle,title,vendor||'CONFELION',type||'clothes',tags||'')
     const pid=p.lastInsertRowid
     const sizes=(size||'M').split(',').map(v=>v.trim()).filter(Boolean)
     const toInsert=sizes.length?sizes:['M']
     toInsert.forEach(sz=>db.prepare('INSERT INTO options(product_id,name,value) VALUES(?,?,?)').run(pid,'Size',sz))
     db.prepare('INSERT INTO variants(product_id,sku,price,compare_at_price,inventory_quantity,status) VALUES(?,?,?,?,?,?)').run(pid,handle+'-'+toInsert[0],+price||999,+compare_at_price||null,+qty||10,'active')
     
     const finalImages = imagesList.length > 0 ? imagesList : [aiUrl(handle,title,tags)]
     finalImages.forEach((imgUrl, idx) => {
       db.prepare('INSERT INTO product_images(product_id,image_url,position) VALUES(?,?,?)').run(pid, imgUrl, idx + 1)
     })
     return pid
   })
   const pid=tx()
   s.json({id:pid, handle, images: imagesList, image_url: imagesList[0] || aiUrl(handle,title,tags)})
  }catch(e){
   if(e.code==='SQLITE_CONSTRAINT_UNIQUE' || (e.message && e.message.includes('UNIQUE'))) return s.status(409).json({error:'Handle already exists'})
   s.status(500).json({error:e.message})
  }
 })

 r.put('/products/:handle', upload.array('images', 10), async (q,s)=>{
  try{
   const p=db.prepare('SELECT id FROM products WHERE handle=?').get(q.params.handle)
   if(!p) return s.status(404).json({error:'Not found'})
   let {title,vendor,type,tags,price,qty,size,image_url,compare_at_price}=q.body
   
   let imagesList = null
   if (q.body.images !== undefined) {
     if (Array.isArray(q.body.images)) {
       imagesList = q.body.images.map(normalizeImageUrl).filter(Boolean)
     } else if (typeof q.body.images === 'string') {
       try {
         const parsed = JSON.parse(q.body.images)
         if (Array.isArray(parsed)) imagesList = parsed.map(normalizeImageUrl).filter(Boolean)
         else imagesList = q.body.images.split(',').map(s=>normalizeImageUrl(s.trim())).filter(Boolean)
       } catch {
         imagesList = q.body.images.split(',').map(s=>normalizeImageUrl(s.trim())).filter(Boolean)
       }
     }
   }

   // Process uploaded files if any
   if (q.files && q.files.length > 0) {
     const uploaded = await Promise.all(
       q.files.map((file, idx) => saveCompressedProductImage(file.buffer, file.originalname, idx))
     )
     const uploadedUrls = uploaded.map(u => u.url)
     imagesList = imagesList ? [...imagesList, ...uploadedUrls] : uploadedUrls
   }

   if (image_url && !imagesList) {
     imagesList = [normalizeImageUrl(image_url)]
   }

   const tx=db.transaction(()=>{
     if(title||vendor||type||tags){
       const cur=db.prepare('SELECT title,vendor,type,tags FROM products WHERE id=?').get(p.id)
       db.prepare('UPDATE products SET title=?,vendor=?,type=?,tags=? WHERE id=?').run(title||cur.title, vendor||cur.vendor, type||cur.type, tags!=null?tags:cur.tags, p.id)
     }
     if(price!=null || qty!=null || compare_at_price!=null){
       db.prepare('UPDATE variants SET price=COALESCE(?,price), compare_at_price=COALESCE(?,compare_at_price), inventory_quantity=COALESCE(?,inventory_quantity) WHERE product_id=?').run(price!=null && price!=='' ? +price : null, compare_at_price!=null && compare_at_price!=='' ? +compare_at_price : null, qty!=null && qty!=='' ? +qty : null, p.id)
     }
     if(size){
       db.prepare('DELETE FROM options WHERE product_id=? AND name=?').run(p.id,'Size')
       size.split(',').forEach(v=>{ const t=v.trim(); if(t) db.prepare('INSERT INTO options(product_id,name,value) VALUES(?,?,?)').run(p.id,'Size',t)})
     }
     if(imagesList && Array.isArray(imagesList)){
       db.prepare('DELETE FROM product_images WHERE product_id=?').run(p.id)
       imagesList.forEach((imgUrl, idx) => {
         db.prepare('INSERT INTO product_images(product_id,image_url,position) VALUES(?,?,?)').run(p.id, imgUrl, idx + 1)
       })
     }
   })
   tx()
   const updatedImages = db.prepare('SELECT id, image_url, position FROM product_images WHERE product_id=? ORDER BY position ASC').all(p.id)
   s.json({success:true, image_url: updatedImages[0]?.image_url, images: updatedImages.map(i=>i.image_url), productImages: updatedImages})
  }catch(e){ s.status(500).json({error:e.message}) }
 })

 // Add image(s) to existing product
 r.post('/products/:handle/images', upload.array('images', 10), async (q,s)=>{
   try{
     const p=db.prepare('SELECT id FROM products WHERE handle=?').get(q.params.handle)
     if(!p) return s.status(404).json({error:'Product not found'})
     
     let newUrls = []
     if (q.files && q.files.length > 0) {
       const uploaded = await Promise.all(
         q.files.map((file, idx) => saveCompressedProductImage(file.buffer, file.originalname, idx))
       )
       newUrls = uploaded.map(u => u.url)
     } else if (q.body.image_url) {
       newUrls = [normalizeImageUrl(q.body.image_url)]
     } else if (q.body.images) {
       const raw = Array.isArray(q.body.images) ? q.body.images : [q.body.images]
       newUrls = raw.map(normalizeImageUrl).filter(Boolean)
     }

     if (newUrls.length === 0) return s.status(400).json({error:'No images provided'})

     const maxPosRow = db.prepare('SELECT COALESCE(MAX(position), 0) as maxPos FROM product_images WHERE product_id=?').get(p.id)
     let nextPos = (maxPosRow?.maxPos || 0) + 1

     const tx = db.transaction(()=>{
       newUrls.forEach(url => {
         db.prepare('INSERT INTO product_images(product_id,image_url,position) VALUES(?,?,?)').run(p.id, url, nextPos++)
       })
     })
     tx()

     const allImages = db.prepare('SELECT id, image_url, position FROM product_images WHERE product_id=? ORDER BY position ASC, id ASC').all(p.id)
     s.json({success: true, images: allImages.map(i=>i.image_url), productImages: allImages})
   }catch(e){ s.status(500).json({error:e.message}) }
 })

 // Delete specific image from product
 r.delete('/products/:handle/images/:imageId', (q,s)=>{
   try{
     const p=db.prepare('SELECT id FROM products WHERE handle=?').get(q.params.handle)
     if(!p) return s.status(404).json({error:'Product not found'})
     db.prepare('DELETE FROM product_images WHERE id=? AND product_id=?').run(q.params.imageId, p.id)
     const remaining = db.prepare('SELECT id, image_url, position FROM product_images WHERE product_id=? ORDER BY position ASC, id ASC').all(p.id)
     s.json({success:true, images: remaining.map(i=>i.image_url), productImages: remaining})
   }catch(e){ s.status(500).json({error:e.message}) }
 })

 r.delete('/images/:id', (q,s)=>{
   try{
     db.prepare('DELETE FROM product_images WHERE id=?').run(q.params.id)
     s.json({success:true})
   }catch(e){ s.status(500).json({error:e.message}) }
 })

  // ORDERS - admin can view all orders
  r.get('/orders',(q,s)=>{
    try{
      const orders = db.prepare(`
        SELECT o.*, u.name as user_name, u.email as user_email,
          (SELECT COUNT(*) FROM order_items WHERE order_id=o.id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `).all()
      
      // Get items for each order
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: db.prepare(`
          SELECT oi.*, p.title as product_title, p.handle as product_handle, v.sku
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN variants v ON oi.variant_id = v.id
          WHERE oi.order_id = ?
        `).all(order.id)
      }))
      
      s.json(ordersWithItems)
    }catch(e){ s.status(500).json({error:e.message}) }
  })

  // Get single order details
  r.get('/orders/:id',(q,s)=>{
    try{
      const order = db.prepare(`
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `).get(q.params.id)
      
      if(!order) return s.status(404).json({error:'Order not found'})
      
      order.items = db.prepare(`
        SELECT oi.*, p.title as product_title, p.handle as product_handle, p.image_url as product_image, v.sku
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN variants v ON oi.variant_id = v.id
        WHERE oi.order_id = ?
      `).all(order.id)
      
      s.json(order)
    }catch(e){ s.status(500).json({error:e.message}) }
  })

  // REVENUE / ANALYTICS
  r.get('/revenue',(q,s)=>{
    try{
      const {period='all'} = q.query
      
      let dateFilter = ''
      const now = new Date()
      if(period === 'today'){
        dateFilter = `AND date(o.created_at) = date('now')`
      } else if(period === 'week'){
        dateFilter = `AND o.created_at >= date('now', '-7 days')`
      } else if(period === 'month'){
        dateFilter = `AND o.created_at >= date('now', '-1 month')`
      } else if(period === 'year'){
        dateFilter = `AND o.created_at >= date('now', '-1 year')`
      }
      
      // Total revenue
      const totalRevenue = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as order_count
        FROM orders o
        WHERE status = 'paid' ${dateFilter}
      `).get()
      
      // Revenue by period (daily for week/month, monthly for year)
      let groupBy = ''
      let dateFormat = ''
      if(period === 'today'){
        groupBy = "strftime('%H', o.created_at)"
        dateFormat = "strftime('%H:00', o.created_at)"
      } else if(period === 'week'){
        groupBy = "date(o.created_at)"
        dateFormat = "date(o.created_at)"
      } else if(period === 'month'){
        groupBy = "date(o.created_at)"
        dateFormat = "date(o.created_at)"
      } else if(period === 'year'){
        groupBy = "strftime('%Y-%m', o.created_at)"
        dateFormat = "strftime('%Y-%m', o.created_at)"
      } else {
        groupBy = "strftime('%Y-%m', o.created_at)"
        dateFormat = "strftime('%Y-%m', o.created_at)"
      }
      
      const revenueByPeriod = db.prepare(`
        SELECT ${dateFormat} as period, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
        FROM orders o
        WHERE status = 'paid' ${dateFilter}
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `).all()
      
      // Top selling products
      const topProducts = db.prepare(`
        SELECT p.title, p.handle, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'paid' ${dateFilter}
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 10
      `).all()
      
      // Recent orders
      const recentOrders = db.prepare(`
        SELECT o.id, o.total, o.created_at, u.name as customer_name, u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.status = 'paid'
        ORDER BY o.created_at DESC
        LIMIT 10
      `).all()
      
      s.json({
        summary: totalRevenue,
        revenueByPeriod,
        topProducts,
        recentOrders,
        period
      })
    }catch(e){ s.status(500).json({error:e.message}) }
  })

  // USERS with order count
  r.get('/users',(q,s)=>{
    try{
      const users = db.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.created_at,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
          (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id AND status = 'paid') as total_spent
        FROM users u
        ORDER BY u.id DESC
      `).all()
      s.json(users)
    }catch(e){ s.status(500).json({error:e.message}) }
  })

  // SETTINGS - Get all settings (public)
  r.get('/settings', (q,s)=>{
    try{
      const rows = db.prepare('SELECT key, value FROM settings').all()
      const settings = {}
      rows.forEach(r => settings[r.key] = r.value)
      s.json(settings)
    }catch(e){ s.status(500).json({error:e.message}) }
  })

  // SETTINGS - Update setting (admin only)
  r.put('/settings/:key', (q,s)=>{
    try{
      const {key} = q.params
      const {value} = q.body
      if(value === undefined) return s.status(400).json({error:'value required'})
      db.prepare('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)').run(key, value)
      s.json({success:true, key, value})
    }catch(e){ s.status(500).json({error:e.message}) }
  })

  // SETTINGS - Bulk update (admin only)
  r.put('/settings', (q,s)=>{
    try{
      const {settings} = q.body
      if(!settings || typeof settings !== 'object') return s.status(400).json({error:'settings object required'})
      const tx = db.transaction(()=>{
        for(const [key, value] of Object.entries(settings)){
          db.prepare('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)').run(key, value)
        }
      })
      tx()
      s.json({success:true})
    }catch(e){ s.status(500).json({error:e.message}) }
  })

  return r
}
