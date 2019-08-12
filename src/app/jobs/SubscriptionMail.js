import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, User } = data;

    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.usUserer.email}>`,
      subject: `[${meetup.title}] - Nova inscrição`,
      template: 'subscription',
      context: {
        organizer: meetup.User.name,
        meetup: meetup.title,
        user: User.name,
        email: User.email,
      },
    });
  }
}

export default new SubscriptionMail();
