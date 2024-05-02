const request = require('supertest');
const express = require('express');
const router = require('../agentRouter'); // Assuming the router file is named agentRouter.js
const Agent = require('../agentSchema'); // Assuming this is your Mongoose model

const app = express();
app.use(express.json());
app.use('/', router);

describe('GET /agents', () => {
  it('should respond with status 200 and return agents', async () => {
    // Mock Agent.find method to return sample agents
    const mockAgents = [
      { name: 'Agent 1' },
      { name: 'Agent 2' },
      { name: 'Agent 3' },
      { name: 'Agent 4' },
      { name: 'Agent 5' },
      { name: 'Agent 6' },
      { name: 'Agent 7' },
      { name: 'Agent 8' }
    ];
    jest.spyOn(Agent, 'find').mockResolvedValue(mockAgents);
    
    const response = await request(app).get('/agents');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(8); // Assuming eight agents are returned
    expect(response.body[0].name).toBe('sanju');
    expect(response.body[1].name).toBe('John');
    // Add more expectations for other agents if needed
  });
});
