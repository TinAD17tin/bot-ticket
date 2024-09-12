const mongoose = require('mongoose');

const TicketSetupSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  roleId: { type: String, required: true },
  embedTitle: { type: String, required: true },
  embedDescription: { type: String, required: true },
  categoryId: { type: String, required: true }
});

module.exports = mongoose.model('TicketSetup', TicketSetupSchema);
