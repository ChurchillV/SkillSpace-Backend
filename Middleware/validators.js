const { body } = require('express-validator');

module.exports.validateUser = [
  body('firstname').notEmpty().withMessage('First name is required'),
  body('lastname').notEmpty().withMessage('Last name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('photo').optional().isString().withMessage('Photo must be a string'),
  body('othernames').optional().isString().withMessage('Othernames must be a string'),
];


module.exports.validateOrganizer = [
     body('name')
    .notEmpty().withMessage('Organizer name is required')
    .isString().withMessage('Organizer name must be a string'),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),

  body('photo')
    .optional()
    .isString().withMessage('Photo must be a valid URL or string path'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),

  body('contact')
    .notEmpty().withMessage('Contact is required')
    .isString().withMessage('Contact must be a string'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
]

module.exports.validateWorkshop = [
  body('name').notEmpty().withMessage('Workshop Name is required'),
  body('date').notEmpty().withMessage('Workshop start date is required'),
  body('venue').notEmpty().withMessage('Workshop Venue is rerquired'),
  body('chatLink').notEmpty().withMessage('Workshop Group Link is required'),
  body('organizerId').notEmpty().withMessage('Organizer ID is required')
]