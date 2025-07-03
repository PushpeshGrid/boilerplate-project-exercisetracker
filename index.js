
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});





// --- In-Memory Data Storage ---
// This is where our 'database' lives in memory.
let users = []; // Array to store user objects
let nextUserId = 1; // Counter for generating unique user IDs



// this is my Helper function to generate a simple unique ID
const generateUniqueId = () => {
  return String(nextUserId++);
};

// Helper function to validate and format date (for robust date parsing)
const isValidDate = (dateString) => {
    // Attempt to parse the date and check if it's a valid date
    const d = new Date(dateString);
    return !isNaN(d.getTime());
};

// API Endpoints

// Test 2: POST to /api/users with form data username to create a new user.
// Test 3: The returned response from POST /api/users with form data username will be an object with username and _id properties.
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  if (!username) {
    console.log('Error: Username is required for /api/users POST');
    return res.status(400).json({ error: 'Username is required' });
  }

  // Checking if username already exists to ensure uniqueness
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    console.log(`Error: Username '${username}' already exists.`);
    return res.status(409).json({ error: 'Username already exists' });
  }

  const newUser = {
    username: username,
    _id: generateUniqueId(),
    log: [] // Each user will have an array to store their exercises
  };
  users.push(newUser);
  console.log('New user created:', newUser);
  res.json({ username: newUser.username, _id: newUser._id });
});




// Test 4: making a GET request to /api/users to get a list of all users.
// Test 5: The GET request to /api/users returns an array.
// Test 6: Each element in the array returned from GET /api/users is an object literal containing a user's username and _id.
app.get('/api/users', (req, res) => {
  // Return only username and _id as per the requirements
  const usersList = users.map(user => ({ username: user.username, _id: user._id }));
  console.log('Returning all users:', usersList);
  res.json(usersList);
});





// Test 7: You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
// Test 8: The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id; // This is the :_id from the URL
  const { description, duration, date } = req.body;

  console.log(`POST /api/users/${userId}/exercises received.`);
  console.log('Request parameters (_id):', req.params._id);
  console.log('Request body:', req.body);

  try {
    if (!description || !duration) {
      console.log('Error: Description or duration missing.');
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum)) {
      console.log('Error: Duration is not a number.');
      return res.status(400).json({ error: 'Duration must be a number' });
    }

    const user = users.find(u => u._id === userId);
    if (!user) {
      console.log(`Error: User with ID ${userId} not found.`);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User found:', user.username);

    let exerciseDate;
    if (date) {
      if (!isValidDate(date)) {
          console.log(`Error: Invalid date format for '${date}'.`);
          return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      exerciseDate = new Date(date);
    } else {
      exerciseDate = new Date(); // Use current date if not provided
      console.log('Date not provided, using current date:', exerciseDate.toDateString());
    }

    const newExercise = {
      description: description,
      duration: durationNum,
      date: exerciseDate.toDateString() // Test 15: Use the dateString format of the Date API.
    };

    user.log.push(newExercise);
    console.log('New exercise added to user log:', newExercise);
    console.log('User log after adding exercise (first 5 items):', user.log.slice(0, 5)); // Log a slice to avoid huge output





    // Test 8: The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.
    // The structure matches the "Exercise" example given in the problem description.
    res.json({
      _id: user._id,
      username: user.username,
      date: newExercise.date,
      duration: newExercise.duration,
      description: newExercise.description
    });
    console.log('Response sent for adding exercise.');

  } catch (error) {
    console.error('An unexpected error occurred in /api/users/:_id/exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Test 9:  making a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
// Test 10: A request to a user's log GET /api/users/:_id/logs returns a user object with a count property.
// Test 11: A GET request to /api/users/:_id/logs will return the user object with a log array.
// Test 12: Each item in the log array ... should have a description, duration, and date properties.
// Test 13: The description property ... should be a string.
// Test 14: The duration property ... should be a number.
// Test 15: The date property ... should be a string. Use the dateString format of the Date API.
// Test 16: adding from, to and limit parameters to a GET /api/users/:_id/logs request.
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  console.log(`GET /api/users/${userId}/logs received.`);
  console.log('Query parameters:', { from, to, limit });

  const user = users.find(u => u._id === userId);
  if (!user) {
    console.log(`Error: User with ID ${userId} not found for logs.`);
    return res.status(404).json({ error: 'User not found' });
  }
  console.log('User found for logs:', user.username);
  console.log('Original user log length:', user.log.length);

  let filteredLog = [...user.log]; // Create a copy to manipulate

  // Filter by 'from' date
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      filteredLog = filteredLog.filter(exercise => new Date(exercise.date) >= fromDate);
      console.log('Filtered by from date. Log length:', filteredLog.length);
    } else {
      console.log(`Warning: Invalid 'from' date format: ${from}`);
    }
  }

  // Filter by 'to' date
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
        // To ensure 'to' includes the entire day, set it to the end of the day
        toDate.setHours(23, 59, 59, 999);
      filteredLog = filteredLog.filter(exercise => new Date(exercise.date) <= toDate);
      console.log('Filtered by to date. Log length:', filteredLog.length);
    } else {
        console.log(`Warning: Invalid 'to' date format: ${to}`);
    }
  }

  // Apply limit
  if (limit) {
    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      filteredLog = filteredLog.slice(0, parsedLimit);
      console.log('Applied limit. Log length:', filteredLog.length);
    } else {
        console.log(`Warning: Invalid 'limit' value: ${limit}`);
    }
  }

  // Ensure output date format is correct (already handled when saving, but double-check for robustness)
  const formattedLog = filteredLog.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString() // Ensure correct date string format
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: formattedLog.length,
    log: formattedLog
  });
  console.log('Response sent for exercise log. Count:', formattedLog.length);
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});