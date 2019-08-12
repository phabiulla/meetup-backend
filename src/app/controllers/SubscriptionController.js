import { hourStart } from 'date-fsn';
import Meetup from '../models/Meetup';
import { Subscription } from 'rxjs';

class SubscriptionController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const meetups = await Meetup.findAll({
      where: {
        date: { [Op.gt]: new Date() },
      },
      order: ['date'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: Subscription,
          as: 'subscription',
          where: { user_id: req.userId },
        },
      ],
    });
    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      meetup_id: Yup.integer().required(),
    });

    if (!(await schema.isValid()))
      return res.status(400).json({ message: 'Validation fails.' });

    const { meetup_id } = req.body;
    const user_id = req.userId;

    const meetup = await Meetup.findOne({
      where: { id: req.meetup_id },
    });

    if (isBefore(meetup.date, new Date()))
      return res.status(401).json({
        error:
          'You can only subscription in meetups that have not yet happened.',
      });

    if (!meetup || meetup.user_id == user_id)
      return res
        .status(400)
        .json({ error: 'Unable to join own meetup or meetup does not exist.' });

    const subscription = await Subscription.findOne({
      where: { meetup_id: req.meetup_id, user_id: user_id },
    });

    if (subscription)
      return res
        .status(400)
        .json({ error: 'You are already subscribed to this meetup.' });

    const idsMeetup = await Meetup.findAll({
      attributes: ['id'],
      where: { date: meetup.date },
    });

    const subscription = await Subscription.findOne({
      where: {
        id: {
          [Op.in]: idsMeetup,
        },
      },
    });

    if (subscription)
      return res.status(400).json({
        error:
          'You are already subscribed to a meetup that happens at the same time.',
      });

    const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
