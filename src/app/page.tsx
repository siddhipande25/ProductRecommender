'use client';

import ProductRecommendationCarousel from '@/components/ProductRecommendationCarousel';
import React from 'react';

export default function Home() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <ProductRecommendationCarousel componentInstanceId="homepage-products" />
        </div>
    );
}
