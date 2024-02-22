const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/api");
const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const cors = require('cors');
const multer = require('multer');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const User = require('./userSchema');
const Agent = require('./agentSchema');
const Contact = require('./contactSchema');
const House = require('./houseSchema');
const Land = require('./landSchema');

app.listen(5000, function () {
    console.log("server is running.....")
});

app.get('/image/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, filename);
    
    // Send the image file
    res.sendFile(imagePath);
});

app.get("/users", async (req, res) => {
    const users = await User.find();
    return res.status(200).json(users);
});

app.get("/houses", async (req, res) => {
    const houses = await House.find();
    return res.status(200).json(houses);
});

app.get("/lands", async (req, res) => {
    const lands = await Land.find();
    return res.status(200).json(lands);
});

app.get("/agents", async (req, res) => {
    const agents = await Agent.find();
    return res.status(200).json(agents);
});

app.get("/contacts", async (req, res) => {
    try {
        const contacts = await Contact.find();
        const count = contacts.length; // Calculate the count
        res.json({ contacts, count });
      } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
});

app.post("/users", async (req, res) => {
    try {
        const { name, email, mobile, password} = req.body;

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
        return res.status(201).json(savedUser);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/agents", async (req, res) => {
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
        return res.status(201).json(savedAgent);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/contacts", async (req, res) => {
    try {
        const { name, email, subject, message} = req.body;

        const newContact = new Contact({
            name,
            email,
            subject,
            message
        });

        const savedContact = await newContact.save();
        return res.status(201).json(savedContact);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads') // Destination folder for uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename for each uploaded image
    }
});

// Multer file upload configuration
const upload = multer({ storage: storage });

app.post('/houses', upload.array('images', 10), async (req, res) => {
    try {
        const {
            userId, // Add userId to the destructured request body
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

        const images = req.files.map(file => file.path); // Get paths of uploaded images

        // Create a new house object
        const newHouse = new House({
            userId, // Include userId in the new house object
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
      
        // Save the new house object to the database
        await newHouse.save();

        res.status(201).json({ message: 'House posted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/lands', upload.array('images', 10), async (req, res) => {
    try {
        const {
            userId, // Add userId to the destructured request body
            title,
            location,
            price,
            area,
            description,
            contactInfo
        } = req.body;

        const images = req.files.map(file => file.path); // Get paths of uploaded images

        // Create a new land object
        const newLand = new Land({
            userId, // Include userId in the new land object
            title,
            location,
            price,
            area,
            description,
            contactInfo,
            images
        });

        // Save the new land object to the database
        await newLand.save();

        res.status(201).json({ message: 'Land posted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Delete a house
// Delete a house
app.post('/deleteHouse/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Delete the house based on the provided ID
      await House.findByIdAndDelete(id);
  
      // Respond with a success message
      res.status(200).json({ message: 'House deleted successfully' });
    } catch (error) {
      // If an error occurs during deletion, respond with an error message
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Delete a land
app.post('/deleteLand/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Delete the land based on the provided ID
      await Land.findByIdAndDelete(id);
  
      // Respond with a success message
      res.status(200).json({ message: 'Land deleted successfully' });
    } catch (error) {
      // If an error occurs during deletion, respond with an error message
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  