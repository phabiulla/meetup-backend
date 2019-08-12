import Sequelize, { Model } from 'sequelize';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        user_id: Sequelize.INTEGER,
        meetup_id: Sequelize.INTEGER,
      },
      { sequelize }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Meetup, { foreignKey: 'meetup_id' });
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}

export default User;
