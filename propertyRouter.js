const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require('multer');

// Redis setup
const { Redis } = require('@upstash/redis');

const redisclient = new Redis({
  url: 'https://definite-ocelot-48067.upstash.io',
  token: 'AbvDAAIncDEwMTgwYzIwZDk0N2Q0MDM1OWZmN2JiYTc2ODYyMTI2YXAxNDgwNjc',
})


// Import your models
const House = require('./houseSchema');
const Land = require('./landSchema');
const WishlistHouse = require('./wishlistHouseSchema');
const WishlistLand = require('./wishlistLandSchema');

/**
 * @swagger
 * /image/{filename}:
 *   get:
 *     summary: Get image by filename
 *     description: Retrieve the image by its filename.
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         description: The filename of the image.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The image content
 *       500:
 *         description: Internal server error
 */

router.get('/image/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, filename);
    res.sendFile(imagePath);
});

/**
 * @swagger
 * /houses:
 *   get:
 *     summary: Get all houses
 *     description: Retrieve a list of all houses.
 *     responses:
 *       200:
 *         description: A list of houses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/House'
 *       500:
 *         description: Internal server error
 * 
 *   post:
 *     summary: Create a new house
 *     description: Create a new house with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *               bedrooms:
 *                 type: number
 *               bathrooms:
 *                 type: number
 *               squareFootage:
 *                 type: number
 *               yearBuilt:
 *                 type: number
 *               description:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - userId
 *               - title
 *               - location
 *               - price
 *               - bedrooms
 *               - bathrooms
 *               - squareFootage
 *               - yearBuilt
 *               - description
 *               - contactInfo
 *               - images
 *     responses:
 *       201:
 *         description: House posted successfully
 *       500:
 *         description: Internal Server Error
 */

router.get("/houses", async (req, res) => {
    try {
        const cacheKey = 'all-houses';
        const cachedData = await redisclient.get(cacheKey);
            if (cachedData) {
                console.log('Retrieving houses from cache');
                res.send(cachedData);
            } else {
                console.log('Fetching houses from database');
                const houses = await House.find();
                await redisclient.set(cacheKey, JSON.stringify(houses));
                res.status(200).json(houses);
            }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post('/houses', upload.array('images', 10), async (req, res) => {
    try {
        const {
            userId,
            title,
            location,
            price,
            bedrooms,
            bathrooms,
            squareFootage,
            yearBuilt,
            description,
            contactInfo
        } = req.body;

        const images = req.files.map(file => file.path);

        const newHouse = new House({
            userId,
            title,
            location,
            price,
            bedrooms,
            bathrooms,
            squareFootage,
            yearBuilt,
            description,
            contactInfo,
            images
        });
      
        await newHouse.save();

        // Clear cache for houses since data is updated
        const cacheKey = 'all-houses';
        await redisclient.del(cacheKey);

        res.status(201).json({ message: 'House posted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @swagger
 * /lands:
 *   get:
 *     summary: Get all lands
 *     description: Retrieve a list of all lands.
 *     responses:
 *       200:
 *         description: A list of lands
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Land'
 *       500:
 *         description: Internal server error
 * 
 *   post:
 *     summary: Create a new land
 *     description: Create a new land with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *               area:
 *                 type: number
 *               description:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - userId
 *               - title
 *               - location
 *               - price
 *               - area
 *               - description
 *               - contactInfo
 *               - images
 *     responses:
 *       201:
 *         description: Land posted successfully
 *       500:
 *         description: Internal Server Error
 */

router.get("/lands", async (req, res) => {
    try {
        const cacheKey = 'all-lands';
        const cachedData = await redisclient.get(cacheKey);
        
            if (cachedData) {
                console.log('Retrieving lands from cache');
                res.send(cachedData);
            } else {
                console.log('Fetching lands from database');
                const lands = await Land.find();
                await redisclient.set(cacheKey, JSON.stringify(lands));
                res.status(200).json(lands);
            }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/lands', upload.array('images', 10), async (req, res) => {
    try {
        const {
            userId,
            title,
            location,
            price,
            area,
            description,
            contactInfo
        } = req.body;

        const images = req.files.map(file => file.path);

        const newLand = new Land({
            userId,
            title,
            location,
            price,
            area,
            description,
            contactInfo,
            images
        });

        await newLand.save();

        // Clear cache for lands since data is updated
        const cacheKey = 'all-lands';
        await redisclient.del(cacheKey);
        res.status(201).json({ message: 'Land posted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @swagger
 * /deleteHouse/{id}:
 *   post:
 *     summary: Delete a house
 *     description: Delete a house based on its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the house to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House deleted successfully
 *       500:
 *         description: Internal Server Error
 */

router.post('/deleteHouse/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
        await House.findByIdAndDelete(id);
        
        // Clear cache for houses since data is updated
        const cacheKey = 'all-houses';
        await redisclient.del(cacheKey);
        res.status(200).json({ message: 'House deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @swagger
 * /deleteLand/{id}:
 *   post:
 *     summary: Delete a land
 *     description: Delete a land based on its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the land to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Land deleted successfully
 *       500:
 *         description: Internal Server Error
 */

router.post('/deleteLand/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await Land.findByIdAndDelete(id);
        
        // Clear cache for lands since data is updated
        const cacheKey = 'all-lands';
        await redisclient.del(cacheKey);

        res.status(200).json({ message: 'Land deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
/**
 * @swagger
 * /wishlistHouse:
 *   post:
 *     summary: Add house to wishlist
 *     description: Add a house to the user's wishlist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               houseId:
 *                 type: string
 *             required:
 *               - userId
 *               - houseId
 *     responses:
 *       201:
 *         description: WishlistHouse created successfully
 *       500:
 *         description: Internal Server Error
 */

router.post('/wishlistHouse', async (req, res) => {
    try {
        const { userId, houseId } = req.body;
        const wishlistHouse = new WishlistHouse({ userId, houseId });
        await wishlistHouse.save();
        
        // Clear cache for wishlist houses since the data is updated
        const cacheKey = 'wishlist-houses';
        await redisclient.del(cacheKey);
        
        res.status(201).json({ message: 'WishlistHouse created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * @swagger
 * /wishlistHouses:
 *   get:
 *     summary: Get all wishlist houses
 *     description: Retrieve a list of all houses in the wishlist.
 *     responses:
 *       200:
 *         description: A list of houses in the wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistHouse'
 *       500:
 *         description: Internal server error
 */

router.get('/wishlistHouses', async (req, res) => {
    try {
        const cacheKey = 'wishlist-houses';
        
        const cachedData = await redisclient.get(cacheKey);

            if (cachedData) {
                console.log('Retrieving wishlist houses from cache');
                res.send(cachedData);
            } else {
                console.log('Fetching wishlist houses from database');
                const houses = await WishlistHouse.find();
                await redisclient.set(cacheKey, JSON.stringify(houses));
                res.status(200).json(houses);
            }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * @swagger
 * /wishlistLand:
 *   post:
 *     summary: Add land to wishlist
 *     description: Add a land to the user's wishlist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               landId:
 *                 type: string
 *             required:
 *               - userId
 *               - landId
 *     responses:
 *       201:
 *         description: WishlistLand created successfully
 *       500:
 *         description: Internal Server Error
 */

router.post('/wishlistLand', async (req, res) => {
    try {
        const { userId, landId } = req.body;
        const wishlistLand = new WishlistLand({ userId, landId });
        await wishlistLand.save();
        
        // Clear cache for wishlist lands since the data is updated
        const cacheKey = 'wishlist-lands';
        await redisclient.del(cacheKey);
        
        res.status(201).json({ message: 'WishlistLand created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * @swagger
 * /wishlistLands:
 *   get:
 *     summary: Get all wishlist lands
 *     description: Retrieve a list of all lands in the wishlist.
 *     responses:
 *       200:
 *         description: A list of lands in the wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistLand'
 *       500:
 *         description: Internal server error
 */

router.get('/wishlistLands', async (req, res) => {
    try {
        const cacheKey = 'wishlist-lands';
        
        const cachedData = await redisclient.get(cacheKey);

            if (cachedData) {
                console.log('Retrieving wishlist lands from cache');
                res.send(cachedData);
            } else {
                console.log('Fetching wishlist lands from database');
                const lands = await WishlistLand.find();
                await redisclient.set(cacheKey, JSON.stringify(lands));
                res.status(200).json(lands);
            }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
