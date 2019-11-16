const config = require('config');
const startupDebugger = require('debug')('app:startup');
const dbDebugger = require('debug')('app:db');
const morgan = require('morgan');
const helmet = require('helmet');
const Joi = require('joi');  
const logger = require('./logger');
const express = require('express');
const app = express();

app.set('view engine', 'pug'); // engines: pug,mustache,ejs
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());

// Configuration
console.log('Application Name: ' + config.get('name'));
console.log('Mail Server: ' + config.get('mail.host'));
console.log('Mail Password: ' + config.get('mail.password'));

if (app.get('env') === 'development') {
  app.use(morgan('tiny'));
  startupDebugger('Morgan enabled...');
}

// Db work...
dbDebugger('Connected to the database...');

app.use(logger);


const courses = [
  { id: 1, name: 'course1' },
  { id: 2, name: 'course2' },
  { id: 3, name: 'course3' }
];

app.get('/', (req, res) => {
  res.render('index', { title: 'My Express App', message: 'Hello'});
});

app.get('/api/courses', (req, res) => {
  res.send(courses);
});

app.get('/api/course/:id', (req, res) => {
  const course = courses.find(c => c.id == parseInt(req.params.id));
  if (!course) res.status(404).send('The course with the given id was not found');
  res.send(course);
});

app.post('/api/course', (req, res) => {
  const { error } = validateCourse(req.body); 
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }

  const course = {
    id: courses.length + 1,
    name: req.body.name
  };

  courses.push(course);
  res.send(course);
});

app.put('/api/course/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).send('The course with the given id was not found');

  const { error } = validateCourse(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  course.name = req.body.name;
  res.send(course);
});

app.delete('/api/course/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).send('The course with the given id was not found');

  // Delete
  const index = courses.indexOf(course);
  courses.splice(index, 1);

  res.send(course);
});

function validateCourse(course ) {
  const schema = {
    name: Joi.string().min(3).required()
  };

  return Joi.validate(course, schema);
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
