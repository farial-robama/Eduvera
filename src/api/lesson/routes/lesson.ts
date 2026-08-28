import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::lesson.lesson', {
  config: {
    create: {
      policies: ['global::is-course-owner'],
    },
    update: {
      policies: ['global::is-course-owner'],
    },
    delete: {
      policies: ['global::is-course-owner'],
    },
  },
});