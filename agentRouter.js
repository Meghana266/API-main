const express = require("express");
const router = express.Router();
// Redis setup
const { Redis } = require('@upstash/redis');

const redisclient = new Redis({
  url: 'https://definite-ocelot-48067.upstash.io',
  token: 'AbvDAAIncDEwMTgwYzIwZDk0N2Q0MDM1OWZmN2JiYTc2ODYyMTI2YXAxNDgwNjc',
})

const Agent = require('./agentSchema');

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Get all agents
 *     description: Retrieve a list of all agents.
 *     responses:
 *       200:
 *         description: A list of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agent'
 *       500:
 *         description: Internal server error
 * 
 *   post:
 *     summary: Create a new agent
 *     description: Create a new agent with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewAgent'
 *     responses:
 *       201:
 *         description: Agent created successfully
 *       400:
 *         description: Agent already exists with this email or mobile number
 *       500:
 *         description: Internal Server Error
 */

router.get("/agents", async (req, res) => {
    try {
        const cacheKey = 'all-agents';
        const cachedData = await redisclient.get(cacheKey);
            if (cachedData) {
                console.log('Retrieving agents from cache');
                res.send(cachedData);
            } else {
                console.log('Fetching agents from database');
                const agents = await Agent.find();
                await redisclient.set(cacheKey, JSON.stringify(agents));
                res.status(200).json(agents);
            }
    }
    catch (error) {
        console.error("Error fetching agents:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/agents", async (req, res) => {
    try {
        const { name, email, mobile, password, profession, experience} = req.body;

        const duplicateAgent = await Agent.findOne({ $or: [{ email }, { mobile }] });
        if (duplicateAgent) {
            return res.status(400).json({ error: "Agent already exists with this email or mobile number" });
        }

        const newAgent = new Agent({
            name,
            email,
            mobile,
            password,
            profession,
            experience
        });

        const savedAgent = await newAgent.save();
        
        // Clear cache for agents since data is updated
        const cacheKey = 'all-agents';
        
        await redisclient.del(cacheKey);

        return res.status(201).json(savedAgent);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /agents/profile/{userId}:
 *   put:
 *     summary: Update agent profile
 *     description: Update the profile of an agent.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the agent's profile to update.
 *         schema:
 *           type: string
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
 *               profession:
 *                 type: string
 *               experience:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - password
 *               - profession
 *               - experience
 *     responses:
 *       200:
 *         description: Agent profile updated successfully
 *       404:
 *         description: Agent profile not found
 *       500:
 *         description: Internal server error
 */

router.put('/agents/profile/:userId', async (req, res) => {
    const userId = req.params.userId;
    const formData = req.body;

    try {
        const updatedProfile = await Agent.findByIdAndUpdate(userId, formData, { new: true });

        if (!updatedProfile) {
            return res.status(404).json({ error: 'Agent profile not found' });
        }

        // Clear cache for agents since data is updated
        const cacheKey = 'all-agents';
        
        await redisclient.del(cacheKey);

        return res.status(200).json({ message: 'Agent profile updated successfully', updatedProfile });
    } catch (error) {
        console.error('Error updating agent profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /agents/{id}:
 *   put:
 *     summary: Update agent verification status
 *     description: Update the verification status of an agent.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the agent to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_verified:
 *                 type: boolean
 *             required:
 *               - is_verified
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *       500:
 *         description: Internal Server Error
 */

router.put("/agents/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { is_verified } = req.body;

        // Update the agent's isVerified field based on the provided ID
        await Agent.findByIdAndUpdate(id, { $set: { is_verified } });
        // Clear cache for agents since data is updated
        const cacheKey = 'all-agents';
        
        await redisclient.del(cacheKey);
        res.status(200).json({ message: 'Agent updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
