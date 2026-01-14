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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET /api/products/[id] - Get product detail
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Product ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: true,
        sizes: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { status: false, message: 'Product not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Add convenience fields for frontend
    const productData = {
      ...product,
      // Add primary image URL for easy access
      image_url: product.images?.[0]?.imageUrl || '/logo_batik.jpg',
      image: product.images?.[0]?.imageUrl || '/logo_batik.jpg',
      // Add size array of strings for easy access
      size: product.sizes?.map(s => s.size) || [],
    };

    return NextResponse.json({
      status: true,
      message: 'Product retrieved successfully',
      data: productData,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[PRODUCT DETAIL] Error:', error);
    console.error('[PRODUCT DETAIL] Error message:', error.message);
    console.error('[PRODUCT DETAIL] Error stack:', error.stack);
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
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Product ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
      stock = formData.get('stock') || null;
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
            console.log('[UPDATE PRODUCT] Parsed sizes from size_json:', sizes);
          } catch (e) {
            console.error('[UPDATE PRODUCT] Error parsing size_json:', e);
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
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Parse sizes if provided
    let sizesArray = [];
    if (sizes) {
      try {
        sizesArray = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      } catch (e) {
        console.error('[UPDATE PRODUCT] Error parsing sizes:', e);
        sizesArray = [];
      }
    }

    // Calculate total stock from sizes if sizes are provided
    let totalStock = stock ? parseInt(stock) : undefined;
    if (sizesArray && Array.isArray(sizesArray) && sizesArray.length > 0) {
      totalStock = sizesArray.reduce((sum, sizeData) => {
        const sizeStock = typeof sizeData === 'object' ? parseInt(sizeData.stock) || 0 : 0;
        return sum + sizeStock;
      }, 0);
    }

    // Handle image upload
    let imageUrl = undefined; // Don't update image if not provided
    if (imageFile && imageFile instanceof File) {
      console.log('[UPDATE PRODUCT] Uploading image:', imageFile.name, imageFile.size, 'bytes');
      const savedImageUrl = await saveUploadedImage(imageFile);
      if (savedImageUrl) {
        imageUrl = savedImageUrl;
        console.log('[UPDATE PRODUCT] Image saved to:', imageUrl);
      } else {
        console.log('[UPDATE PRODUCT] Failed to save image');
      }
    }

    // Update product
    const updateData = {
      name,
      description: description || null,
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : null,
      category,
      subcategory: subcategory || null,
      sku: sku || null,
      weight: weight ? parseFloat(weight) : null,
    };

    // Only update stock if provided
    if (totalStock !== undefined) {
      updateData.stock = totalStock;
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Update product sizes if provided
    if (sizesArray && Array.isArray(sizesArray) && sizesArray.length > 0) {
      // Delete existing sizes
      await prisma.productSize.deleteMany({
        where: { productId: parseInt(id) },
      });

      // Create new sizes
      await prisma.productSize.createMany({
        data: sizesArray.map(sizeData => ({
          productId: parseInt(id),
          size: typeof sizeData === 'object' ? sizeData.size : sizeData,
          stock: typeof sizeData === 'object' ? parseInt(sizeData.stock) || 0 : 0,
        })),
      });
    }

    // Update product image if new image was uploaded
    if (imageUrl) {
      // Check if product has existing primary image
      const existingImage = await prisma.productImage.findFirst({
        where: { productId: parseInt(id), isPrimary: true },
      });

      if (existingImage) {
        // Update existing primary image
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: { imageUrl: imageUrl },
        });
      } else {
        // Create new primary image
        await prisma.productImage.create({
          data: {
            productId: parseInt(id),
            imageUrl: imageUrl,
            altText: name,
            isPrimary: true,
          },
        });
      }
    }

    // Get updated product with relations
    const updatedProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: true,
        sizes: true,
      },
    });

    // Add convenience fields for frontend
    const productData = {
      ...updatedProduct,
      image_url: updatedProduct.images?.[0]?.imageUrl || '/logo_batik.jpg',
      image: updatedProduct.images?.[0]?.imageUrl || '/logo_batik.jpg',
      size: updatedProduct.sizes?.map(s => s.size) || [],
    };

    return NextResponse.json({
      status: true,
      message: 'Product updated successfully',
      data: productData,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[UPDATE PRODUCT] Error:', error);
    console.error('[UPDATE PRODUCT] Error message:', error.message);
    console.error('[UPDATE PRODUCT] Error stack:', error.stack);
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
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Product ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Check if product has any dependencies before deleting
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        orderItems: true,
        cartItems: true,
        wishlistItems: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { status: false, message: 'Product not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Check for dependencies
    const dependencies = [];
    if (product.orderItems && product.orderItems.length > 0) {
      dependencies.push(`${product.orderItems.length} order items`);
    }
    if (product.cartItems && product.cartItems.length > 0) {
      dependencies.push(`${product.cartItems.length} cart items`);
    }
    if (product.wishlistItems && product.wishlistItems.length > 0) {
      dependencies.push(`${product.wishlistItems.length} wishlist items`);
    }

    if (dependencies.length > 0 && !forceDelete) {
      return NextResponse.json({
        status: false,
        message: 'Cannot delete product due to existing dependencies',
        dependencies: dependencies,
        suggestion: 'Please remove product from orders, carts, and wishlists first, or use ?force=true to force delete (this will remove all dependencies).',
      }, {
        status: 409, // Conflict
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // If force delete or no dependencies, clean up dependencies first
    if (dependencies.length > 0 && forceDelete) {
      console.log(`[FORCE DELETE] Cleaning up dependencies for product ${id}:`, dependencies);
      
      // Delete order items first (due to foreign key constraints)
      if (product.orderItems && product.orderItems.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { productId: parseInt(id) },
        });
      }
      
      // Delete cart items
      if (product.cartItems && product.cartItems.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { productId: parseInt(id) },
        });
      }
      
      // Delete wishlist items
      if (product.wishlistItems && product.wishlistItems.length > 0) {
        await prisma.wishlist.deleteMany({
          where: { productId: parseInt(id) },
        });
      }
    }

    // Proceed with deletion (after cleaning up dependencies if force delete)
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    const successMessage = forceDelete 
      ? 'Product and all dependencies deleted successfully'
      : 'Product deleted successfully';

    return NextResponse.json({
      status: true,
      message: successMessage,
      forceDelete: forceDelete || false,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[DELETE PRODUCT] Error:', error);
    console.error('[DELETE PRODUCT] Error message:', error.message);
    console.error('[DELETE PRODUCT] Error stack:', error.stack);
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
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
