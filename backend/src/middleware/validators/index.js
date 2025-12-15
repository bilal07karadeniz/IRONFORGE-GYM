const authValidators = require('./auth.validator');
const trainerValidators = require('./trainer.validator');
const classValidators = require('./class.validator');
const scheduleValidators = require('./schedule.validator');
const bookingValidators = require('./booking.validator');
const adminValidators = require('./admin.validator');

module.exports = {
  ...authValidators,
  ...trainerValidators,
  ...classValidators,
  ...scheduleValidators,
  ...bookingValidators,
  ...adminValidators,
};
