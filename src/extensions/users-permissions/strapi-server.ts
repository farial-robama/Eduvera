export default (plugin: any) => {
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx: any) => {
    const { username, email, password, role } = ctx.request.body;

   
    if (!["student", "instructor"].includes(role)) {
      return ctx.badRequest(
        "Invalid role. Only student or instructor is allowed."
      );
    }

   
    const userRole = await strapi.db
      .query("plugin::users-permissions.role")
      .findOne({
        where: {
          type: role,
        },
      });

    if (!userRole) {
      return ctx.badRequest(
        `Role "${role}" does not exist in Strapi.`
      );
    }

    
    delete ctx.request.body.role;

    
    await originalRegister(ctx);

    
    if (!ctx.body?.user?.id) {
      return;
    }

   
    await strapi.db
      .query("plugin::users-permissions.user")
      .update({
        where: {
          id: ctx.body.user.id,
        },
        data: {
          role: userRole.id,
        },
      });

   
    ctx.body.user.role = userRole;
  };

  return plugin;
};