import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  isBefore,
  startOfDay,
  endOfDay,
  parseISO,
  startOfHour,
} from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const whereClause = {};

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      whereClause.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      whereClause,
      order: ['date'],
      attributes: ['id', 'date', 'past'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      banner_id: Yup.integer().required(),
      user_id: Yup.integer().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ message: 'Validation fails.' });

    const { date } = req.body;
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date()))
      return res.status(400).json({ error: 'Past dates are not permitted.' });

    const checkAvibility = await Meetup.findOne({
      where: { user_id: req.userId, date: hourStart },
    });

    if (checkAvibility)
      return res.status(400).json({ error: 'Meetup date is not available.' });

    const { title, description, location } = req.body;

    const meetup = await Meetup.create({
      title,
      description,
      location,
      date,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      banner_id: Yup.integer(),
      user_id: Yup.integer(),
      date: Yup.date(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ message: 'Validation fails.' });

    const exitMeetup = await Meetup.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['name'] }],
    });

    if (exitMeetup.user_id !== req.userId)
      return res.status(401).json({
        error: "You don't have permission to edit this meetup.",
      });

    if (exitMeetup.past)
      return res.status(401).json({
        error: 'You can only edit meetups that have not yet happened.',
      });

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Meetup date invalid' });
    }

    const meetup = await Meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['name'] }],
    });

    if (meetup.user_id !== req.userId)
      return res.status(401).json({
        error: "You don't have permission to delete this meetup.",
      });

    if (meetup.past)
      return res.status(401).json({
        error: 'You can only delete meetups that have not yet happened.',
      });

    await meetup.delete();
    return res.json(meetup);
  }
}

export default new MeetupController();
