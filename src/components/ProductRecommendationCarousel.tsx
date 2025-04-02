'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/app/firebase/firebase'; 
import { doc, getDoc } from 'firebase/firestore';

interface Product {
    id: string;
    name: string;
    category: string;
    starRating?: number; 
    offer?: { discount: number } | 'out of stock' | null;
    price: number;
    scratchedPrice?: number;
    displayImageUrl: string;
}

interface ProductRecommendationCarouselProps {
    componentInstanceId: string;
}

const ProductRecommendationCarousel: React.FC<ProductRecommendationCarouselProps> = ({
    componentInstanceId,
}) => {
    const [productIds, setProductIds] = useState<string[]>([]);
    const [productsData, setProductsData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // For debugging
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        const fetchProductIdsFromCloudFunction = async () => {
            setLoading(true);
            setError(null);

            const recommenderFunctionUrl = process.env.NEXT_PUBLIC_RECOMMENDER_FUNCTION_URL;
            console.log('Recommender function URL:', recommenderFunctionUrl);

            if (!recommenderFunctionUrl) {
                setError('Recommender function URL is not configured. Please check your environment variables.');
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching product IDs from:', recommenderFunctionUrl);
                const response = await fetch(recommenderFunctionUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                setDebugInfo({
                    status: response.status,
                    statusText: response.statusText,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Received product IDs:', data);

                if (Array.isArray(data)) {
                    setProductIds(data.slice(0, 10)); 
                    console.log(`Retrieved ${data.length} product IDs`);
                } else {
                    console.error('Invalid response format: Expected an array of product IDs.', data);
                    setError('Invalid response from recommender function: Expected an array of product IDs.');
                }
            } catch (e: any) {
                console.error('Recommendation fetch error:', e);
                setError(`Failed to fetch product IDs: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchProductIdsFromCloudFunction();
    }, []);

    useEffect(() => {
        const fetchProductDetails = async () => {
            if (productIds.length === 0) {
                return;
            }

            setLoading(true);
            setError(null);
            const fetchedProducts: Product[] = [];

            try {
                console.log(`Fetching details for ${productIds.length} products`);
                const batchSize = 10;
                for (let i = 0; i < productIds.length; i += batchSize) {
                    const batch = productIds.slice(i, i + batchSize);

                    const promises = batch.map(async (id) => {
                        try {
                            const docRef = doc(db, 'products', id);
                            const docSnap = await getDoc(docRef);

                            if (docSnap.exists()) {
                                const productData = docSnap.data() as Omit<Product, 'id'>;
                                console.log(`Data fetched for product ${id}:`, productData); // Debugging log
                                const product: Product = {
                                    id: docSnap.id,
                                    ...productData,
                                    name: productData.name || 'Unnamed Product',
                                    category: productData.category || 'Uncategorized',
                                    starRating: productData.starRating,
                                    price: typeof productData.price === 'number' ? productData.price : 0,
                                    displayImageUrl: productData.displayImageUrl || '/placeholder.jpg',
                                    offer: productData.offer // Ensure offer is also included
                                };
                                fetchedProducts.push(product);
                            } else {
                                console.warn(`Product with ID ${id} not found.`);
                            }
                        } catch (docError) {
                            console.error(`Error fetching product ${id}:`, docError);
                        }
                    });

                    await Promise.all(promises);
                }

                console.log(`Successfully loaded ${fetchedProducts.length} products`);
                setProductsData(fetchedProducts);
            } catch (e: any) {
                console.error('Firestore fetch error:', e);
                setError(`Failed to fetch product details: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productIds]);

    console.log('Product Data in Carousel:', productsData); 

    if (loading && productIds.length > 0) {
        return (
            <div className="carousel-container">
                <h2>Product Details</h2>
                <div className="loading-indicator">Loading product details...</div>
            </div>
        );
    }

    if (loading && productIds.length === 0) {
        return (
            <div className="carousel-container">
                <center><h2>Product Details</h2></center>
                <div className="loading-indicator">Fetching recommendations...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="carousel-container">
                <center><h2>Product Details</h2></center>
                <div className="error-message">
                    <p>Error loading products: {error}</p>
                    {debugInfo && (
                        <details>
                            <summary>Debug Info</summary>
                            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                        </details>
                    )}
                </div>
            </div>
        );
    }

    if (productsData.length === 0 && productIds.length > 0) {
        return (
            <div className="carousel-container">
                <center><h2>Product Details</h2></center>
                <div className="no-products">No product details found for the recommended IDs.</div>
            </div>
        );
    }

    if (productsData.length === 0 && !loading && !error) {
        return (
            <div className="carousel-container">
                <center><h2>Product Details</h2></center>
                <div className="no-products">No products recommended at this time.</div>
            </div>
        );
    }

    return (
        <div className="carousel-container">
                <center><h2>Product Details</h2></center>
                <div className="carousel">
                {productsData.map((product) => (
                    <div key={product.id} className="product-card">
                        <img src={product.displayImageUrl} alt={product.name} />
                        <h3>{product.name}</h3>
                        <p>Category: {product.category}</p>
                        <p>Rating: {typeof product.starRating === 'number' ? `${product.starRating.toFixed(1)}/5` : 'Not rated'}</p>

                        {product.offer === 'out of stock' ? (
                            <p className="out-of-stock">Out of Stock</p>
                        ) : product.offer && typeof product.offer === 'object' && product.offer.discount !== undefined ? (
                            <div className="price-container">
                                {product.scratchedPrice && (
                                    <span className="original-price">${product.scratchedPrice.toFixed(2)}</span>
                                )}
                                <span className="discounted-price">
                                    Rs.{(product.price * (1 - product.offer.discount / 100)).toFixed(2)}
                                </span>
                                <span className="discount-label">({product.offer.discount}% off)</span>
                            </div>
                        ) : (
                            <p className="price">Price: Rs.{product.price.toFixed(2)}</p>
                        )}
                    </div>
                ))}
            </div>
            <style jsx>{`
                .carousel-container {
                    margin: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-color: white;
                }

                h2 {
                    font-size: 1.8em;
                    margin-bottom: 15px;
                    color: #333;
                }

                .carousel {
                    display: flex;
                    overflow-x: auto;
                    gap: 20px;
                    padding: 15px;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                }

                .carousel::-webkit-scrollbar {
                    height: 8px;
                }

                .carousel::-webkit-scrollbar-thumb {
                    background-color: #ccc;
                    border-radius: 4px;
                }

                .product-card {
                    flex: 0 0 auto;
                    width: 220px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    background-color: white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }

                .product-card img {
                    max-width: 100%;
                    height: 150px;
                    object-fit: contain;
                    margin-bottom: 15px;
                    border-radius: 4px;
                }

                .product-card h3 {
                    font-size: 1.1em;
                    margin-bottom: 8px;
                    color: #333;
                    height: 2.4em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .product-card p {
                    font-size: 0.9em;
                    color: #666;
                    margin-bottom: 5px;
                }

                .price-container {
                    margin-top: 10px;
                }

                .original-price {
                    text-decoration: line-through;
                    color: #999;
                    margin-right: 8px;
                    font-size: 0.9em;
                }

                .discounted-price {
                    font-weight: bold;
                    color: #2e7d32;
                    font-size: 1.1em;
                }

                .discount-label {
                    display: inline-block;
                    margin-left: 5px;
                    color: #d32f2f;
                    font-weight: bold;
                    font-size: 0.8em;
                }

                .out-of-stock {
                    color: #d32f2f;
                    font-weight: bold;
                    margin-top: 5px;
                }

                .price {
                    font-weight: bold;
                    color: #333;
                    margin-top: 5px;
                }

                .loading-indicator, .error-message, .no-products {
                    padding: 20px;
                    text-align: center;
                    background-color: #f9f9f9;
                    border-radius: 8px;
                    color: #666;
                }

                .error-message {
                    color: #d32f2f;
                }

                details {
                    margin-top: 15px;
                    text-align: left;
                }

                summary {
                    cursor: pointer;
                    color: #0066cc;
                }

                pre {
                    background-color: #f0f0f0;
                    padding: 10px;
                    border-radius: 4px;
                    overflow: auto;
                    font-size: 0.8em;
                }
            `}</style>
        </div>
    );
};

export default ProductRecommendationCarousel;
