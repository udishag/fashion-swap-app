// frontend/src/utils/cities.js

export const GTA_CITIES = {
    'toronto': { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    'mississauga': { name: 'Mississauga', lat: 43.5890, lng: -79.6441 },
    'brampton': { name: 'Brampton', lat: 43.7315, lng: -79.7624 },
    'oakville': { name: 'Oakville', lat: 43.4675, lng: -79.6877 },
    'scarborough': { name: 'Scarborough', lat: 43.7764, lng: -79.2318 },
    'vaughan': { name: 'Vaughan', lat: 43.8563, lng: -79.5085 },
    'markham': { name: 'Markham', lat: 43.8561, lng: -79.3370 },
    'hamilton': { name: 'Hamilton', lat: 43.2557, lng: -79.8711 },
};

export const getCityCoordinates = (cityName) => {
    const key = (cityName || '').toLowerCase().trim();
    return GTA_CITIES[key] || GTA_CITIES['toronto'];
};