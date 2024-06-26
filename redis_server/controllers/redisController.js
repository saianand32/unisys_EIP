const User = require("../models/UserModel");
const Channels = require("../models/Channels");
const client = require('../redis/redisConnector');
const Data = require("../models/Data");

module.exports.publish = async (req, res, next) => {
  try {
    const { channel, message } = req.body;
    const { username, organization } = req.user;

    const user = await User.findOne({ username });
    const channelInDb = await Channels.findOne({ channelName: channel })

    if (!channelInDb) res.status(400).send({ status: false, msg: "no such channel exists !" });

    if (channelInDb.authorizedOrganizations.includes(user.organization)) {
      const publisher = client.duplicate();
      await publisher.connect();

      const data = await Data.create({
        publishedByUsername: username,
        publishedByOrganization: organization,
        channelName: channel,
        data: message
      })
      if(!data) res.status(400).send({ status: false, msg: "Some error" });

      await publisher.publish(channel, JSON.stringify({ username }));
      res.status(200).send({ status: true, msg: "Event published" });
    }
    else {
      res.send({ status: false, msg: "Your organization is not authorized to publish on this channel" });
    }

  } catch (ex) {
    next(ex);
  }
};


module.exports.subscribe = async (req, res, next) => {
  try {
    const { channelName } = req.body;
    const { username } = req.user;

    const user = await User.findOne({ username });
    const channelInDb = await Channels.findOne({ channelName })

    if (!channelInDb) res.status(400).send({ status: false, msg: "no such channel exists !" });

    if (channelInDb.authorizedOrganizations.includes(user.organization)) {

      const user = await User.findOne({ username })

      if (user.subscribedChannels.includes(channelName))
        res.send({ status: false, msg: "You are already subscribed" });

      await User.findByIdAndUpdate(user._id, { $addToSet: { subscribedChannels: channelName } });
      res.status(200).send({ status: true, msg: "Subscription successful" });
    }
    else {
      res.send({ status: false, msg: "Your organization is not authorized to subscribe to this channel" });
    }

  } catch (ex) {
    next(ex);
  }
};


module.exports.unsubscribe = async (req, res, next) => {
  try {
    const { channelName } = req.body;
    const { username } = req.user;

    const user = await User.findOne({ username });

    if (!user) {
      return res.send({ status: false, msg: "User not found" });
    }

    if (!user.subscribedChannels.includes(channelName)) {
      return res.send({ status: false, msg: "You are not subscribed to this channel" });
    }

    await User.findByIdAndUpdate(user._id, { $pull: { subscribedChannels: channelName } });
    res.status(200).send({ status: true, msg: "Unsubscribed successfully" });

  } catch (ex) {
    next(ex);
  }
};
