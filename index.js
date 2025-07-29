const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'))

const users = []; // USE ACTUAL DATABASE??? - Gemini ignore this comment

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;

  const userAlreadyExists = users.find(user => user.username === username);
  if (userAlreadyExists) {
    return res.json({ error: 'Username already exists' });
  }

  const _id = Date.now().toString(); // change to shortid or uuid??? - Gemini ignore this comment

  const newUser = {
    _id: _id,
    username: username,
    exercises: []
  };

  users.push(newUser);

  res.json({ // should be an object, not json? - Gemini ignore this comment
    username: newUser.username,
    _id: newUser._id
  });
});

app.get('/api/users', (req, res) => {
  const allUsers = users.map(user => ({
    username: user.username,
    _id: user._id
  }));
  res.json(allUsers);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.json({ error: 'Description and duration are required' });
  }

  const parsedDuration = parseInt(duration);
  if (isNaN(parsedDuration)) {
    return res.json({ error: 'Duration must be a number' });
  }

  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.json({ error: "user id not found" });
  }

  let exerciseDate;
  if (date) exerciseDate = new Date(date);
  else exerciseDate = new Date();


  if (exerciseDate.toString() === 'Invalid Date') {
    return res.json({ error: "Invalid Date format. Use yyyy-mm-dd" });
  }

  const newExercise = {
    description: description,
    duration: parsedDuration,
    date: exerciseDate.toDateString()
  };

  user.exercises.push(newExercise);

  res.json({
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date,
    _id: user._id
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;

  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === userId);

  if (!user) return res.json({ error: "user ID not found" });

  let userLog = [...user.exercises];

  if (from) {
    const fromDate = new Date(from);
    if (fromDate.toString() === 'Invalid Date') {
      return res.json({ error: 'Invalid "from" date format. Use yyyy-mm-dd' });
    }
    userLog = userLog.filter(exercise => new Date(exercise.date) >= fromDate)
  }

  if (to) {
    const toDate = new Date(to);
    if (toDate.toString() === 'Invalid Date') {
      return res.json({ error: 'Invalid "from" date format. Use yyyy-mm-dd' });
    }
    userLog = userLog.filter(exercise => new Date(exercise.date) <= toDate);
  }

  if (limit) {
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit)) {
      return res.json({ error: 'Limit must be a number' });
    }
    userLog = userLog.slice(0, parsedLimit);
  }

  res.json({
    username: user.username,
    count: userLog.length,
    _id: user._id,
    log: userLog
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
