// 1. SKIRT ONE ASSETS: Ruched soft chiffon
import chiffmodel from './assets/chiffmodel.png';
import chiffskirt from './assets/chiffskirt.jpg';

// 2. SKIRT TWO ASSETS: Pinstripe tailored micro
import minimodel from './assets/minimodel.jpg';
import miniskirt from './assets/miniskirt.jpg';

// 3. SKIRT THREE ASSETS: Asymmetrical plaid maxi
import pinkstripemodel from './assets/pinkstripemodel.jpg';
import pinkstripestyled from './assets/pinkstripestyled.jpg';

// 4. YELLOW DRESS ASSETS: Checked straight from your sidebar
import yellowdress from './assets/yellowdressmodel.jpg';
import yellowdressstyle from './assets/yellodressstyle.jpg';

// 5. WHITE BANDO ASSETS: Checked straight from your sidebar
import whitebando from './assets/whitebandomodel.jpg';
import whitebandostyle from './assets/whitebando.jpg';

//6 white cream
import whitecreammodel from './assets/whitcreamblouse.jpg'
import whitecreamweb from './assets/whitecreamblouseoutfit.jpg'

export const initialMockProducts = [
    {
        id: 'mock-1',
        title: "ruched soft chiffon mini",
        brand: "zara",
        credits: 0.0,
        clothImage: chiffmodel,
        styledImage: chiffskirt
    },
    {
        id: 'mock-2',
        title: "pinstripe tailored micro",
        brand: "aritzia",
        credits: 0.0,
        clothImage: minimodel,
        styledImage: miniskirt
    },
    {
        id: 'mock-3',
        title: "asymmetrical plaid maxi",
        brand: "brandy melville",
        credits: 0.0,
        clothImage: pinkstripestyled,
        styledImage: pinkstripemodel
    },
    {
        id: 'mock-4',
        title: "minimalist linen curation midi",
        brand: "uniqlo",
        credits: 0.0,
        clothImage: yellowdressstyle,
        styledImage: yellowdress
    },
    {
        id: 'mock-5',
        title: "white bando top",
        brand: "uniqlo",
        credits: 0.0,
        clothImage: whitebando,
        styledImage: whitebandostyle
    },

    {
        id: 'mock-6', // Make sure to give it a unique id string
        title: "cream blouse",
        brand: "free people",
        credits: 0.0,
        clothImage: whitecreammodel,
        styledImage: whitecreamweb
    }
];