import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'], // We don't want Google indexing private admin routes
        },
        sitemap: 'https://kamrans-cloud.vercel.app/sitemap.xml',
    };
}
