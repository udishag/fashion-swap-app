// frontend/src/mockProducts.js
//
// CHANGE FROM YOUR VERSION: added a `style` field to each item, chosen
// from your 6 signup tags (90s archival, clean girl, coquette, minimalist,
// streetwear, vintage). I picked these based on each item's title/vibe —
// double check they actually match the photos and adjust if needed, since
// I can't see the actual images.

import chiffmodel from './assets/chiffmodel.png';
import chiffskirt from './assets/chiffskirt.jpg';
import minimodel from './assets/minimodel.jpg';
import miniskirt from './assets/miniskirt.jpg';
import pinkstripemodel from './assets/pinkstripemodel.jpg';
import pinkstripestyled from './assets/pinkstripestyled.jpg';
import yellowdress from './assets/yellowdressmodel.jpg';
import yellowdressstyle from './assets/yellodressstyle.jpg';
import whitebando from './assets/whitebandomodel.jpg';
import whitebandostyle from './assets/whitebando.jpg';
import whitecreammodel from './assets/whitcreamblouse.jpg';
import whitecreamweb from './assets/whitecreamblouseoutfit.jpg';

export const initialMockProducts = [
    {
        id: 'mock-1',
        title: "ruched soft chiffon mini",
        brand: "zara",
        credits: 0.0,
        clothImage: chiffmodel,
        styledImage: chiffskirt,
        is_mock: true,
        style: "coquette",
    },
    {
        id: 'mock-2',
        title: "pinstripe tailored micro",
        brand: "aritzia",
        credits: 0.0,
        clothImage: minimodel,
        styledImage: miniskirt,
        is_mock: true,
        style: "90s archival",
    },
    {
        id: 'mock-3',
        title: "asymmetrical plaid maxi",
        brand: "brandy melville",
        credits: 0.0,
        clothImage: pinkstripestyled,
        styledImage: pinkstripemodel,
        is_mock: true,
        style: "vintage",
    },
    {
        id: 'mock-4',
        title: "minimalist linen curation midi",
        brand: "uniqlo",
        credits: 0.0,
        clothImage: yellowdressstyle,
        styledImage: yellowdress,
        is_mock: true,
        style: "minimalist",
    },
    {
        id: 'mock-5',
        title: "white bando top",
        brand: "uniqlo",
        credits: 0.0,
        clothImage: whitebando,
        styledImage: whitebandostyle,
        is_mock: true,
        style: "clean girl",
    },
    {
        id: 'mock-6',
        title: "cream blouse",
        brand: "free people",
        credits: 0.0,
        clothImage: whitecreammodel,
        styledImage: whitecreamweb,
        is_mock: true,
        style: "clean girl",
    }
];