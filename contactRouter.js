const express = require("express");
const router = express.Router();

// Redis setup
const { Redis } = require('@upstash/redis');

const redisclient = new Redis({
  url: 'https://definite-ocelot-48067.upstash.io',
  token: 'AbvDAAIncDEwMTgwYzIwZDk0N2Q0MDM1OWZmN2JiYTc2ODYyMTI2YXAxNDgwNjc',
})

// Import your models
const Contact = require('./contactSchema');
const ContactRequest = require('./contactRequestSchema');
const Payment = require('./paymentSchema'); 

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts
 *     description: Retrieve a list of all contacts.
 *     responses:
 *       200:
 *         description: A list of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *                 count:
 *                   type: number
 *       500:
 *         description: Internal server error
 */

router.get("/contacts", async (req, res) => {
    try {
        const cacheKey = 'all-contacts';
        const cachedData = await redisclient.get(cacheKey);

            if (cachedData) {
                console.log('Retrieving contacts from cache');
                res.send(cachedData); // Parse cached data before sending
            } else {
                console.log('Fetching contacts from database');
                // Fetch contacts from the database
                const contacts = await Contact.find();
                const count = contacts.length;
                const contactsData = { contacts, count };
                
                // Cache the fetched contacts data
                await redisclient.set(cacheKey, JSON.stringify(contactsData)); // Stringify data before caching
                res.status(200).json(contactsData);
            }
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create a new contact
 *     description: Create a new contact with the provided details.
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
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       500:
 *         description: Internal Server Error
 */

router.post("/contacts", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const newContact = new Contact({
            name,
            email,
            subject,
            message
        });

        const savedContact = await newContact.save();

        const cacheKey = 'all-contacts';
        
        await redisclient.del(cacheKey);

        return res.status(201).json(savedContact);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


/**
 * @swagger
 * /contactRequest:
 *   post:
 *     summary: Send contact request
 *     description: Send a contact request with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender:
 *                 type: string
 *               recipientType:
 *                 type: string
 *               recipient:
 *                 type: string
 *               message:
 *                 type: string
 *             required:
 *               - sender
 *               - recipientType
 *               - recipient
 *               - message
 *     responses:
 *       201:
 *         description: Contact request sent successfully
 *       500:
 *         description: Internal Server Error
 */

router.post('/contactRequest', async (req, res) => {
    try {
        // Destructure the required fields from the request body
        const { sender, recipientType, recipient, message } = req.body;

        // Create a new contact request document
        const newContactRequest = new ContactRequest({
            sender,
            recipientType,
            recipient,
            message,
        });

        // Save the new contact request to the database
        const savedContactRequest = await newContactRequest.save();

        // Clear the contact requests cache to ensure the latest data is fetched on the next request
        const cacheKey = 'all-contact-requests';
        
        await redisclient.del(cacheKey);

        // Respond with a success message
        res.status(201).json(savedContactRequest);
    } catch (error) {
        console.error('Error sending message:', error);
        // If an error occurs during submission, respond with an error message
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /contactRequests:
 *   get:
 *     summary: Get all contact requests
 *     description: Retrieve a list of all contact requests.
 *     responses:
 *       200:
 *         description: A list of contact requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContactRequest'
 *       500:
 *         description: Internal server error
 */

router.get('/contactRequests', async (req, res) => {
    try {
        const cacheKey = 'all-contact-requests';
        
        const cachedData = await redisclient.get(cacheKey);

            if (cachedData) {
                console.log('Retrieving contact requests from cache');
                // If data exists in cache, return it
                res.status(200).json(cachedData);
            } else {
                console.log('Fetching contact requests from database');
                // If data doesn't exist in cache, fetch it from the database
                const requests = await ContactRequest.find();
                await redisclient.set(cacheKey,JSON.stringify(requests));
                // Return the fetched data
                res.status(200).json(requests);
            }
    } catch (error) {
        console.error('Error fetching contact requests:', error);
        // If an error occurs during fetching, respond with an error message
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @swagger
 * /contactRequest/{id}:
 *   put:
 *     summary: Update contact request status
 *     description: Update the status of a contact request.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the contact request to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Contact request status updated successfully
 *       404:
 *         description: Contact request not found
 *       500:
 *         description: Internal Server Error
 */

router.put('/contactRequest/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const contactRequest = await ContactRequest.findByIdAndUpdate(id, { status }, { new: true });

        if (!contactRequest) {
            return res.status(404).json({ message: 'Contact request not found' });
        }

        // Invalidate the cached data for contact requests
        const cacheKey = 'all-contact-requests';
        await redisclient.del(cacheKey);

        res.status(200).json({ message: 'Contact request status updated successfully', contactRequest });
    } catch (error) {
        console.error('Error updating contact request status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /process-payment:
 *   post:
 *     summary: Process payment
 *     description: Process a payment with the provided payment details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cardNumber:
 *                 type: string
 *               expirationMonth:
 *                 type: string
 *               expirationYear:
 *                 type: string
 *               securityCode:
 *                 type: string
 *             required:
 *               - name
 *               - cardNumber
 *               - expirationMonth
 *               - expirationYear
 *               - securityCode
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: All fields are required
 *       500:
 *         description: Payment failed. Please try again later.
 */

router.post('/process-payment', async (req, res) => {
    const formData = req.body;

    // Perform validation - You should add more validation logic as per your requirements
    if (!formData.name || !formData.cardNumber || !formData.expirationMonth || !formData.expirationYear || !formData.securityCode) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newPayment = new Payment(formData);
        await newPayment.save();

        // Invalidate the cached data for payments
        const cacheKey = 'all-payments';
        await redisclient.del(cacheKey);

        res.status(200).json({ message: 'Payment processed successfully' });
    } catch (error) {
        console.error('Error processing payment:', error);
        // Send an error response
        res.status(500).json({ error: 'Payment failed. Please try again later.' });
    }
});

module.exports = router;
