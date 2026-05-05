const prisma = require('../config/database');

async function logActivity({ actorId = null, actionType, description = null }) {
  return prisma.activityLog.create({
    data: {
      actorId,
      actionType,
      description,
    },
  });
}

module.exports = { logActivity };
