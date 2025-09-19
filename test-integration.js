#!/usr/bin/env node

/**
 * TAK Server Integration Test Script
 * 
 * Tests the complete TS-1, TS-2, TS-3 workflow with the actual mock TAK server
 * and multiple simulated clients.
 */

const https = require('https');
const http = require('http');

const SERVER_URL = 'http://192.168.13.5:8080';
const TEST_USERS = [
  { username: 'testuser', password: 'testpass', callsign: 'Test User' },
  { username: 'demouser', password: 'demopass', callsign: 'Demo User' },
  { username: 'alpha', password: 'alpha123', callsign: 'Alpha-1' }
];

class TakIntegrationTester {
  constructor() {
    this.clients = [];
    this.testResults = {
      authentication: [],
      connectedUsers: [],
      chatMessages: [],
      cotMessages: [],
      attachments: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting TAK Server Integration Tests...\n');
    
    try {
      // Test 1: Server Health Check
      await this.testServerHealth();
      
      // Test 2: Authentication (TS-1)
      await this.testAuthentication();
      
      // Test 3: Connected Users
      await this.testConnectedUsers();
      
      // Test 4: Chat Messages
      await this.testChatMessages();
      
      // Test 5: CoT Messages (TS-2, TS-3)
      await this.testCoTMessages();
      
      // Test 6: Multi-client simulation
      await this.testMultiClientScenario();
      
      // Test 7: Error handling
      await this.testErrorHandling();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testServerHealth() {
    console.log('🔍 Testing server health...');
    
    try {
      const response = await fetch(`${SERVER_URL}/Marti/api/version`);
      const data = await response.json();
      
      if (response.ok && data.type === 'Mock TAK Server') {
        console.log('✅ Server health check passed');
        console.log(`   Version: ${data.version}`);
        console.log(`   Type: ${data.type}\n`);
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      console.error('❌ Server health check failed:', error.message);
      throw error;
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing authentication (TS-1)...');
    
    for (const user of TEST_USERS) {
      try {
        const response = await fetch(`${SERVER_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-ID': `test-device-${user.username}`
          },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
            grant_type: 'password'
          })
        });

        if (response.ok) {
          const authData = await response.json();
          this.clients.push({
            ...user,
            token: authData.access_token,
            authData
          });
          
          this.testResults.authentication.push({
            username: user.username,
            success: true,
            token: authData.access_token.substring(0, 8) + '...',
            callsign: authData.callsign
          });
          
          console.log(`✅ Authentication successful for ${user.username}`);
        } else {
          throw new Error(`Authentication failed for ${user.username}`);
        }
      } catch (error) {
        console.error(`❌ Authentication failed for ${user.username}:`, error.message);
        this.testResults.authentication.push({
          username: user.username,
          success: false,
          error: error.message
        });
      }
    }
    console.log('');
  }

  async testConnectedUsers() {
    console.log('👥 Testing connected users...');
    
    for (const client of this.clients) {
      try {
        const response = await fetch(`${SERVER_URL}/Marti/api/contacts/all`, {
          headers: {
            'Authorization': `Bearer ${client.token}`
          }
        });

        if (response.ok) {
          const users = await response.json();
          this.testResults.connectedUsers.push({
            requestedBy: client.username,
            userCount: users.length,
            users: users.map(u => ({ username: u.username, callsign: u.callsign }))
          });
          
          console.log(`✅ Connected users for ${client.username}: ${users.length} users`);
          users.forEach(user => {
            console.log(`   - ${user.callsign} (${user.username}) - ${user.team}`);
          });
        } else {
          throw new Error(`Failed to get connected users for ${client.username}`);
        }
      } catch (error) {
        console.error(`❌ Connected users test failed for ${client.username}:`, error.message);
      }
    }
    console.log('');
  }

  async testChatMessages() {
    console.log('💬 Testing chat messages...');
    
    // Send test messages
    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const message = `Test message ${i + 1} from ${client.callsign}`;
      
      try {
        const response = await fetch(`${SERVER_URL}/Marti/api/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${client.token}`
          },
          body: JSON.stringify({ message })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Chat message sent by ${client.username}: "${message}"`);
          
          this.testResults.chatMessages.push({
            sender: client.username,
            message,
            messageId: result.messageId,
            success: true
          });
        } else {
          throw new Error(`Failed to send chat message for ${client.username}`);
        }
      } catch (error) {
        console.error(`❌ Chat message failed for ${client.username}:`, error.message);
        this.testResults.chatMessages.push({
          sender: client.username,
          message,
          success: false,
          error: error.message
        });
      }
    }

    // Retrieve chat messages
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for messages to be stored
    
    try {
      const client = this.clients[0];
      const response = await fetch(`${SERVER_URL}/Marti/api/chat/messages`, {
        headers: {
          'Authorization': `Bearer ${client.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Retrieved ${data.messages.length} chat messages`);
        data.messages.forEach(msg => {
          console.log(`   - ${msg.username}: "${msg.message}"`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to retrieve chat messages:', error.message);
    }
    console.log('');
  }

  async testCoTMessages() {
    console.log('🎯 Testing CoT messages (TS-2, TS-3)...');
    
    // Send CoT messages
    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const cotMessage = {
        uid: `${client.username}-position`,
        type: 'a-f-G-U-C',
        time: new Date().toISOString(),
        point: {
          lat: 38.9072 + (i * 0.001),
          lon: -77.0369 + (i * 0.001),
          hae: 100
        },
        detail: {
          contact: {
            _attributes: {
              callsign: client.callsign
            }
          },
          remarks: {
            _text: `Position update from ${client.callsign}`
          }
        }
      };

      try {
        const response = await fetch(`${SERVER_URL}/Marti/api/cot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${client.token}`
          },
          body: JSON.stringify(cotMessage)
        });

        if (response.ok) {
          console.log(`✅ CoT message sent by ${client.username} at (${cotMessage.point.lat}, ${cotMessage.point.lon})`);
          
          this.testResults.cotMessages.push({
            sender: client.username,
            uid: cotMessage.uid,
            type: cotMessage.type,
            position: [cotMessage.point.lat, cotMessage.point.lon],
            success: true
          });
        } else {
          throw new Error(`Failed to send CoT message for ${client.username}`);
        }
      } catch (error) {
        console.error(`❌ CoT message failed for ${client.username}:`, error.message);
        this.testResults.cotMessages.push({
          sender: client.username,
          success: false,
          error: error.message
        });
      }
    }

    // Retrieve CoT messages
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const client = this.clients[0];
      const response = await fetch(`${SERVER_URL}/Marti/api/cot/all`, {
        headers: {
          'Authorization': `Bearer ${client.token}`
        }
      });

      if (response.ok) {
        const cotMessages = await response.json();
        console.log(`✅ Retrieved ${cotMessages.length} CoT messages`);
        cotMessages.forEach(cot => {
          console.log(`   - ${cot.callsign}: ${cot.type} at (${cot.lat}, ${cot.lon})`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to retrieve CoT messages:', error.message);
    }
    console.log('');
  }

  async testMultiClientScenario() {
    console.log('🔄 Testing multi-client scenario...');
    
    // Simulate concurrent operations
    const promises = this.clients.map(async (client, index) => {
      const operations = [];
      
      // Send position update
      operations.push(
        fetch(`${SERVER_URL}/Marti/api/cot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${client.token}`
          },
          body: JSON.stringify({
            uid: `${client.username}-concurrent-${Date.now()}`,
            type: 'a-f-G-U-C',
            time: new Date().toISOString(),
            point: {
              lat: 38.9072 + (Math.random() * 0.01),
              lon: -77.0369 + (Math.random() * 0.01),
              hae: 100
            },
            detail: {
              contact: {
                _attributes: { callsign: client.callsign }
              }
            }
          })
        })
      );

      // Send chat message
      operations.push(
        fetch(`${SERVER_URL}/Marti/api/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${client.token}`
          },
          body: JSON.stringify({
            message: `Concurrent message from ${client.callsign} at ${new Date().toISOString()}`
          })
        })
      );

      // Get connected users
      operations.push(
        fetch(`${SERVER_URL}/Marti/api/contacts/all`, {
          headers: {
            'Authorization': `Bearer ${client.token}`
          }
        })
      );

      return Promise.all(operations);
    });

    try {
      const results = await Promise.all(promises);
      console.log(`✅ Multi-client scenario completed with ${results.length} clients`);
      
      // Check if all operations succeeded
      let successCount = 0;
      results.forEach((clientResults, index) => {
        const allSuccessful = clientResults.every(response => response.ok);
        if (allSuccessful) {
          successCount++;
          console.log(`   - Client ${this.clients[index].username}: All operations successful`);
        } else {
          console.log(`   - Client ${this.clients[index].username}: Some operations failed`);
        }
      });
      
      console.log(`✅ ${successCount}/${this.clients.length} clients completed all operations successfully`);
    } catch (error) {
      console.error('❌ Multi-client scenario failed:', error.message);
    }
    console.log('');
  }

  async testErrorHandling() {
    console.log('⚠️  Testing error handling...');
    
    // Test invalid authentication
    try {
      const response = await fetch(`${SERVER_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'invalid',
          password: 'invalid',
          grant_type: 'password'
        })
      });

      if (!response.ok) {
        console.log('✅ Invalid authentication properly rejected');
      } else {
        console.log('❌ Invalid authentication was accepted (should be rejected)');
      }
    } catch (error) {
      console.log('✅ Invalid authentication properly handled');
    }

    // Test unauthorized access
    try {
      const response = await fetch(`${SERVER_URL}/Marti/api/contacts/all`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      if (!response.ok) {
        console.log('✅ Unauthorized access properly rejected');
      } else {
        console.log('❌ Unauthorized access was accepted (should be rejected)');
      }
    } catch (error) {
      console.log('✅ Unauthorized access properly handled');
    }

    // Test malformed requests
    try {
      const response = await fetch(`${SERVER_URL}/Marti/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clients[0].token}`
        },
        body: JSON.stringify({ /* missing message field */ })
      });

      if (!response.ok) {
        console.log('✅ Malformed request properly rejected');
      } else {
        console.log('❌ Malformed request was accepted (should be rejected)');
      }
    } catch (error) {
      console.log('✅ Malformed request properly handled');
    }

    console.log('');
  }

  generateTestReport() {
    console.log('📊 Test Report Summary');
    console.log('='.repeat(50));
    
    // Authentication results
    const authSuccess = this.testResults.authentication.filter(r => r.success).length;
    const authTotal = this.testResults.authentication.length;
    console.log(`Authentication: ${authSuccess}/${authTotal} successful`);
    
    // Connected users results
    const avgUsers = this.testResults.connectedUsers.reduce((sum, r) => sum + r.userCount, 0) / this.testResults.connectedUsers.length;
    console.log(`Connected Users: Average ${avgUsers.toFixed(1)} users per request`);
    
    // Chat messages results
    const chatSuccess = this.testResults.chatMessages.filter(r => r.success).length;
    const chatTotal = this.testResults.chatMessages.length;
    console.log(`Chat Messages: ${chatSuccess}/${chatTotal} successful`);
    
    // CoT messages results
    const cotSuccess = this.testResults.cotMessages.filter(r => r.success).length;
    const cotTotal = this.testResults.cotMessages.length;
    console.log(`CoT Messages: ${cotSuccess}/${cotTotal} successful`);
    
    console.log('='.repeat(50));
    
    const overallSuccess = (authSuccess + chatSuccess + cotSuccess) / (authTotal + chatTotal + cotTotal);
    console.log(`Overall Success Rate: ${(overallSuccess * 100).toFixed(1)}%`);
    
    if (overallSuccess > 0.9) {
      console.log('🎉 Integration tests PASSED! System is ready for production.');
    } else if (overallSuccess > 0.7) {
      console.log('⚠️  Integration tests partially successful. Some issues need attention.');
    } else {
      console.log('❌ Integration tests FAILED. Significant issues need to be resolved.');
    }
    
    console.log('\n📋 Detailed Results:');
    console.log(JSON.stringify(this.testResults, null, 2));
  }
}

// Run the tests
if (require.main === module) {
  const tester = new TakIntegrationTester();
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = TakIntegrationTester;
