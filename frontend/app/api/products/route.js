import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Helper function to save uploaded image
async function saveUploadedImage(file) {
  if (!file || !(file instanceof File)) {
    return null;
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const extension = path.extname(originalName) || '.jpg';
    const filename = `product_${timestamp}_${randomString}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the URL path (relative to public folder)
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error('[SAVE IMAGE] Error saving image:', error);
    return null;
  }
}

function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET /api/products - Get all products with filter & search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('[PRODUCTS API] Request params:', { category, search, page, limit });

    let where = {};

    if (category) {
      where.category = category;
      console.log('[PRODUCTS API] Filtering by category:', category);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    // Try to get products, handle missing columns gracefully
    let products;
    let total;
    try {
      console.log('[PRODUCTS API] Query where clause:', where);
      products = await prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true } },
          sizes: { select: { id: true, size: true, stock: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      
      console.log('[PRODUCTS API] Found products:', products.length, 'products');
      
      total = await prisma.product.count({ where });
    } catch (error) {
      // If error is about missing column, provide helpful message
      if (error.message?.includes('does not exist') || 
          error.message?.includes('column') ||
          error.message?.includes('Product.') ||
          error.message?.includes('Product.slug') ||
          error.message?.includes('Product.stock')) {
        console.error('[PRODUCTS] Database schema mismatch:', error.message);
        
        // Extract missing column name from error
        const columnMatch = error.message.match(/Product\.(\w+)/);
        const missingColumn = columnMatch ? columnMatch[1] : 'unknown';
        
        return NextResponse.json({
          status: false,
          message: `Database schema tidak sesuai. Kolom '${missingColumn}' belum ada di database.`,
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          hint: `Jalankan: node scripts/run-migration.js (atau lihat MIGRATION_INSTRUCTIONS.md)`,
          migrationScript: 'frontend/scripts/run-migration.js',
          sqlScript: 'frontend/scripts/fix-product-only.sql',
          migrationGuide: 'Lihat frontend/MIGRATION_INSTRUCTIONS.md untuk instruksi lengkap',
        }, {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      throw error; // Re-throw if it's a different error
    }

    // Add convenience fields for frontend
    const productsWithUrls = products.map(product => ({
      ...product,
      // Add primary image URL for easy access
      image_url: product.images?.[0]?.imageUrl || '/logo_batik.jpg',
      image: product.images?.[0]?.imageUrl || '/logo_batik.jpg',
      // Add size array of strings for easy access
      size: product.sizes?.map(s => s.size) || [],
    }));

    return NextResponse.json({
      status: true,
      message: 'Products retrieved successfully',
      data: productsWithUrls,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[PRODUCTS] Error:', error);
    console.error('[PRODUCTS] Error message:', error.message);
    console.error('[PRODUCTS] Error stack:', error.stack);
    return NextResponse.json(
      { 
        status: false, 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// POST /api/products - Create product (admin only)
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ status: false, message: 'Invalid token' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { status: false, message: 'Unauthorized - Admin access required' },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    let name, description, price, category, subcategory, stock, sku, weight, discount, sizes, imageFile;

    if (contentType.includes('multipart/form-data')) {
      // Parse FormData
      const formData = await request.formData();
      
      name = formData.get('name');
      category = formData.get('category');
      price = formData.get('price');
      description = formData.get('description') || '';
      subcategory = formData.get('subcategory') || null;
      stock = formData.get('stock') || '0';
      sku = formData.get('sku') || null;
      weight = formData.get('weight') || null;
      discount = formData.get('discount') || null;
      sizes = formData.get('sizes'); // JSON string
      imageFile = formData.get('image'); // File object
      
      // Also check for alternative size fields from admin form
      // The admin form sends size_json and size_stocks_json
      if (!sizes) {
        const sizeJson = formData.get('size_json');
        const sizeStocksJson = formData.get('size_stocks_json');
        
        if (sizeJson && sizeStocksJson) {
          try {
            const sizeArray = JSON.parse(sizeJson);
            const stocksMap = JSON.parse(sizeStocksJson);
            
            // Convert to sizes array format expected by API
            sizes = JSON.stringify(
              sizeArray.map(size => ({
                size: size,
                stock: parseInt(stocksMap[size]) || 0
              }))
            );
            console.log('[CREATE PRODUCT] Parsed sizes from size_json:', sizes);
          } catch (e) {
            console.error('[CREATE PRODUCT] Error parsing size_json:', e);
          }
        }
      }
    } else {
      // Parse JSON (for backward compatibility)
      const body = await request.json();
      name = body.name;
      description = body.description;
      price = body.price;
      discount = body.discount;
      category = body.category;
      subcategory = body.subcategory;
      stock = body.stock;
      sku = body.sku;
      weight = body.weight;
      sizes = body.sizes ? JSON.stringify(body.sizes) : null;
    }

    if (!name || !price || !category) {
      return NextResponse.json(
        { status: false, message: 'Name, price, and category are required' },
        { 
          status: 422,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    let slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Ensure slug is unique
    let slugCounter = 1;
    let finalSlug = slug;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }
    slug = finalSlug;

    // Parse sizes if provided
    let sizesArray = [];
    if (sizes) {
      try {
        sizesArray = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      } catch (e) {
        console.error('[CREATE PRODUCT] Error parsing sizes:', e);
        sizesArray = [];
      }
    }

    // Calculate total stock from sizes if sizes are provided
    let totalStock = parseInt(stock) || 0;
    if (sizesArray && Array.isArray(sizesArray) && sizesArray.length > 0) {
      totalStock = sizesArray.reduce((sum, sizeData) => {
        const sizeStock = typeof sizeData === 'object' ? parseInt(sizeData.stock) || 0 : 0;
        return sum + sizeStock;
      }, 0);
    }

    // Handle image upload
    let imageUrl = '/logo_batik.jpg'; // Default placeholder
    if (imageFile && imageFile instanceof File) {
      console.log('[CREATE PRODUCT] Uploading image:', imageFile.name, imageFile.size, 'bytes');
      const savedImageUrl = await saveUploadedImage(imageFile);
      if (savedImageUrl) {
        imageUrl = savedImageUrl;
        console.log('[CREATE PRODUCT] Image saved to:', imageUrl);
      } else {
        console.log('[CREATE PRODUCT] Failed to save image, using default');
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        discount: discount ? parseFloat(discount) : null,
        category,
        subcategory: subcategory || null,
        stock: totalStock,
        sku: sku || null,
        weight: weight ? parseFloat(weight) : null,
      },
    });

    // Create product sizes
    if (sizesArray && Array.isArray(sizesArray) && sizesArray.length > 0) {
      for (const sizeData of sizesArray) {
        await prisma.productSize.create({
          data: {
            productId: product.id,
            size: sizeData.size || sizeData,
            stock: typeof sizeData === 'object' ? parseInt(sizeData.stock) || 0 : 0,
          },
        });
      }
    }

    // Create product image
    if (imageUrl) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: imageUrl,
          altText: name,
          isPrimary: true,
        },
      });
    }

    // Fetch created product with relations
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        sizes: true,
      },
    });

    // Add convenience fields for frontend
    const productData = {
      ...createdProduct,
      image_url: createdProduct.images?.[0]?.imageUrl || '/logo_batik.jpg',
      image: createdProduct.images?.[0]?.imageUrl || '/logo_batik.jpg',
      size: createdProduct.sizes?.map(s => s.size) || [],
    };

    return NextResponse.json(
      { status: true, message: 'Product created successfully', data: productData },
      { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('[CREATE PRODUCT] Error:', error);
    console.error('[CREATE PRODUCT] Error message:', error.message);
    console.error('[CREATE PRODUCT] Error stack:', error.stack);
    return NextResponse.json(
      { 
        status: false, 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
