import { Op } from 'sequelize';
import * as Yup from 'yup';
import { isBefore } from 'date-fns';
import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
      limit: 10,
      offset: (page - 1) * 10,
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      meetupId: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ message: 'Validation fails.' });

    const { meetupId } = req.body;
    const user_id = req.userId;

    const meetup = await Meetup.findOne({
      where: { id: meetupId },
      include: [User],
    });

    if (isBefore(meetup.date, new Date()))
      return res.status(401).json({
        error:
          'You can only subscription in meetups that have not yet happened.',
      });

    if (!meetup || meetup.user_id === user_id)
      return res
        .status(400)
        .json({ error: 'Unable to join own meetup or meetup does not exist.' });

    const existSubscription = await Subscription.findOne({
      where: { meetup_id: meetupId, user_id },
    });

    if (existSubscription)
      return res
        .status(400)
        .json({ error: 'You are already subscribed to this meetup.' });

    const checkDate = await Subscription.findOne({
      where: {
        user_id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res.status(400).json({
        error:
          'You are already subscribed to a meetup that happens at the same time.',
      });
    }

    const subscription = await Subscription.create({
      user_id,
      meetup_id: meetupId,
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      User,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
