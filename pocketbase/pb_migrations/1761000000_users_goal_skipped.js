/// <reference path="../pb_data/types.d.ts" />
// « Ignorer l'objectif » à l'inscription : retenu sur le compte, pour ne plus le demander à chaque connexion.
// Chacun ne modifie que son propre compte (règle par défaut de la collection `users`).

migrate((app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.add(new BoolField({ name: "goal_skipped" }));
    app.save(users);
}, (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.removeByName("goal_skipped");
    app.save(users);
});
