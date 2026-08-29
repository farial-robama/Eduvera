import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::quiz-result.quiz-result',
  ({ strapi }) => ({
    // Create Quiz Result
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { data } = ctx.request.body;

      if (!data?.quiz) {
        return ctx.badRequest('Quiz is required');
      }

      const result = await strapi
        .documents('api::quiz-result.quiz-result')
        .create({
          data: {
            ...data,
            student: user.id,
          },
        });

      return { data: result };
    },

    // Get current student's Quiz Results
    async find(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const results = await strapi
        .documents('api::quiz-result.quiz-result')
        .findMany({
          filters: {
            student: {
              id: {
                $eq: user.id,
              },
            },
          },
        });

      return {
        data: results,
        meta: {
          pagination: {
            page: 1,
            pageSize: results.length,
            pageCount: results.length > 0 ? 1 : 0,
            total: results.length,
          },
        },
      };
    },

    // Get one Quiz Result belonging to current student
    async findOne(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const results = await strapi
        .documents('api::quiz-result.quiz-result')
        .findMany({
          filters: {
            documentId: {
              $eq: ctx.params.documentId,
            },
            student: {
              id: {
                $eq: user.id,
              },
            },
          },
        });

      if (!results.length) {
        return ctx.notFound('Quiz result not found');
      }

      return {
        data: results[0],
      };
    },
  })
);