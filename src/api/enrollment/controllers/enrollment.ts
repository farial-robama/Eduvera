import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to enroll.');
    }

    ctx.request.body.data = {
      ...ctx.request.body.data,
      student: user.id,
    };

    const response = await super.create(ctx);
    return response;
  },
}));