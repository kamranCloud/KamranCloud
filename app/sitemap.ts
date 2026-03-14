import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    // Base URLs for the Kamran Cloud website
    return [
        {
            url: 'https://kamrans-cloud.vercel.app',
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: 'https://kamrans-cloud.vercel.app/courses',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: 'https://kamrans-cloud.vercel.app/login',
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: 'https://kamrans-cloud.vercel.app/signup',
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
    ];
}
