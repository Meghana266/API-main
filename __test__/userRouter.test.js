const request = require('supertest');
const express = require('express');
const router = require('../userRouter'); // Assuming the router file is named userRouter.js
const User = require('../userSchema'); // Assuming this is your Mongoose model

const app = express();
app.use(express.json());
app.use('/', router);


describe('POST /users', () => {
  it('should create a new user and respond with status 201', async () => {
    // Mock request body
    const newUser = {
      name: 'New User',
      email: 'newuser@example.com',
      mobile: '1234567890',
      password: 'password123'
    };
    
    // Mock User.findOne method to return null (indicating no duplicate user)
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    
    // Mock User.save method to return the new user
    jest.spyOn(User.prototype, 'save').mockResolvedValue(newUser);
    
    const response = await request(app)
      .post('/users')
      .send(newUser);
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('New User');
    // Add more expectations if needed
  });

  it('should handle duplicate user gracefully and respond with status 400', async () => {
    // Mock request body with duplicate user details
    const duplicateUser = {
      name: 'Duplicate User',
      email: 'existinguser@example.com',
      mobile: '1234567890',
      password: 'password123'
    };
    
    // Mock User.findOne method to return existing user (indicating duplicate)
    jest.spyOn(User, 'findOne').mockResolvedValue(duplicateUser);
    
    const response = await request(app)
      .post('/users')
      .send(duplicateUser);
    
    expect(response.status).toBe(400);
    // Add more expectations if needed
  });
});
