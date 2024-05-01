const express = require("express");
const router = express.Router();

const User = require('./userSchema');

const  {Redis} = require('@upstash/redis')
const UPSTASH_REDIS_URL="https://definite-ocelot-48067.upstash.io"
const UPSTASH_REDIS_TOKEN="AbvDAAIncDEwMTgwYzIwZDk0N2Q0MDM1OWZmN2JiYTc2ODYyMTI2YXAxNDgwNjc"

const redisclient = new Redis({
    url: UPSTASH_REDIS_URL,
    token: UPSTASH_REDIS_TOKEN,
})

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users.
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 */

router.get("/users", async (req, res) => {
    try {
        const cacheKey = 'all-users';
        const cachedData = await redisclient.get(cacheKey);
        if (cachedData) {
            console.log('Retrieving users from cache');
            res.send(cachedData); // Parse cached data since it's stored as a string
        } else {
            console.log('Fetching users from database');
            const users = await User.find();
            await redisclient.set(cacheKey, JSON.stringify(users)); // Store users data as string in cache
            res.status(200).json(users);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - password
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User already exists with this email or mobile number
 *       500:
 *         description: Internal server error
 */
router.post("/users", async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        const duplicateUser = await User.findOne({ $or: [{ email }, { mobile }] });
        if (duplicateUser) {
            return res.status(400).json({ error: "User already exists with this email or mobile number" });
        }

        const newUser = new User({
            name,
            email,
            mobile,
            password
        });

        const savedUser = await newUser.save();
        const cacheKey = 'all-users';
        await redisclient.del(cacheKey);
        return res.status(201).json(savedUser);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
